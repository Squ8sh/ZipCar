<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@zipcar.local'],
            [
                'name' => 'Zipcar Admin',
                'password' => Hash::make('Admin12345!'),
                'is_admin' => true,
            ]
        );
    }
}
