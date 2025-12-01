<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Código de Recuperación</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            border-radius: 10px 10px 0 0;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .code-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #6a11cb;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #6a11cb;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
        }
        .logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo h2 {
            color: #2c3e50;
            margin: 0;
        }
        .instructions {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
        </div>
        
        <div class="content">
            <div class="logo">
                <h2>TecNM Instituto Tecnológico de Ciudad Valles</h2>
                <p>Sistema de Control Documental</p>
            </div>
            
            @if($nombre)
            <p>Hola <strong>{{ $nombre }}</strong>,</p>
            @else
            <p>Hola,</p>
            @endif
            
            <p>Has solicitado restablecer tu contraseña en el Sistema de Control Documental.</p>
            
            <div class="code-container">
                <p>Tu código de verificación es:</p>
                <div class="code">{{ $codigo }}</div>
                <p>Ingresa este código en la ventana de recuperación de contraseña.</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Importante:</strong></p>
                <p>Este código expirará en <strong>{{ $tiempoExpiracion }} minutos</strong>.</p>
                <p>Si no solicitaste este código, puedes ignorar este correo.</p>
            </div>
            
            <div class="instructions">
                <p><strong>📋 Instrucciones:</strong></p>
                <ol>
                    <li>Regresa a la ventana de recuperación de contraseña</li>
                    <li>Ingresa el código mostrado arriba</li>
                    <li>Crea una nueva contraseña segura</li>
                    <li>Inicia sesión con tu nueva contraseña</li>
                </ol>
            </div>
            
            <p>Si tienes problemas, contacta al administrador del sistema.</p>
            
            <p>Saludos,<br>
            <strong>Equipo de Soporte Técnico</strong><br>
            Instituto Tecnológico de Ciudad Valles</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} TecNM Instituto Tecnológico de Ciudad Valles. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responder.</p>
        </div>
    </div>
</body>
</html>