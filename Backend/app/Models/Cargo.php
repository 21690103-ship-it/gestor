<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cargo extends Model
{
    use HasFactory;

    protected $table = 'cargo';
    
    protected $fillable = [
        'descripcion'
    ];

    public function usuarios()
    {
        return $this->hasMany(Usuarios::class, 'id_cargo');
    }
}