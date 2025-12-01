<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Ruta de login para redirección de autenticación de Laravel
Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'message' => 'No autenticado. Por favor inicia sesión.'
    ], 401);
})->name('login');

// Ruta de bienvenida
Route::get('/', function () {
    return response()->json([
        'message' => 'API del Instituto Tecnológico de Ciudad Valles',
        'version' => '1.0',
        'timestamp' => now()
    ]);
});

// Si necesitas una vista de login para administradores:
Route::get('/admin/login', function () {
    return view('auth.login');
})->name('admin.login');