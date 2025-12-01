<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CodigoRecuperacion extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * El código de recuperación
     *
     * @var string
     */
    public $codigo;

    /**
     * El nombre del usuario
     *
     * @var string
     */
    public $nombre;

    /**
     * Tiempo de expiración del código (en minutos)
     *
     * @var int
     */
    public $tiempoExpiracion;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($codigo, $nombre = null, $tiempoExpiracion = 15)
    {
        $this->codigo = $codigo;
        $this->nombre = $nombre;
        $this->tiempoExpiracion = $tiempoExpiracion;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Código de Recuperación - Sistema de Control Documental ITCV',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.codigo-recuperacion',
            with: [
                'codigo' => $this->codigo,
                'nombre' => $this->nombre,
                'tiempoExpiracion' => $this->tiempoExpiracion,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        return [];
    }

    /**
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Código de Recuperación - Sistema de Control Documental ITCV')
                    ->view('emails.codigo-recuperacion')
                    ->with([
                        'codigo' => $this->codigo,
                        'nombre' => $this->nombre,
                        'tiempoExpiracion' => $this->tiempoExpiracion,
                    ]);
    }
}