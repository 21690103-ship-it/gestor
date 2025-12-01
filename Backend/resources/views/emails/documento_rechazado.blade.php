<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Documento Requiere Correcciones</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .badge { background: #dc3545; color: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
        .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
        .important { background: #ffe6e6; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Documento Requiere Correcciones</h1>
            <p>Instituto Tecnológico de Ciudad Valles</p>
        </div>
        
        <div class="content">
            <h2>Hola {{ $usuario->nombre }} {{ $usuario->ape_pat }}</h2>
            
            <p>Lamentamos informarte que tu documento <strong>no pudo ser aceptado</strong> y requiere correcciones.</p>
            
            <div class="important">
                <h3>📄 Documento rechazado:</h3>
                <p><strong>Tipo:</strong> {{ $tipoDocumentoTexto }}</p>
                <p><strong>Archivo:</strong> {{ $documento->nombre_archivo }}</p>
                <p><strong>Fecha de revisión:</strong> {{ $fechaRechazo }}</p>
                
                @if($comentario)
                <div style="background: #fff5f5; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>💬 Comentario del administrador:</strong>
                    <p style="margin: 5px 0 0 0;">{{ $comentario }}</p>
                </div>
                @else
                <div style="background: #fff5f5; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>📋 Observación general:</strong>
                    <p style="margin: 5px 0 0 0;">El documento no cumple con los requisitos establecidos. Por favor, verifica el formato y contenido.</p>
                </div>
                @endif
            </div>
            
            <div style="margin: 20px 0;">
                <h3>🔧 ¿Qué hacer ahora?</h3>
                <ol>
                    <li>Revisa los comentarios del administrador</li>
                    <li>Corrige los aspectos señalados</li>
                    <li>Vuelve a subir el documento corregido</li>
                    <li>El nuevo documento será revisado nuevamente</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <span class="badge">ESTADO: REQUIERE CORRECCIONES</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático. Por favor no respondas a este correo.</p>
            <p>Instituto Tecnológico de Ciudad Valles</p>
        </div>
    </div>
</body>
</html>