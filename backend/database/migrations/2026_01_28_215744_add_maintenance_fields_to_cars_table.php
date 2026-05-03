<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('lng'); // в каталоге или нет
            $table->timestamp('maintenance_until')->nullable()->after('is_active'); // до какого времени ремонт
            $table->string('maintenance_reason')->nullable()->after('maintenance_until'); // ремонт/диагностика
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'maintenance_until', 'maintenance_reason']);
        });
    }
};
