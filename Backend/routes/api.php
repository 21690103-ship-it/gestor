<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\UsuarioController;

// ==================== RUTAS PÚBLICAS ====================

// Ruta de prueba general
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => '✅ API funcionando correctamente',
            'timestamp' => now()
        ]);
    });

// Diagnóstico del sistema (RUTAS PÚBLICAS - sin autenticación)
    Route::prefix('diagnostic')->group(function () {
        Route::get('/usuarios/test', [UsuarioController::class, 'test']);
        Route::get('/usuarios/estructura', [UsuarioController::class, 'verificarEstructura']);
        Route::get('/usuarios/todos', [UsuarioController::class, 'obtenerTodosUsuarios']);
        Route::get('/database', function () {
            try {
                \DB::connection()->getPdo();
                return response()->json([
                    'success' => true,
                    'message' => '✅ Base de datos conectada',
                    'database' => \DB::connection()->getDatabaseName()
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => '❌ Error de base de datos: ' . $e->getMessage()
                ], 500);
            }
        });
    });

// En las rutas públicas
    Route::prefix('auth')->group(function () {
        Route::post('/recuperar-contrasena', [AuthController::class, 'recuperarContrasena']);
        Route::post('/verificar-codigo', [AuthController::class, 'verificarCodigoRecuperacion']);
        Route::post('/cambiar-contrasena', [AuthController::class, 'cambiarContrasena']);
    });

// Autenticación (pública)
Route::post('/login', [AuthController::class, 'login']);

// ==================== RUTAS PROTEGIDAS ====================

Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/verify-token', [AuthController::class, 'verifyToken']);
    
    // Documentos
    Route::prefix('documentos')->group(function () {
        Route::post('/subir', [DocumentoController::class, 'subirDocumento']);
        Route::get('/', [DocumentoController::class, 'obtenerDocumentos']);
        Route::delete('/{tipoDocumento}', [DocumentoController::class, 'eliminarDocumento']);
        Route::get('/historial/{usuarioId}/{tipoDocumento}', [DocumentoController::class, 'obtenerHistorialDocumentos']);
        Route::get('/descargar/{documentoId}', [DocumentoController::class, 'descargarDocumento']);
    });
    
    // Usuarios
    Route::prefix('usuarios')->group(function () {
        Route::get('/clientes', [UsuarioController::class, 'obtenerClientes']);
        Route::get('/buscar', [UsuarioController::class, 'buscarUsuarios']);
        Route::put('/{id}/perfil', [UsuarioController::class, 'actualizarPerfil']);
        Route::put('/{id}', [UsuarioController::class, 'actualizarUsuario']);
        Route::put('/{id}/estado', [UsuarioController::class, 'actualizarEstado']);
        Route::get('/{id}', [UsuarioController::class, 'obtenerUsuario']);
    });
    
    // Administrador
    Route::prefix('admin')->group(function () {
        // Documentos de administrador
    Route::prefix('documentos')->group(function () {
        Route::get('/pendientes', [DocumentoController::class, 'obtenerPendientes']);
        Route::post('/{documentoId}/aprobar', [DocumentoController::class, 'aprobarDocumento']);
        Route::post('/{documentoId}/rechazar', [DocumentoController::class, 'rechazarDocumento']);
        Route::get('/descargar/{documentoId}', [DocumentoController::class, 'adminDescargarDocumento']);
    });
    Route::post('/usuarios', [UsuarioController::class, 'crearUsuario']);
    Route::delete('/usuarios/{usuarioId}', [UsuarioController::class, 'eliminarUsuario']);
    Route::get('/usuarios/{usuarioId}/documentos', [DocumentoController::class, 'obtenerDocumentosUsuario']);
    });
});