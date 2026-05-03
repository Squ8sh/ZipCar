<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function classLabel(?string $class): ?string
    {
        return match ($class) {
            'economy' => 'Эконом',
            'comfort' => 'Комфорт',
            'business' => 'Бизнес',
            'premium' => 'Премиум',
            default => $class,
        };
    }

    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 12);
        $limit = max(1, min($limit, 50));

        $reviews = Review::query()
            ->with([
                'user:id,name',
                'car:id,name,class',
                'booking:id,car_id',
                'booking.car:id,name,class',
            ])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $payload = $reviews->map(function (Review $review) {
            $car = $review->car ?: $review->booking?->car;
            $carName = $car?->name;
            $carClass = $this->classLabel($car?->class);

            return [
                'id' => $review->id,
                'booking_id' => $review->booking_id,
                'user_id' => $review->user_id,
                'user_name' => $review->user?->name,
                'rating' => (int) $review->rating,
                'text' => $review->text,
                'car_name' => $carName,
                'car_class' => $carClass,
                'car_label' => $carClass && $carName ? "{$carClass} — {$carName}" : ($carName ?? null),
                'created_at' => $review->created_at,
            ];
        });

        return response()->json(['data' => $payload]);
    }

    public function store(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Not your booking');
        }

        if ($booking->status !== 'completed') {
            return response()->json(['message' => 'Отзыв можно оставить только после завершения поездки.'], 422);
        }

        if ($booking->review()->exists()) {
            return response()->json(['message' => 'Для этой поездки отзыв уже оставлен.'], 422);
        }

        $data = $request->validate([
            'text' => ['required', 'string', 'min:3', 'max:2000'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $review = Review::create([
            'user_id' => $request->user()->id,
            'booking_id' => $booking->id,
            'car_id' => $booking->car_id,
            'rating' => (int) $data['rating'],
            'text' => trim($data['text']),
        ]);

        $review->load(['user:id,name', 'car:id,name,class']);

        return response()->json([
            'review' => [
                'id' => $review->id,
                'booking_id' => $review->booking_id,
                'user_id' => $review->user_id,
                'user_name' => $review->user?->name,
                'rating' => (int) $review->rating,
                'text' => $review->text,
                'car_name' => $review->car?->name,
                'car_class' => $this->classLabel($review->car?->class),
                'car_label' => $review->car?->class && $review->car?->name
                    ? "{$this->classLabel($review->car->class)} — {$review->car->name}"
                    : $review->car?->name,
                'created_at' => $review->created_at,
            ],
        ], 201);
    }
}
