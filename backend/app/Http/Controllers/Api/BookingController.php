<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Notification;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    private const PER_MINUTE_RATE = 10;
    private const PER_HOUR_RATE = 450;
    private const PER_DAY_RATE = 9800;
    private const INTERCITY_MULTIPLIER = 1.10;
    private const LATE_PENALTY_PER_MINUTE = 15;
    private const OPEN_RENT_BLOCK_MINUTES = 30 * 24 * 60;

    private function overlaps(CarbonInterface $aStart, CarbonInterface $aEnd, CarbonInterface $bStart, CarbonInterface $bEnd): bool
    {
        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    private function applyIntercity(int $basePrice, string $rideType): int
    {
        if ($rideType !== 'intercity') {
            return $basePrice;
        }

        return (int) round($basePrice * self::INTERCITY_MULTIPLIER);
    }

    private function calcTierPriceByMinutes(int $minutes): int
    {
        if ($minutes <= 60) {
            return $minutes * self::PER_MINUTE_RATE;
        }

        if ($minutes <= 24 * 60) {
            $hours = (int) ceil($minutes / 60);
            return $hours * self::PER_HOUR_RATE;
        }

        $days = (int) ceil($minutes / (24 * 60));
        return $days * self::PER_DAY_RATE;
    }

    private function calcPlannedTariffPrice(string $mode, int $value): int
    {
        return match ($mode) {
            'minute' => $value * self::PER_MINUTE_RATE,
            'hour' => $value * self::PER_HOUR_RATE,
            'day' => $value * self::PER_DAY_RATE,
            default => 0,
        };
    }

    private function hasBookingConflict(int $carId, CarbonInterface $start, int $durationMinutes, ?int $ignoreBookingId = null): bool
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

    private function resolveAvailableCar(Car $baseCar, CarbonInterface $startAt, int $durationMinutes, ?int $ignoreBookingId = null): ?Car
    {
        $candidates = Car::query()
            ->where('name', $baseCar->name)
            ->where('class', $baseCar->class)
            ->where('is_active', true)
            ->where(function ($w) {
                $w->whereNull('maintenance_until')
                    ->orWhere('maintenance_until', '<=', now());
            })
            ->orderBy('id')
            ->get();

        foreach ($candidates as $candidate) {
            if (!$this->hasBookingConflict($candidate->id, $startAt, $durationMinutes, $ignoreBookingId)) {
                return $candidate;
            }
        }

        return null;
    }

    private function derivePlan(string $tariffMode, ?int $tariffValue, CarbonInterface $startAt): array
    {
        if ($tariffMode === 'open') {
            return [
                'duration_minutes' => self::OPEN_RENT_BLOCK_MINUTES,
                'tariff_value' => null,
                'ends_on_user_action' => true,
                'planned_end_at' => null,
            ];
        }

        $value = (int) $tariffValue;
        $durationMinutes = match ($tariffMode) {
            'minute' => $value,
            'hour' => $value * 60,
            'day' => $value * 24 * 60,
            default => throw new \RuntimeException('Unsupported tariff mode'),
        };

        return [
            'duration_minutes' => $durationMinutes,
            'tariff_value' => $value,
            'ends_on_user_action' => false,
            'planned_end_at' => $startAt->copy()->addMinutes($durationMinutes),
        ];
    }

    private function updateLifecycleState(Booking $booking, CarbonInterface $now): void
    {
        $dirty = false;

        if ($booking->status === 'booked' && $booking->start_at && $booking->start_at->lte($now)) {
            $booking->status = 'active';
            $dirty = true;
        }

        $plannedEndAt = $booking->planned_end_at;
        if (!$plannedEndAt && !$booking->ends_on_user_action && $booking->start_at) {
            $plannedEndAt = $booking->start_at->copy()->addMinutes((int) $booking->duration_minutes);
            $booking->planned_end_at = $plannedEndAt;
            $dirty = true;
        }

        if ($booking->status === 'active' && !$booking->ends_on_user_action && $plannedEndAt) {
            $minutesToEnd = (int) $now->diffInMinutes($plannedEndAt, false);

            if ($minutesToEnd <= 10 && $minutesToEnd >= 0 && !$booking->warning_sent_at) {
                Notification::create([
                    'user_id' => $booking->user_id,
                    'type' => 'trip_ending_soon',
                    'booking_id' => $booking->id,
                    'payload' => [
                        'title' => 'До конца аренды осталось 10 минут',
                        'text' => 'Завершите поездку вовремя. После окончания брони действует штраф 15 ₽/мин.',
                        'car_name' => $booking->car?->name,
                        'start_at' => optional($booking->start_at)->toDateTimeString(),
                        'planned_end_at' => optional($plannedEndAt)->toDateTimeString(),
                    ],
                ]);
                $booking->warning_sent_at = $now;
                $dirty = true;
            }

            if ($minutesToEnd < 0) {
                $overtime = abs($minutesToEnd);
                $penalty = $overtime * self::LATE_PENALTY_PER_MINUTE;

                if ((int) $booking->overtime_minutes !== $overtime || (int) $booking->overtime_penalty_rub !== $penalty) {
                    $booking->overtime_minutes = $overtime;
                    $booking->overtime_penalty_rub = $penalty;
                    $dirty = true;
                }
            } elseif ((int) $booking->overtime_minutes !== 0 || (int) $booking->overtime_penalty_rub !== 0) {
                $booking->overtime_minutes = 0;
                $booking->overtime_penalty_rub = 0;
                $dirty = true;
            }
        }

        if ($dirty) {
            $booking->save();
        }
    }

    private function decorateBooking(Booking $booking): Booking
    {
        $now = now();
        $this->updateLifecycleState($booking, $now);

        $start = $booking->start_at;
        $elapsedMinutes = 0;

        if ($start && $now->gte($start)) {
            $elapsedMinutes = max(1, (int) $start->diffInMinutes($now));
        }

        $minutesToEnd = null;
        $currentPenalty = 0;
        $currentBase = (int) ($booking->final_price_rub ?? $booking->price_rub ?? 0);
        $currentTotal = $currentBase;
        $canFinish = false;

        if ($booking->status === 'active') {
            if ($booking->ends_on_user_action) {
                $currentBase = $this->applyIntercity(
                    $this->calcTierPriceByMinutes(max(1, $elapsedMinutes)),
                    (string) $booking->ride_type
                );
                $currentTotal = $currentBase;
                $canFinish = true;
            } else {
                $planned = (int) $booking->duration_minutes;
                $minutesToEnd = $planned - $elapsedMinutes;
                $currentPenalty = max(0, $elapsedMinutes - $planned) * self::LATE_PENALTY_PER_MINUTE;
                $currentBase = (int) $booking->price_rub;
                $currentTotal = $currentBase + $currentPenalty;
                $canFinish = $minutesToEnd <= 10;
            }
        }

        $booking->setAttribute('elapsed_minutes', $elapsedMinutes);
        $booking->setAttribute('minutes_to_end', $minutesToEnd);
        $booking->setAttribute('current_penalty_rub', $currentPenalty);
        $booking->setAttribute('current_total_rub', $currentTotal);
        $booking->setAttribute('can_finish', $canFinish);

        return $booking;
    }

    private function bookingCarSelectColumns(): array
    {
        return [
            'id',
            'name',
            'class',
            'img',
            'plate_number',
            'fuel_capacity_l',
            'power_hp',
            'seats',
            'transmission',
            'parking_name',
            'parking_address',
        ];
    }

    public function index(Request $request)
    {
        $bookings = Booking::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'car' => fn ($q) => $q->select($this->bookingCarSelectColumns()),
                'review:id,booking_id,rating,text,created_at',
            ])
            ->orderByDesc('start_at')
            ->paginate(20);

        $bookings->getCollection()->transform(function (Booking $booking) {
            return $this->decorateBooking($booking);
        });

        return response()->json($bookings);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'car_id' => ['required', 'integer', 'exists:cars,id'],
            'start_at' => ['required', 'date'],
            'tariff_mode' => ['required', 'in:minute,hour,day,open'],
            'tariff_value' => ['nullable', 'integer', 'min:1'],
            'driver_name' => ['required', 'string', 'min:3', 'max:255'],
            'ride_type' => ['required', 'in:city,intercity'],
            'parking_name' => ['required', 'string', 'max:255'],
            'parking_address' => ['required', 'string', 'max:255'],
        ]);

        $start = now()->parse($data['start_at']);
        if ($start->lt(now()->addMinutes(5))) {
            return response()->json(['message' => 'Время начала аренды должно быть минимум через 5 минут.'], 422);
        }

        if ($start->gt(now()->addDays(30))) {
            return response()->json(['message' => 'Бронь можно оформить не дальше чем на 30 дней вперед.'], 422);
        }

        if ($data['tariff_mode'] === 'minute' && ((int) ($data['tariff_value'] ?? 0) < 1 || (int) $data['tariff_value'] > 60)) {
            return response()->json(['message' => 'Для поминутного тарифа выберите от 1 до 60 минут.'], 422);
        }

        if ($data['tariff_mode'] === 'hour' && ((int) ($data['tariff_value'] ?? 0) < 1 || (int) $data['tariff_value'] > 24)) {
            return response()->json(['message' => 'Для почасового тарифа выберите от 1 до 24 часов.'], 422);
        }

        if ($data['tariff_mode'] === 'day' && ((int) ($data['tariff_value'] ?? 0) < 1 || (int) $data['tariff_value'] > 30)) {
            return response()->json(['message' => 'Для посуточного тарифа выберите от 1 до 30 суток.'], 422);
        }

        $baseCar = Car::findOrFail($data['car_id']);
        $plan = $this->derivePlan($data['tariff_mode'], $data['tariff_value'] ?? null, $start);

        $car = $this->resolveAvailableCar($baseCar, $start, (int) $plan['duration_minutes']);
        if (!$car) {
            return response()->json(['message' => 'На выбранное время свободных авто этой модели нет.'], 422);
        }

        $plannedPrice = $data['tariff_mode'] === 'open'
            ? 0
            : $this->applyIntercity(
                $this->calcPlannedTariffPrice($data['tariff_mode'], (int) $plan['tariff_value']),
                $data['ride_type']
            );

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'car_id' => $car->id,
            'start_at' => $start,
            'planned_end_at' => $plan['planned_end_at'],
            'duration_minutes' => (int) $plan['duration_minutes'],
            'tariff_mode' => $data['tariff_mode'],
            'tariff_value' => $plan['tariff_value'],
            'ends_on_user_action' => (bool) $plan['ends_on_user_action'],
            'driver_name' => $data['driver_name'],
            'ride_type' => $data['ride_type'],
            'parking_name' => $data['parking_name'],
            'parking_address' => $data['parking_address'],
            'price_rub' => $plannedPrice,
            'status' => 'booked',
        ]);

        $booking->load(['car' => fn ($q) => $q->select($this->bookingCarSelectColumns())]);
        $booking = $this->decorateBooking($booking);

        return response()->json(['ok' => true, 'booking' => $booking], 201);
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Not your booking');
        }

        if (!in_array($booking->status, ['booked', 'active'], true)) {
            return response()->json(['message' => 'Отменить можно только активную или запланированную бронь.'], 422);
        }

        $now = now();
        $elapsed = ($booking->start_at && $now->gte($booking->start_at))
            ? max(1, (int) $booking->start_at->diffInMinutes($now))
            : 0;

        if ($elapsed > 0) {
            $base = $this->applyIntercity($this->calcTierPriceByMinutes($elapsed), (string) $booking->ride_type);
            $overtime = (!$booking->ends_on_user_action && $elapsed > (int) $booking->duration_minutes)
                ? ($elapsed - (int) $booking->duration_minutes)
                : 0;
            $penalty = $overtime * self::LATE_PENALTY_PER_MINUTE;
        } else {
            $base = 0;
            $overtime = 0;
            $penalty = 0;
        }

        $booking->status = 'canceled';
        $booking->ended_at = $now;
        $booking->overtime_minutes = $overtime;
        $booking->overtime_penalty_rub = $penalty;
        $booking->final_price_rub = $base + $penalty;
        $booking->save();

        $booking->load(['car' => fn ($q) => $q->select($this->bookingCarSelectColumns())]);
        $booking = $this->decorateBooking($booking);

        return response()->json(['ok' => true, 'booking' => $booking]);
    }

    public function complete(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Not your booking');
        }

        if ($booking->status !== 'active') {
            return response()->json(['message' => 'Завершить можно только поездку со статусом active.'], 422);
        }

        $data = $request->validate([
            'parking_name' => ['required', 'string', 'max:255'],
            'parking_address' => ['required', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $now = now();
        $elapsed = max(1, (int) $booking->start_at->diffInMinutes($now));

        if ($booking->ends_on_user_action) {
            $base = $this->applyIntercity($this->calcTierPriceByMinutes($elapsed), (string) $booking->ride_type);
            $overtime = 0;
            $penalty = 0;
        } else {
            $base = (int) $booking->price_rub;
            $overtime = max(0, $elapsed - (int) $booking->duration_minutes);
            $penalty = $overtime * self::LATE_PENALTY_PER_MINUTE;
        }

        $booking->status = 'completed';
        $booking->ended_at = $now;
        $booking->parking_name = $data['parking_name'];
        $booking->parking_address = $data['parking_address'];
        $booking->overtime_minutes = $overtime;
        $booking->overtime_penalty_rub = $penalty;
        $booking->final_price_rub = $base + $penalty;
        $booking->save();

        $car = $booking->car;
        if ($car) {
            $car->parking_name = $data['parking_name'];
            $car->parking_address = $data['parking_address'];
            if (array_key_exists('lat', $data) && $data['lat'] !== null) {
                $car->lat = $data['lat'];
            }
            if (array_key_exists('lng', $data) && $data['lng'] !== null) {
                $car->lng = $data['lng'];
            }
            $car->save();
        }

        $booking->load(['car' => fn ($q) => $q->select($this->bookingCarSelectColumns())]);
        $booking = $this->decorateBooking($booking);

        return response()->json(['ok' => true, 'booking' => $booking]);
    }
}
