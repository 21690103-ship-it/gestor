<?php

namespace App\Console\Commands;

use App\Models\Usuarios;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EncryptPasswords extends Command
{
    protected $signature = 'passwords:encrypt';
    protected $description = 'Cifrar todas las contraseñas existentes en la base de datos';

    public function handle()
    {
        $this->info('🔐 Iniciando cifrado de contraseñas...');
        
        $usuarios = Usuarios::all();
        $contador = 0;

        foreach ($usuarios as $usuario) {
            if (!preg_match('/^\$2y\$.{56}$/', $usuario->contraseña)) {
                $contraseñaOriginal = $usuario->contraseña;
                $usuario->contraseña = Hash::make($usuario->contraseña);
                $usuario->save();
                
                $this->line("✅ {$usuario->RFC}: Contraseña cifrada");
                $contador++;
            } else {
                $this->line("ℹ️ {$usuario->RFC}: Ya estaba cifrada");
            }
        }

        $this->info("🎉 Proceso completado. {$contador} contraseñas cifradas.");
        return 0;
    }
}