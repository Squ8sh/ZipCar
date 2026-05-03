<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id','car_id','start_at','planned_end_at','ended_at',
        'duration_minutes','tariff_mode','tariff_value','ends_on_user_action',
        'driver_name','ride_type','parking_name','parking_address',
        'price_rub','status','warning_sent_at',
        'overtime_minutes','overtime_penalty_rub','final_price_rub',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'planned_end_at' => 'datetime',
        'ended_at' => 'datetime',
        'warning_sent_at' => 'datetime',
        'ends_on_user_action' => 'boolean',
    ];

    public function user() { return $this->belongsTo(\App\Models\User::class); }
    public function car()  { return $this->belongsTo(\App\Models\Car::class); }
    public function review() { return $this->hasOne(\App\Models\Review::class); }
}
