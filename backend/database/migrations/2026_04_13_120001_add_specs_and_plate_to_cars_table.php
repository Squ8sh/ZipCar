<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->string('plate_number')->nullable()->unique()->after('name');
            $table->unsignedSmallInteger('fuel_capacity_l')->nullable()->after('description');
            $table->unsignedSmallInteger('power_hp')->nullable()->after('fuel_capacity_l');
            $table->unsignedTinyInteger('seats')->nullable()->after('power_hp');
            $table->string('transmission')->nullable()->after('seats');
            $table->string('parking_name')->nullable()->after('lng');
            $table->string('parking_address')->nullable()->after('parking_name');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropUnique(['plate_number']);
            $table->dropColumn([
                'plate_number',
                'fuel_capacity_l',
                'power_hp',
                'seats',
                'transmission',
                'parking_name',
                'parking_address',
            ]);
        });
    }
};

