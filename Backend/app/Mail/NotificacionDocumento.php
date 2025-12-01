<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotificacionDocumento extends Mailable
{
    use Queueable, SerializesModels;

    public $usuario;
    public $documento;
    public $tipoDocumentoTexto;
    public $comentario;
    public $tipo; // 'aprobado' o 'rechazado'

    public function __construct($usuario, $documento, $tipoDocumentoTexto, $comentario, $tipo)
    {
        $this->usuario = $usuario;
        $this->documento = $documento;
        $this->tipoDocumentoTexto = $tipoDocumentoTexto;
        $this->comentario = $comentario;
        $this->tipo = $tipo;
    }

    public function build()
    {
        $vista = $this->tipo === 'aprobado' 
            ? 'emails.documento_aprobado' 
            : 'emails.documento_rechazado';

        $asunto = $this->tipo === 'aprobado'
            ? '✅ Documento Aprobado - Instituto Tecnológico de Ciudad Valles'
            : '⚠️ Documento Requiere Correcciones - Instituto Tecnológico de Ciudad Valles';

        return $this->markdown($vista)
                    ->subject($asunto)
                    ->with([
                        'usuario' => $this->usuario,
                        'documento' => $this->documento,
                        'tipoDocumentoTexto' => $this->tipoDocumentoTexto,
                        'comentario' => $this->comentario,
                        'fechaAprobacion' => now()->format('d/m/Y'),
                        'fechaRechazo' => now()->format('d/m/Y')
                    ]);
    }
}