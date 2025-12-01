<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuarios extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'ape_pat',
        'ape_mat', 
        'RFC',
        'contraseña',
        'correo',
        'genero',
        'id_cargo'
    ];

    protected $hidden = [
        'contraseña',
        'remember_token',
    ];

    //Especificar que no usamos remember_token
    public function getRememberTokenName()
    {
        return null;
    }

    public function cargo()
    {
        return $this->belongsTo(Cargo::class, 'id_cargo');
    }

    //Método para contraseña personalizada
    public function getAuthPassword()
    {
        return $this->contraseña;
    }
}