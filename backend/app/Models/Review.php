<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'car_id',
        'rating',
        'text',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function booking()
    {
        return $this->belongsTo(\App\Models\Booking::class);
    }

    public function car()
    {
        return $this->belongsTo(\App\Models\Car::class);
    }
}
