<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $sort = (string) $request->query('sort', 'id');     // id|name|email|created_at|is_admin|is_blocked|blocked_at
        $dir  = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['id', 'name', 'email', 'created_at', 'is_admin', 'email_verified_at', 'is_blocked', 'blocked_at'];
        if (!in_array($sort, $allowedSort, true)) {
            $sort = 'id';
        }

        $query = User::query()->select([
            'id',
            'name',
            'email',
            'is_admin',
            'is_blocked',
            'blocked_at',
            'blocked_reason',
            'email_verified_at',
            'created_at',
        ]);


        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $query->orderBy($sort, $dir);

        return $query->paginate(20)->withQueryString();
    }

    public function setAdmin(Request $request, User $user)
    {
        $data = $request->validate([
            'is_admin' => ['required', 'boolean'],
        ]);

        // защита от “сам себя разжаловал” (можешь убрать, если не нужно)
        if ($request->user()->id === $user->id && $data['is_admin'] === false) {
            return response()->json(['message' => 'Нельзя снять админку с самого себя.'], 422);
        }

        $user->is_admin = $data['is_admin'];
        $user->save();

        return response()->json([
            'ok' => true,
            'user' => $user->only([
                'id',
                'name',
                'email',
                'is_admin',
                'is_blocked',
                'blocked_at',
                'blocked_reason',
                'email_verified_at',
                'created_at',
            ]),
        ]);
    }

    public function setBlocked(Request $request, User $user)
    {
        $data = $request->validate([
            'is_blocked' => ['required', 'boolean'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        if ($request->user()->id === $user->id && $data['is_blocked'] === true) {
            return response()->json(['message' => 'Нельзя заблокировать самого себя.'], 422);
        }

        $user->is_blocked = $data['is_blocked'];
        $user->blocked_at = $data['is_blocked'] ? now() : null;
        $user->blocked_reason = $data['is_blocked'] ? ($data['reason'] ?? null) : null;
        $user->save();

        return response()->json([
            'ok' => true,
            'user' => $user->only([
                'id',
                'name',
                'email',
                'is_admin',
                'is_blocked',
                'blocked_at',
                'blocked_reason',
                'email_verified_at',
                'created_at',
            ]),
        ]);
    }
}
