<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistorialDocumento extends Model
{
    use HasFactory;

    protected $table = 'historial_documentos';

    protected $fillable = [
        'usuario_id',
        'tipo_documento', 
        'nombre_archivo',
        'ruta_archivo',
        'es_actual',
        'fecha_expiracion',
        'estado',
        'comentario_admin',
        'revisado_at',
        'revisado_por'
    ];

    protected $casts = [
        'fecha_expiracion' => 'datetime',
        'revisado_at' => 'datetime',
        'es_actual' => 'boolean'
    ];

    // Relación con el usuario propietario del documento
    public function usuario()
    {
        return $this->belongsTo(Usuarios::class, 'usuario_id');
    }

    // Relación con el administrador que revisó el documento
    public function administrador()
    {
        return $this->belongsTo(Usuarios::class, 'revisado_por');
    }

    // Scope para documentos pendientes de revisión
    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    // Scope para documentos aprobados
    public function scopeAprobados($query)
    {
        return $query->where('estado', 'aprobado');
    }

    // Scope para documentos rechazados
    public function scopeRechazados($query)
    {
        return $query->where('estado', 'rechazado');
    }

    // Scope para documentos actuales
    public function scopeActuales($query)
    {
        return $query->where('es_actual', true);
    }

    // Scope para documentos expirados
    public function scopeExpirados($query)
    {
        return $query->where('fecha_expiracion', '<', now())
                    ->where('es_actual', false);
    }

    // Método para verificar si está pendiente
    public function estaPendiente()
    {
        return $this->estado === 'pendiente';
    }

    // Método para verificar si está aprobado
    public function estaAprobado()
    {
        return $this->estado === 'aprobado';
    }

    // Método para verificar si está rechazado
    public function estaRechazado()
    {
        return $this->estado === 'rechazado';
    }

    // Método para verificar si está expirado
    public function estaExpirado()
    {
        return $this->fecha_expiracion && $this->fecha_expiracion->isPast();
    }

    // Método para obtener el estado en texto legible
    public function getEstadoTextoAttribute()
    {
        return match($this->estado) {
            'pendiente' => '⏳ Pendiente de revisión',
            'aprobado' => '✅ Aprobado',
            'rechazado' => '❌ Rechazado',
            default => '⏳ Pendiente de revisión'
        };
    }

    // Método para obtener el icono del estado
    public function getEstadoIconoAttribute()
    {
        return match($this->estado) {
            'pendiente' => '⏳',
            'aprobado' => '✅', 
            'rechazado' => '❌',
            default => '⏳'
        };
    }
}