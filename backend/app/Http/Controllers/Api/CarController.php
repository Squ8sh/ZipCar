<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

class CarController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $query = Car::query()
            ->where('is_active', true)
            ->where(function ($w) {
                $w->whereNull('maintenance_until')
                    ->orWhere('maintenance_until', '<=', now());
            })
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where('name', 'like', "%{$q}%");
        }

        return response()->json($query->paginate(20)->withQueryString());
    }

    public function show(Car $car)
    {
        return response()->json(['car' => $car]);
    }
}
