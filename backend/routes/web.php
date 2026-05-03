<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth');

Route::get('/me', function (Request $request) {
    return response()->json(['user' => $request->user()]);
})->middleware(['auth', 'not_blocked']);


Route::get('/test-mail', function () {
    Mail::to('squ8sh@gmail.com')->send(new VerifyEmailCodeMail('123456'));
    return 'mail sent';
});
