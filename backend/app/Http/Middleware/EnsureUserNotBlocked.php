<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserNotBlocked
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->is_blocked) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            if (Auth::check()) {
                Auth::logout();
            }

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'message' => 'Ваш аккаунт заблокирован. Обратитесь в поддержку.',
            ], 403);
        }

        return $next($request);
    }
}

