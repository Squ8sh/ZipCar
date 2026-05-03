<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', ''); // booked|active|completed|canceled|''

        $sort = (string) $request->query('sort', 'start_at'); // start_at|created_at|price_rub|duration_minutes|status|id
        $dir  = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['start_at', 'created_at', 'price_rub', 'duration_minutes', 'status', 'id'];
        if (!in_array($sort, $allowedSort, true)) $sort = 'start_at';

        $query = Booking::query()
            ->with([
                'user:id,name,email',
                'car:id,name,class,img',
            ]);

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->whereHas('user', function ($u) use ($q) {
                    $u->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                })->orWhereHas('car', function ($c) use ($q) {
                    $c->where('name', 'like', "%{$q}%");
                });
            });
        }

        // ? ??????????
        $query->orderBy($sort, $dir);

        return $query->paginate(20)->withQueryString();
    }

    public function setStatus(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'status' => ['required', 'in:booked,active,completed,canceled'],
        ]);

        $booking->status = $data['status'];
        $booking->save();

        return response()->json([
            'ok' => true,
            'booking' => $booking->load(['user:id,name,email', 'car:id,name,class,img']),
        ]);
    }
}
