<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();

            $table->timestamp('start_at');
            $table->unsignedInteger('duration_minutes');
            $table->string('driver_name');
            $table->enum('ride_type', ['city', 'intercity']);
            $table->unsignedInteger('price_rub');

            $table->enum('status', ['booked','active','completed','canceled'])->default('booked');
            $table->timestamps();

            $table->index(['user_id', 'start_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('bookings');
    }
};
