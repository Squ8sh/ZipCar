<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReviewsSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            User::updateOrCreate(
                ['email' => 'reviewer1@zipcar.local'],
                ['name' => 'Пользователь ZipCar', 'password' => Hash::make('User12345!')]
            ),
            User::updateOrCreate(
                ['email' => 'reviewer2@zipcar.local'],
                ['name' => 'Zipcar Admin', 'password' => Hash::make('Admin12345!')]
            ),
        ];

        $cars = Car::query()->orderBy('id')->take(5)->get();
        if ($cars->count() < 5) {
            return;
        }

        $texts = [
            'Машина чистая, забрал быстро, поездка прошла отлично.',
            'Удобный автомобиль для города, все понравилось.',
            'Хорошая динамика и расход, буду брать снова.',
            'Салон в порядке, оформление аренды заняло пару минут.',
            'Поездка без проблем, поддержка ответила оперативно.',
        ];

        foreach ($cars as $index => $car) {
            $user = $users[$index % count($users)];
            $start = now()->startOfDay()->subDays(10 + $index)->setTime(10, 0);

            $booking = Booking::firstOrCreate([
                'user_id' => $user->id,
                'car_id' => $car->id,
                'start_at' => $start,
                'status' => 'completed',
            ], [
                'user_id' => $user->id,
                'car_id' => $car->id,
                'start_at' => $start,
                'planned_end_at' => $start->copy()->addHours(2),
                'ended_at' => $start->copy()->addHours(2),
                'duration_minutes' => 120,
                'tariff_mode' => 'hour',
                'tariff_value' => 2,
                'ends_on_user_action' => false,
                'driver_name' => $user->name,
                'ride_type' => 'city',
                'parking_name' => $car->parking_name,
                'parking_address' => $car->parking_address,
                'price_rub' => 900,
                'status' => 'completed',
                'overtime_minutes' => 0,
                'overtime_penalty_rub' => 0,
                'final_price_rub' => 900,
            ]);

            Review::updateOrCreate(
                ['booking_id' => $booking->id],
                [
                    'user_id' => $user->id,
                    'car_id' => $car->id,
                    'rating' => 5 - ($index % 2),
                    'text' => $texts[$index],
                ]
            );
        }
    }
}
