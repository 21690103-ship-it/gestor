<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Documento Aprobado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
        .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Documento Aprobado</h1>
            <p>Instituto Tecnológico de Ciudad Valles</p>
        </div>
        
        <div class="content">
            <h2>¡Hola {{ $usuario->nombre }} {{ $usuario->ape_pat }}!</h2>
            
            <p>Nos complace informarte que tu documento ha sido <strong>aprobado</strong> correctamente.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 15px 0;">
                <h3>📄 Información del documento:</h3>
                <p><strong>Tipo:</strong> {{ $tipoDocumentoTexto }}</p>
                <p><strong>Archivo:</strong> {{ $documento->nombre_archivo }}</p>
                <p><strong>Fecha de aprobación:</strong> {{ $fechaAprobacion }}</p>
                
                @if($comentario)
                <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <strong>💬 Comentario del administrador:</strong>
                    <p style="margin: 5px 0 0 0;">{{ $comentario }}</p>
                </div>
                @endif
            </div>
            
            <p>El documento ahora está disponible en tu perfil y será considerado como tu documento actual.</p>
            
            <div style="text-align: center; margin: 20px 0;">
                <span class="badge">ESTADO: APROBADO</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Este es un mensaje automático. Por favor no respondas a este correo.</p>
            <p>Instituto Tecnológico de Ciudad Valles</p>
        </div>
    </div>
</body>
</html>