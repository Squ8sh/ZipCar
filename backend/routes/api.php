<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\BookingController as ApiBookingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CarController as AdminCarController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Все роуты здесь имеют префикс /api
*/

// Публичные машины
Route::get('/cars', [CarController::class, 'index']);
Route::get('/cars/{car}', [CarController::class, 'show']);
Route::get('/reviews', [ReviewController::class, 'index']);

Route::middleware(['auth:sanctum', 'not_blocked'])->group(function () {
    // Профиль
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);

    // Подтверждение почты
    Route::post('/profile/email/send-code', [ProfileController::class, 'sendEmailCode']);
    Route::post('/profile/email/verify', [ProfileController::class, 'verifyEmailCode']);

    // Брони пользователя
    Route::get('/bookings', [ApiBookingController::class, 'index']);
    Route::post('/bookings', [ApiBookingController::class, 'store']);
    Route::patch('/bookings/{booking}/cancel', [ApiBookingController::class, 'cancel']);
    Route::patch('/bookings/{booking}/complete', [ApiBookingController::class, 'complete']);
    Route::post('/bookings/{booking}/review', [ReviewController::class, 'store']);

    // Уведомления
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/{notification}/action', [NotificationController::class, 'action']);
});

Route::middleware(['auth:sanctum', 'not_blocked', 'admin'])->prefix('admin')->group(function () {
    // Пользователи
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{user}/admin', [UserController::class, 'setAdmin']);
    Route::patch('/users/{user}/block', [UserController::class, 'setBlocked']);

    // Бронирования
    Route::get('/bookings', [AdminBookingController::class, 'index']);
    Route::patch('/bookings/{booking}/status', [AdminBookingController::class, 'setStatus']);

    // Машины
    Route::get('/cars', [AdminCarController::class, 'index']);
    Route::post('/cars', [AdminCarController::class, 'store']);
    Route::patch('/cars/{car}/maintenance', [AdminCarController::class, 'setMaintenance']);
    Route::patch('/cars/{car}/restore', [AdminCarController::class, 'restore']);
});
