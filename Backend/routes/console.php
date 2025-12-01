<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('passwords:encrypt', function () {
    $usuarios = \App\Models\Usuarios::all();
    
    foreach ($usuarios as $usuario) {
        if (!preg_match('/^\$2y\$.{56}$/', $usuario->contraseña)) {
            $usuario->contraseña = Hash::make($usuario->contraseña);
            $usuario->save();
            $this->info("Contraseña cifrada para: {$usuario->RFC}");
        }
    }
    
    $this->info('✅ Todas las contraseñas han sido cifradas');
});