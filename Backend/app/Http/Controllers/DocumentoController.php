<?php

namespace App\Http\Controllers;

use App\Models\Usuarios;
use App\Models\HistorialDocumento; 
use App\Mail\NotificacionDocumento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class DocumentoController extends Controller
{
    public function subirDocumento(Request $request)
    {
        try {
            $request->validate([
                'archivo' => 'required|file|mimes:pdf|max:1024',
                'usuario_id' => 'required|exists:usuarios,id',
                'tipo_documento' => 'required|string'
            ]);

            $usuarioId = $request->usuario_id;
            $tipoDocumento = $request->tipo_documento;
            $archivo = $request->file('archivo');

            Log::info('📤 Subiendo documento', [
                'usuario_id' => $usuarioId,
                'tipo_documento' => $tipoDocumento,
                'archivo' => $archivo->getClientOriginalName()
            ]);

            $nombreArchivo = time() . '_' . uniqid() . '_' . $archivo->getClientOriginalName();
            $ruta = $archivo->storeAs('documentos', $nombreArchivo, 'public');

            $historialDocumento = HistorialDocumento::create([
                'usuario_id' => $usuarioId,
                'tipo_documento' => $tipoDocumento,
                'nombre_archivo' => $archivo->getClientOriginalName(),
                'ruta_archivo' => $ruta,
                'es_actual' => false,
                'fecha_expiracion' => null,
                'estado' => 'pendiente'
            ]);

            $this->enviarNotificacionAdmin($historialDocumento);

            Log::info('✅ Documento subido exitosamente', [
                'documento_id' => $historialDocumento->id,
                'ruta' => $ruta
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Documento subido correctamente. Espera la revisión del administrador.',
                'documento' => $historialDocumento
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al subir documento: ' . $e->getMessage(), [
                'usuario_id' => $request->usuario_id,
                'tipo_documento' => $request->tipo_documento,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al subir el documento: ' . $e->getMessage()
            ], 500);
        }
    }

    public function obtenerPendientes()
    {
        try {
            $usuario = auth()->user();
            
            Log::info('🔍 Admin solicitando documentos pendientes', [
                'admin_id' => $usuario->id,
                'admin_rfc' => $usuario->RFC,
                'es_admin' => $usuario->id_cargo == 1
            ]);

            if ($usuario->id_cargo != 1) {
                Log::warning('❌ Intento de acceso no autorizado a pendientes', [
                    'usuario_id' => $usuario->id,
                    'id_cargo' => $usuario->id_cargo
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos de administrador'
                ], 403);
            }

            $pendientes = HistorialDocumento::with(['usuario'])
                ->where('estado', 'pendiente')
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('📊 Documentos pendientes encontrados', [
                'total' => $pendientes->count(),
                'documentos' => $pendientes->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'tipo' => $doc->tipo_documento,
                        'usuario' => $doc->usuario ? $doc->usuario->nombre : 'N/A',
                        'archivo' => $doc->nombre_archivo
                    ];
                })
            ]);

            return response()->json([
                'success' => true,
                'pendientes' => $pendientes,
                'total' => $pendientes->count(),
                'debug' => [
                    'admin_id' => $usuario->id,
                    'query_time' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('💥 Error obteniendo pendientes: ' . $e->getMessage(), [
                'admin_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener documentos pendientes: ' . $e->getMessage()
            ], 500);
        }
    }

    public function adminDescargarDocumento($documentoId)
    {
        try {
            $admin = auth()->user();

            if ($admin->id_cargo != 1) {
                abort(403, 'Solo los administradores pueden acceder');
            }

            $documento = HistorialDocumento::with('usuario')->findOrFail($documentoId);

            Log::info('📥 Admin descargando documento', [
                'admin_id' => $admin->id,
                'documento_id' => $documentoId,
                'ruta_archivo' => $documento->ruta_archivo
            ]);

            $rutaArchivo = $documento->ruta_archivo;
            
            try {
                $rutaArchivo = Crypt::decryptString($documento->ruta_archivo);
                Log::info('🔓 Ruta descifrada correctamente');
            } catch (\Exception $e) {
                Log::info('📁 Usando ruta sin cifrado');
                $rutaArchivo = $documento->ruta_archivo;
            }

            if (Storage::disk('public')->exists($rutaArchivo)) {
                Log::info('✅ Archivo encontrado en disco public');
                return response()->file(
                    Storage::disk('public')->path($rutaArchivo),
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $documento->nombre_archivo . '"'
                    ]
                );
            } elseif (Storage::disk('local')->exists($rutaArchivo)) {
                Log::info('✅ Archivo encontrado en disco local');
                return response()->file(
                    Storage::disk('local')->path($rutaArchivo),
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $documento->nombre_archivo . '"'
                    ]
                );
            } else {
                Log::error('❌ Archivo no encontrado en ningún disco', [
                    'ruta_buscada' => $rutaArchivo,
                    'disco_public' => Storage::disk('public')->files('documentos'),
                    'disco_local' => Storage::disk('local')->exists($rutaArchivo)
                ]);
                abort(404, 'Documento no encontrado en el servidor');
            }

        } catch (\Exception $e) {
            Log::error('❌ Error admin descargando documento: ' . $e->getMessage());
            abort(404, 'Documento no disponible: ' . $e->getMessage());
        }
    }

    public function descargarDocumento($documentoId)
    {
        try {
            $user = auth()->user();

            $documento = HistorialDocumento::where('id', $documentoId)
                ->where('usuario_id', $user->id)
                ->where('estado', 'aprobado')
                ->firstOrFail();

            Log::info('📥 Usuario descargando documento', [
                'usuario_id' => $user->id,
                'documento_id' => $documentoId,
                'ruta_archivo' => $documento->ruta_archivo
            ]);

            $rutaArchivo = $documento->ruta_archivo;
            
            try {
                $rutaArchivo = Crypt::decryptString($documento->ruta_archivo);
            } catch (\Exception $e) {
            }

            if (Storage::disk('public')->exists($rutaArchivo)) {
                return response()->file(
                    Storage::disk('public')->path($rutaArchivo),
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $documento->nombre_archivo . '"'
                    ]
                );
            } elseif (Storage::disk('local')->exists($rutaArchivo)) {
                return response()->file(
                    Storage::disk('local')->path($rutaArchivo),
                    [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $documento->nombre_archivo . '"'
                    ]
                );
            } else {
                abort(404, 'Documento no encontrado');
            }

        } catch (\Exception $e) {
            Log::error('❌ Error descargando documento: ' . $e->getMessage());
            abort(404, 'Documento no disponible');
        }
    }

    public function obtenerDocumentos(Request $request)
    {
        try {
            $user = $request->user();
            
            Log::info('📁 Usuario solicitando sus documentos', [
                'usuario_id' => $user->id,
                'rfc' => $user->RFC
            ]);

            $documentosActuales = HistorialDocumento::where('usuario_id', $user->id)
                ->where('es_actual', true)
                ->where('estado', 'aprobado')
                ->get()
                ->keyBy('tipo_documento');

            Log::info('✅ Documentos del usuario encontrados', [
                'usuario_id' => $user->id,
                'total' => $documentosActuales->count(),
                'tipos' => array_keys($documentosActuales->toArray())
            ]);

            return response()->json([
                'success' => true,
                'documentos' => [
                    'acta_nacimiento' => $documentosActuales['acta_nacimiento'] ?? null,
                    'cartilla' => $documentosActuales['cartilla'] ?? null,
                    'comp_dom' => $documentosActuales['comp_dom'] ?? null,
                    'curp' => $documentosActuales['curp'] ?? null,
                    'csf' => $documentosActuales['csf'] ?? null,
                    'ine' => $documentosActuales['ine'] ?? null,
                    'cdp' => $documentosActuales['cdp'] ?? null,
                    'cni' => $documentosActuales['cni'] ?? null,
                    'cv' => $documentosActuales['cv'] ?? null,
                    'ugs' => $documentosActuales['ugs'] ?? null,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo documentos: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error al obtener documentos'
            ], 500);
        }
    }

    public function obtenerHistorialDocumentos($usuarioId, $tipoDocumento)
    {
        try {
            Log::info("🔍 Buscando historial para usuario: $usuarioId, tipo: $tipoDocumento");

            $tipoDocumentoMap = [
                'actaNacimiento' => 'acta_nacimiento',
                'comprobanteDomicilio' => 'comp_dom',
                'cartillaMilitar' => 'cartilla', 
                'curp' => 'curp',
                'ine' => 'ine',
                'csf' => 'csf',
                'cdp' => 'cdp',
                'cni' => 'cni',
                'cv' => 'cv',
                'ugs' => 'ugs'
            ];
            
            $tipoDocumentoBackend = $tipoDocumentoMap[$tipoDocumento] ?? $tipoDocumento;
            
            $historial = HistorialDocumento::where('usuario_id', $usuarioId)
                ->where('tipo_documento', $tipoDocumentoBackend)
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get();

            Log::info("📊 Historial encontrado", [
                'usuario_id' => $usuarioId,
                'tipo' => $tipoDocumentoBackend,
                'total' => $historial->count()
            ]);

            return response()->json([
                'success' => true,
                'historial' => $historial
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error al obtener historial: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el historial de documentos: ' . $e->getMessage()
            ], 500);
        }
    }

    // Aprobar documento CON ENVÍO DE CORREO
    public function aprobarDocumento(Request $request, $documentoId)
    {
        try {
            $admin = auth()->user();
            
            // Verificar que es administrador
            if ($admin->id_cargo != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos de administrador'
                ], 403);
            }

            $request->validate([
                'comentario' => 'nullable|string|max:500'
            ]);

            $documento = HistorialDocumento::with('usuario')->findOrFail($documentoId);

            Log::info('✅ Aprobando documento', [
                'admin_id' => $admin->id,
                'documento_id' => $documentoId,
                'usuario_documento' => $documento->usuario_id
            ]);

            // BUSCAR DOCUMENTO ANTERIOR ACTUAL
            $documentoAnterior = HistorialDocumento::where('usuario_id', $documento->usuario_id)
                ->where('tipo_documento', $documento->tipo_documento)
                ->where('es_actual', true)
                ->where('id', '!=', $documentoId)
                ->first();

            if ($documentoAnterior) {
                $documentoAnterior->update([
                    'es_actual' => false,
                    'fecha_expiracion' => now()->addDays(15)
                ]);

                Log::info('📄 Documento anterior marcado para expiración', [
                    'documento_anterior_id' => $documentoAnterior->id
                ]);
            }

            $documento->update([
                'estado' => 'aprobado',
                'es_actual' => true,
                'comentario_admin' => $request->comentario,
                'revisado_at' => now(),
                'revisado_por' => $admin->id,
                'fecha_expiracion' => null
            ]);

            Log::info('🎉 Documento aprobado exitosamente', [
                'documento_id' => $documentoId
            ]);

            // ✅ ENVÍO DE CORREO DE APROBACIÓN
            try {
                $tipoDocumentoTexto = $this->getTipoDocumentoTexto($documento->tipo_documento);
                
                Mail::to($documento->usuario->correo)
                    ->send(new NotificacionDocumento(
                        $documento->usuario,
                        $documento,
                        $tipoDocumentoTexto,
                        $request->comentario,
                        'aprobado'
                    ));
                
                Log::info('📧 Email de aprobación enviado', [
                    'usuario' => $documento->usuario->correo,
                    'documento_id' => $documentoId
                ]);
            } catch (\Exception $e) {
                Log::error('❌ Error enviando email de aprobación: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Documento aprobado correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error aprobando documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar el documento'
            ], 500);
        }
    }

    // Rechazar documento CON ENVÍO DE CORREO
    public function rechazarDocumento(Request $request, $documentoId)
    {
        try {
            $admin = auth()->user();
            
            // Verificar que es administrador
            if ($admin->id_cargo != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos de administrador'
                ], 403);
            }

            $request->validate([
                'comentario' => 'nullable|string|max:500'
            ]);

            $documento = HistorialDocumento::with('usuario')->findOrFail($documentoId);

            Log::info('❌ Rechazando documento', [
                'admin_id' => $admin->id,
                'documento_id' => $documentoId
            ]);

            // ✅ ENVÍO DE CORREO DE RECHAZO ANTES DE ELIMINAR
            try {
                $tipoDocumentoTexto = $this->getTipoDocumentoTexto($documento->tipo_documento);
                
                Mail::to($documento->usuario->correo)
                    ->send(new NotificacionDocumento(
                        $documento->usuario,
                        $documento,
                        $tipoDocumentoTexto,
                        $request->comentario,
                        'rechazado'
                    ));
                
                Log::info('📧 Email de rechazo enviado', [
                    'usuario' => $documento->usuario->correo,
                    'documento_id' => $documentoId
                ]);
            } catch (\Exception $e) {
                Log::error('❌ Error enviando email de rechazo: ' . $e->getMessage());
            }

            $rutaReal = $documento->ruta_archivo;

            if (Storage::disk('public')->exists($rutaReal)) {
                Storage::disk('public')->delete($rutaReal);
                Log::info('🗑️ Archivo físico eliminado', ['ruta' => $rutaReal]);
            }

            $documento->delete();

            Log::info('✅ Documento rechazado y eliminado', [
                'documento_id' => $documentoId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Documento rechazado correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error rechazando documento: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar el documento'
            ], 500);
        }
    }

    // Obtener documentos de usuario
    public function obtenerDocumentosUsuario($usuarioId)
    {
        try {
            $admin = auth()->user();

            if ($admin->id_cargo != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos de administrador'
                ], 403);
            }

            $documentos = HistorialDocumento::where('usuario_id', $usuarioId)
                ->where('estado', 'aprobado')
                ->where('es_actual', true)
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('📁 Documentos de usuario obtenidos', [
                'admin_id' => $admin->id,
                'usuario_id' => $usuarioId,
                'total_documentos' => $documentos->count()
            ]);

            return response()->json([
                'success' => true,
                'documentos' => $documentos,
                'total' => $documentos->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo documentos de usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener documentos del usuario'
            ], 500);
        }
    }

    // Notificación al administrador
    private function enviarNotificacionAdmin($documento)
    {
        try {
            $usuario = $documento->usuario;
            Log::info("📢 NUEVO DOCUMENTO PENDIENTE", [
                'usuario' => $usuario->nombre . ' ' . $usuario->ape_pat,
                'documento_id' => $documento->id,
                'tipo' => $documento->tipo_documento,
                'archivo' => $documento->nombre_archivo
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error en notificación admin: ' . $e->getMessage());
        }
    }

    private function getTipoDocumentoTexto($tipo)
    {
        $tipos = [
            'acta_nacimiento' => 'Acta de Nacimiento',
            'comp_dom' => 'Comprobante de Domicilio',
            'cartilla' => 'Cartilla Militar',
            'curp' => 'CURP',
            'ine' => 'INE "Instituto Nacional Electoral"',
            'csf' => 'Constancia de Situación Fiscal',
            'cdp' => 'Constancia de Declaracion Patrimonial', 
            'cni' => 'Constancia de No Inhabilitación',
            'cv' => 'Curriculum Vitae',
            'ugs' => 'Último Grado de Estudios'
        ];
        
        return $tipos[$tipo] ?? $tipo;
    }
}