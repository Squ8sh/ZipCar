<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Notification;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;

class CarController extends Controller
{
    private function overlaps(CarbonInterface $aStart, CarbonInterface $aEnd, CarbonInterface $bStart, CarbonInterface $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    private function carHasConflict(int $carId, CarbonInterface $start, int $durationMinutes, ?int $ignoreBookingId = null): bool
    {
        $end = $start->copy()->addMinutes($durationMinutes);

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

            if ($this->overlaps($start, $end, $otherStart, $otherEnd)) {
                return true;
            }
        }

        return false;
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $query = Car::query()->orderByDesc('id');

        if ($q !== '') {
            $query->where('name', 'like', "%{$q}%");
        }

        return response()->json($query->paginate(20)->withQueryString());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'class' => ['required', 'in:economy,comfort,business,premium'],
            'img' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
        ]);

        $car = Car::create([
            ...$data,
            'is_active' => true,
            'maintenance_until' => null,
            'maintenance_reason' => null,
        ]);

        return response()->json(['ok' => true, 'car' => $car], 201);
    }

    public function setMaintenance(Request $request, Car $car)
    {
        $data = $request->validate([
            'maintenance_until' => ['required', 'date'],
            'reason' => ['required', 'in:repair,diagnostics'],
        ]);

        $until = now()->parse($data['maintenance_until']);
        if ($until->lt(now()->addMinutes(10))) {
            return response()->json(['message' => 'Дата возврата должна быть минимум через 10 минут.'], 422);
        }

        $car->is_active = false;
        $car->maintenance_until = $until;
        $car->maintenance_reason = $data['reason'];
        $car->save();

        $affectedBookings = Booking::query()
            ->where('car_id', $car->id)
            ->where('status', 'booked')
            ->whereNotNull('start_at')
            ->where('start_at', '>=', now())
            ->orderBy('start_at', 'asc')
            ->get();

        foreach ($affectedBookings as $booking) {
            $start = $booking->start_at;

            $candidates = Car::query()
                ->where('class', $car->class)
                ->where('id', '!=', $car->id)
                ->where('is_active', true)
                ->where(function ($w) {
                    $w->whereNull('maintenance_until')
                        ->orWhere('maintenance_until', '<=', now());
                })
                ->orderByDesc('id')
                ->get();

            $options = $candidates
                ->filter(fn (Car $candidate) => !$this->carHasConflict($candidate->id, $start, (int) $booking->duration_minutes, $booking->id))
                ->take(3)
                ->values()
                ->map(fn (Car $candidate) => [
                    'id' => $candidate->id,
                    'name' => $candidate->name,
                    'class' => $candidate->class,
                ])
                ->all();

            Notification::create([
                'user_id' => $booking->user_id,
                'type' => 'booking_affected',
                'booking_id' => $booking->id,
                'payload' => [
                    'title' => 'Ваша бронь затронута обслуживанием авто',
                    'text' => 'Авто снято в ремонт/диагностику. Выберите замену того же класса или отмените бронь.',
                    'reason' => $car->maintenance_reason,
                    'maintenance_until' => optional($car->maintenance_until)->toDateTimeString(),
                    'old_car' => [
                        'id' => $car->id,
                        'name' => $car->name,
                        'class' => $car->class,
                    ],
                    'options' => $options,
                ],
            ]);
        }

        return response()->json([
            'ok' => true,
            'car' => $car->only(['id', 'name', 'class', 'is_active', 'maintenance_until', 'maintenance_reason']),
            'affected_bookings' => $affectedBookings->count(),
        ]);
    }

    public function restore(Request $request, Car $car)
    {
        $car->is_active = true;
        $car->maintenance_until = null;
        $car->maintenance_reason = null;
        $car->save();

        return response()->json(['ok' => true, 'car' => $car]);
    }
}
