<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('tariff_mode')->default('hour')->after('duration_minutes'); // minute|hour|day|open
            $table->unsignedInteger('tariff_value')->nullable()->after('tariff_mode');
            $table->boolean('ends_on_user_action')->default(false)->after('tariff_value');
            $table->timestamp('planned_end_at')->nullable()->after('start_at');
            $table->timestamp('ended_at')->nullable()->after('planned_end_at');
            $table->timestamp('warning_sent_at')->nullable()->after('ended_at');
            $table->unsignedInteger('overtime_minutes')->default(0)->after('status');
            $table->unsignedInteger('overtime_penalty_rub')->default(0)->after('overtime_minutes');
            $table->unsignedInteger('final_price_rub')->nullable()->after('overtime_penalty_rub');
            $table->string('parking_name')->nullable()->after('ride_type');
            $table->string('parking_address')->nullable()->after('parking_name');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'tariff_mode',
                'tariff_value',
                'ends_on_user_action',
                'planned_end_at',
                'ended_at',
                'warning_sent_at',
                'overtime_minutes',
                'overtime_penalty_rub',
                'final_price_rub',
                'parking_name',
                'parking_address',
            ]);
        });
    }
};

