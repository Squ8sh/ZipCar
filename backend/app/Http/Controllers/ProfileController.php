<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Mail\VerifyEmailCodeMail;
use App\Models\EmailVerificationCode;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email:rfc', 'max:255', 'regex:/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'date_of_birth' => ['nullable', 'date'],
        ]);

        if ($request->has('email') && $request->input('email') !== $user->email) { $user->email_verified_at = null; }

        $user->fill($data)->save();

        return response()->json(['user' => $user]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required','string','min:8','confirmed'],
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Текущий пароль неверный.'], 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json(['ok' => true]);
    }

    public function updateAvatar(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'avatar' => ['required', 'image', 'max:2048'], // до 2MB
        ]);

        $path = $data['avatar']->store('avatars', 'public'); // storage/app/public/avatars/...
        $user->avatar_path = $path;
        $user->save();

        return response()->json(['user' => $user]);
    }
    public function sendEmailCode(Request $request)
    {
        $user = $request->user();

        // если уже подтверждено — можно не слать
        if ($user->email_verified_at) {
            return response()->json(['message' => 'Почта уже подтверждена.'], 422);
        }

        // антиспам: не чаще, чем раз в 60 секунд
        $last = EmailVerificationCode::where('user_id', $user->id)
            ->orderByDesc('id')->first();

        if ($last && $last->created_at->gt(now()->subSeconds(60))) {
            return response()->json(['message' => 'Подождите 60 секунд перед повторной отправкой.'], 429);
        }

        $code = (string) random_int(100000, 999999); // 6 цифр
        $hash = Hash::make($code);

        $record = EmailVerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => $hash,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($user->email)->send(new VerifyEmailCodeMail($code));
        } catch (Throwable $e) {
            Log::error('Не удалось отправить email-код подтверждения', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            // В local-режиме даем код в ответе и логах, чтобы разработка не блокировалась из-за SMTP.
            if (app()->environment('local')) {
                Log::info("DEV EMAIL CODE for {$user->email}: {$code}");

                return response()->json([
                    'ok' => true,
                    'message' => 'SMTP недоступен. Используйте код из ответа (режим разработки).',
                    'debug_code' => $code,
                ]);
            }

            $record->delete();
            return response()->json([
                'message' => 'Не удалось отправить код на почту. Проверьте SMTP настройки.',
            ], 500);
        }

        return response()->json(['ok' => true]);
    }

    public function verifyEmailCode(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $record = EmailVerificationCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->orderByDesc('id')
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Код не найден. Запросите новый.'], 422);
        }

        if ($record->expires_at->isPast()) {
            return response()->json(['message' => 'Код истёк. Запросите новый.'], 422);
        }

        $record->attempts += 1;
        $record->save();

        if ($record->attempts > 10) {
            return response()->json(['message' => 'Слишком много попыток. Запросите новый код.'], 429);
        }

        if (!Hash::check($data['code'], $record->code_hash)) {
            return response()->json(['message' => 'Неверный код.'], 422);
        }

        $record->used_at = now();
        $record->save();

        $user->email_verified_at = now();
        $user->save();

        return response()->json(['ok' => true, 'user' => $user]);
    }

}
