<?php

namespace Database\Seeders;

use App\Models\Car;
use Illuminate\Database\Seeder;

class CarsSeeder extends Seeder
{
    public function run(): void
    {
        $parkingSpots = [
            [
                'name' => 'Парковка ТЦ SUN CITY',
                'address' => 'Набережные Челны, пр. Сююмбике, 2/19',
                'lat' => 55.7437,
                'lng' => 52.3955,
            ],
            [
                'name' => 'Парковка у Парка Победы',
                'address' => 'Набережные Челны, пр. Мира, 88',
                'lat' => 55.7516,
                'lng' => 52.4079,
            ],
            [
                'name' => 'Парковка у ЖД вокзала',
                'address' => 'Набережные Челны, Привокзальная улица, 1',
                'lat' => 55.6999,
                'lng' => 52.3198,
            ],
        ];

        $models = [
            [
                'name' => 'Lada Granta',
                'class' => 'economy',
                'img' => '../img/granta.png',
                'description' => 'Практичный городской седан для ежедневных поездок.',
                'fuel_capacity_l' => 50,
                'power_hp' => 90,
                'seats' => 5,
                'transmission' => 'Механика',
                'plates' => ['А101АА716', 'А102АА716', 'А103АА716', 'А104АА716'],
            ],
            [
                'name' => 'Lada Vesta',
                'class' => 'economy',
                'img' => '../img/vesta.png',
                'description' => 'Комфортный семейный автомобиль с просторным салоном.',
                'fuel_capacity_l' => 55,
                'power_hp' => 106,
                'seats' => 5,
                'transmission' => 'Автомат',
                'plates' => ['В201ВВ716', 'В202ВВ716', 'В203ВВ716', 'В204ВВ716'],
            ],
            [
                'name' => 'Lada Largus',
                'class' => 'economy',
                'img' => '../img/largus.png',
                'description' => 'Универсал с увеличенным багажником для долгих поездок.',
                'fuel_capacity_l' => 60,
                'power_hp' => 105,
                'seats' => 7,
                'transmission' => 'Механика',
                'plates' => ['С301СС716', 'С302СС716', 'С303СС716', 'С304СС716'],
            ],
            [
                'name' => 'Lada Kalina Cross',
                'class' => 'economy',
                'img' => '../img/kalina.png',
                'description' => 'Компактный кросс-универсал для города и пригородных поездок.',
                'fuel_capacity_l' => 50,
                'power_hp' => 106,
                'seats' => 5,
                'transmission' => 'Механика',
                'plates' => ['Е401ЕК716', 'Е402ЕК716', 'Е403ЕК716', 'Е404ЕК716'],
            ],
            [
                'name' => 'Kia K5',
                'class' => 'comfort',
                'img' => '../img/kiak5.png',
                'description' => 'Бизнес-седан с современным оснащением и комфортной подвеской.',
                'fuel_capacity_l' => 60,
                'power_hp' => 150,
                'seats' => 5,
                'transmission' => 'Автомат',
                'plates' => ['К501КК716', 'К502КК716', 'К503КК716', 'К504КК716'],
            ],
            [
                'name' => 'Skoda Octavia',
                'class' => 'comfort',
                'img' => '../img/octavia2.png',
                'description' => 'Надежный седан для междугородних и городских маршрутов.',
                'fuel_capacity_l' => 55,
                'power_hp' => 150,
                'seats' => 5,
                'transmission' => 'Механика',
                'plates' => ['М601ММ716', 'М602ММ716', 'М603ММ716', 'М604ММ716'],
            ],
            [
                'name' => 'Changan UNI-V',
                'class' => 'business',
                'img' => '../img/changan.png',
                'description' => 'Современный лифтбек с динамичным характером.',
                'fuel_capacity_l' => 65,
                'power_hp' => 200,
                'seats' => 5,
                'transmission' => 'Автомат',
                'plates' => ['Н701НН716', 'Н702НН716', 'Н703НН716', 'Н704НН716'],
            ],
            [
                'name' => 'Geely Coolray',
                'class' => 'business',
                'img' => '../img/coolray.png',
                'description' => 'Компактный кроссовер с хорошей динамикой и высоким клиренсом.',
                'fuel_capacity_l' => 55,
                'power_hp' => 177,
                'seats' => 5,
                'transmission' => 'Автомат',
                'plates' => ['Р801РР716', 'Р802РР716', 'Р803РР716', 'Р804РР716'],
            ],
        ];

        $id = 1;
        foreach ($models as $model) {
            foreach ($model['plates'] as $idx => $plate) {
                $spot = $parkingSpots[$idx % count($parkingSpots)];

                Car::updateOrCreate(
                    ['id' => $id],
                    [
                        'name' => $model['name'],
                        'plate_number' => $plate,
                        'class' => $model['class'],
                        'img' => $model['img'],
                        'description' => $model['description'],
                        'fuel_capacity_l' => $model['fuel_capacity_l'],
                        'power_hp' => $model['power_hp'],
                        'seats' => $model['seats'],
                        'transmission' => $model['transmission'],
                        'lat' => $spot['lat'],
                        'lng' => $spot['lng'],
                        'parking_name' => $spot['name'],
                        'parking_address' => $spot['address'],
                        'is_active' => true,
                        'maintenance_until' => null,
                        'maintenance_reason' => null,
                    ]
                );

                $id++;
            }
        }
    }
}
