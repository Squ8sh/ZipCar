<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    use HasFactory;
    protected $fillable = [
        'name','plate_number','class','img','description',
        'fuel_capacity_l','power_hp','seats','transmission',
        'lat','lng','parking_name','parking_address',
        'is_active','maintenance_until','maintenance_reason'
    ];

    protected $casts = [
        'maintenance_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function reviews()
    {
        return $this->hasMany(\App\Models\Review::class);
    }
}
