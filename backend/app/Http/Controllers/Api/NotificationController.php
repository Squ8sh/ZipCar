<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Notification;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function overlaps(CarbonInterface $aStart, CarbonInterface $aEnd, CarbonInterface $bStart, CarbonInterface $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    private function isCarAvailable(int $carId, CarbonInterface $startAt, int $durationMinutes, ?int $ignoreBookingId = null): bool
    {
        $end = $startAt->copy()->addMinutes($durationMinutes);

        $query = Booking::query()
            ->where('car_id', $carId)
            ->whereIn('status', ['booked', 'active'])
            ->whereNotNull('start_at');

        if ($ignoreBookingId !== null) {
            $query->where('id', '!=', $ignoreBookingId);
        }

        $bookings = $query->get(['id', 'start_at', 'duration_minutes']);

        foreach ($bookings as $booking) {
            $otherStart = $booking->start_at;
            $otherEnd = $booking->start_at->copy()->addMinutes((int) $booking->duration_minutes);

            if ($this->overlaps($startAt, $end, $otherStart, $otherEnd)) {
                return false;
            }
        }

        return true;
    }

    public function index(Request $request)
    {
        return response()->json(
            Notification::query()
                ->where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->paginate(20)
        );
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->read_at = now();
        $notification->save();

        return response()->json(['ok' => true]);
    }

    public function action(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $data = $request->validate([
            'action' => ['required', 'in:replace,cancel'],
            'car_id' => ['nullable', 'integer', 'exists:cars,id'],
        ]);

        $notification->read_at = now();
        $notification->save();

        if ($notification->type !== 'booking_affected' || !$notification->booking_id) {
            return response()->json(['message' => 'Нельзя выполнить действие для этого уведомления'], 422);
        }

        $booking = Booking::query()->with('car')->findOrFail($notification->booking_id);

        if ($booking->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($booking->status !== 'booked') {
            return response()->json(['message' => 'Можно менять/отменять только бронь со статусом booked'], 422);
        }

        if ($data['action'] === 'cancel') {
            $booking->status = 'canceled';
            $booking->save();

            return response()->json(['ok' => true, 'booking' => $booking->load('car')]);
        }

        $carId = $data['car_id'] ?? null;
        if (!$carId) {
            return response()->json(['message' => 'Не передан car_id для замены'], 422);
        }

        $newCar = Car::findOrFail($carId);

        if ($newCar->class !== $booking->car->class) {
            return response()->json(['message' => 'Авто должно быть того же класса'], 422);
        }

        if (!$newCar->is_active || ($newCar->maintenance_until && $newCar->maintenance_until->isFuture())) {
            return response()->json(['message' => 'Выбранное авто сейчас недоступно'], 422);
        }

        if (!$this->isCarAvailable($newCar->id, $booking->start_at, (int) $booking->duration_minutes, $booking->id)) {
            return response()->json(['message' => 'Выбранное авто уже занято на это время'], 422);
        }

        $booking->car_id = $newCar->id;
        $booking->save();

        return response()->json(['ok' => true, 'booking' => $booking->load('car')]);
    }
}
