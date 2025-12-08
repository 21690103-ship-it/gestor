<?php

namespace App\Http\Controllers;

use App\Models\Usuarios;
use App\Models\HistorialDocumento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;

class UsuarioController extends Controller
{
    /**
     * Obtener todos los usuarios tipo cliente (id_cargo = 2)
     */
public function obtenerClientes(Request $request)
    {
        try {
            Log::info('🔍 INICIANDO: obtenerClientes()', [
                'admin_id' => auth()->id(),
                'admin_rfc' => auth()->user()->RFC
            ]);

            if (auth()->user()->id_cargo != 1) {
                Log::warning('❌ USUARIO NO ES ADMIN', [
                    'user_id' => auth()->id(),
                    'id_cargo' => auth()->user()->id_cargo
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos de administrador'
                ], 403);
            }

            Log::info('📊 Ejecutando consulta de usuarios...');
            
            $usuarios = Usuarios::where('id_cargo', 2)
                ->select([
                    'id',
                    'nombre',
                    'ape_pat', 
                    'ape_mat',
                    'RFC',
                    'correo',
                    'genero',
                    'id_cargo',
                    'created_at',
                    'updated_at'
                ])
                ->get();

            Log::info('✅ CONSULTA EXITOSA', [
                'total_usuarios' => $usuarios->count(),
                'usuarios_encontrados' => $usuarios->pluck('id')
            ]);

            return response()->json([
                'success' => true,
                'usuarios' => $usuarios,
                'total' => $usuarios->count(),
                'debug' => [
                    'query_executed' => true,
                    'admin_id' => auth()->id()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('💥 ERROR CRÍTICO en obtenerClientes:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id() ?? 'no-auth'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la lista de usuarios',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno del servidor',
                'debug_info' => env('APP_DEBUG') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ] : null
            ], 500);
        }
    }
    
    public function obtenerTodosUsuarios()
{
    try {
        Log::info('🔍 Obteniendo TODOS los usuarios para diagnóstico');

        $usuarios = Usuarios::select([
            'id',
            'nombre', 
            'ape_pat',
            'ape_mat',
            'RFC',
            'correo',
            'genero',
            'id_cargo',
            'created_at'
        ])->get();

        Log::info("✅ Total de usuarios en sistema: {$usuarios->count()}");

        foreach ($usuarios as $usuario) {
            Log::info("👤 Usuario:", [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'id_cargo' => $usuario->id_cargo,
                'tipo_id_cargo' => gettype($usuario->id_cargo)
            ]);
        }

        return response()->json([
            'success' => true,
            'usuarios' => $usuarios,
            'total' => $usuarios->count(),
            'debug_info' => [
                'usuarios' => $usuarios->map(function($user) {
                    return [
                        'id' => $user->id,
                        'nombre' => $user->nombre,
                        'id_cargo' => $user->id_cargo,
                        'tipo' => gettype($user->id_cargo)
                    ];
                })
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('❌ Error obteniendo todos los usuarios:', [
            'error' => $e->getMessage()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Obtener un usuario específico por ID
     */
    public function obtenerUsuario($id)
    {
        try {
            Log::info("🔍 Obteniendo usuario ID: {$id}");

            $usuario = Usuarios::where('id', $id)->first();

            if (!$usuario) {
                Log::warning("⚠️ Usuario no encontrado: {$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            Log::info("✅ Usuario encontrado: {$usuario->nombre}");

            return response()->json([
                'success' => true,
                'usuario' => $usuario
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo usuario:', [
                'id' => $id, 
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el usuario',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Buscar usuarios por término
     */
    public function buscarUsuarios(Request $request)
    {
        try {
            $termino = $request->query('q', '');
            Log::info("🔍 Buscando usuarios con término: '{$termino}'");

            $usuarios = Usuarios::where(function($query) use ($termino) {
                    $query->where('nombre', 'LIKE', "%{$termino}%")
                          ->orWhere('ape_pat', 'LIKE', "%{$termino}%")
                          ->orWhere('ape_mat', 'LIKE', "%{$termino}%")
                          ->orWhere('RFC', 'LIKE', "%{$termino}%")
                          ->orWhere('correo', 'LIKE', "%{$termino}%");
                })
                ->select([
                    'id',
                    'nombre',
                    'ape_pat',
                    'ape_mat',
                    'RFC',
                    'correo',
                    'genero',
                    'id_cargo',
                    'debe_mostrar_cartilla_militar'
                ])
                ->get();

            Log::info("✅ Búsqueda completada. Resultados: {$usuarios->count()}");

            return response()->json([
                'success' => true,
                'usuarios' => $usuarios,
                'termino' => $termino,
                'total' => $usuarios->count()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error buscando usuarios:', [
                'termino' => $termino, 
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda de usuarios',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Actualizar estado de un usuario
     */
    public function actualizarEstado(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'estado' => 'required|in:pendiente,aceptado,rechazado'
            ]);

            Log::info("🔄 Actualizando estado del usuario ID: {$id}");

            $usuario = Usuarios::where('id', $id)->first();

            if (!$usuario) {
                Log::warning("⚠️ Usuario no encontrado para actualizar: {$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario->estado = $request->estado;
            $usuario->save();

            DB::commit();

            Log::info('✅ Estado de usuario actualizado:', [
                'usuario_id' => $id,
                'nuevo_estado' => $request->estado
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado correctamente',
                'usuario' => $usuario
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Error actualizando estado:', [
                'id' => $id,
                'estado' => $request->estado,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el estado',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    public function test()
    {
        try {
            // Verificar conexión a la base de datos
            DB::connection()->getPdo();
            
            // Verificar que la tabla usuarios existe
            $tableExists = DB::select("SHOW TABLES LIKE 'usuarios'");
            
            // Contar usuarios
            $userCount = Usuarios::count();

            return response()->json([
                'success' => true,
                'message' => '✅ UsuarioController está funcionando correctamente',
                'database' => 'Conectada',
                'tabla_usuarios' => !empty($tableExists) ? 'Existe' : 'No existe',
                'total_usuarios' => $userCount,
                'timestamp' => now()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Error en test: ' . $e->getMessage(),
                'database' => 'Error de conexión'
            ], 500);
        }
    }

    /**
     * Verificar estructura de la tabla usuarios
     */
    public function verificarEstructura()
    {
        try {
            $estructura = DB::select('DESCRIBE usuarios');
            
            return response()->json([
                'success' => true,
                'estructura' => $estructura,
                'total_campos' => count($estructura)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar estructura: ' . $e->getMessage()
            ], 500);
        }
    }


public function crearUsuario(Request $request)
{
    try {
        $admin = auth()->user();

        if ($admin->id_cargo != 1) {
            return response()->json([
                'success' => false,
                'message' => 'No tiene permisos de administrador'
            ], 403);
        }

        Log::info('📝 Admin intentando crear usuario', [
            'admin_id' => $admin->id,
            'datos_recibidos' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'ape_pat' => 'required|string|max:255',
            'ape_mat' => 'nullable|string|max:255',
            'RFC' => 'required|string|max:13|unique:usuarios',
            'correo' => 'required|email|unique:usuarios',
            'genero' => 'required|in:masculino,femenino',
            'contraseña' => 'required|string|min:6',
            'id_cargo' => 'required|integer|in:2'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Crear usuario
        $usuario = Usuarios::create([
            'nombre' => $request->nombre,
            'ape_pat' => $request->ape_pat,
            'ape_mat' => $request->ape_mat,
            'RFC' => strtoupper($request->RFC),
            'correo' => $request->correo,
            'genero' => $request->genero,
            'contraseña' => Hash::make($request->contraseña),
            'id_cargo' => $request->id_cargo
        ]);

        Log::info('✅ Usuario creado exitosamente', [
            'admin_id' => $admin->id,
            'usuario_id' => $usuario->id,
            'rfc' => $usuario->RFC
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario creado correctamente',
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'ape_pat' => $usuario->ape_pat,
                'ape_mat' => $usuario->ape_mat,
                'RFC' => $usuario->RFC,
                'correo' => $usuario->correo,
                'genero' => $usuario->genero,
                'id_cargo' => $usuario->id_cargo
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('❌ Error creando usuario: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al crear el usuario: ' . $e->getMessage()
        ], 500);
    }
}

public function eliminarUsuario($usuarioId)
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

        \Log::info('🗑️ Admin eliminando usuario COMPLETAMENTE', [
            'admin_id' => $admin->id,
            'usuario_id' => $usuarioId
        ]);

        $usuario = \App\Models\Usuarios::where('id', $usuarioId)
            ->where('id_cargo', 2) // Solo se pueden eliminar usuarios cliente
            ->first();

        if (!$usuario) {
            \Log::warning('❌ Usuario no encontrado para eliminar', [
                'usuario_id' => $usuarioId
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado o no se puede eliminar'
            ], 404);
        }

        // ✅ OBTENER DOCUMENTOS DEL USUARIO PARA ELIMINAR ARCHIVOS FÍSICOS
        $documentos = \App\Models\HistorialDocumento::where('usuario_id', $usuarioId)->get();

        \Log::info('📄 Documentos a eliminar:', [
            'usuario_id' => $usuarioId,
            'total_documentos' => $documentos->count()
        ]);

        // ✅ ELIMINAR ARCHIVOS FÍSICOS DEL STORAGE
        foreach ($documentos as $documento) {
            try {
                $rutaArchivo = $documento->ruta_archivo;
                
                try {
                    $rutaArchivo = \Illuminate\Support\Facades\Crypt::decryptString($documento->ruta_archivo);
                } catch (\Exception $e) {
                    \Log::info('📁 Usando ruta sin cifrado para eliminar archivo');
                }

                \Log::info('🗑️ Eliminando archivo físico:', [
                    'documento_id' => $documento->id,
                    'ruta_archivo' => $rutaArchivo
                ]);

                // Eliminar de storage público
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($rutaArchivo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($rutaArchivo);
                    \Log::info('✅ Archivo físico eliminado de public:', ['ruta' => $rutaArchivo]);
                }

                // También intentar eliminar de storage local/private
                if (\Illuminate\Support\Facades\Storage::disk('local')->exists($rutaArchivo)) {
                    \Illuminate\Support\Facades\Storage::disk('local')->delete($rutaArchivo);
                    \Log::info('✅ Archivo físico eliminado de local:', ['ruta' => $rutaArchivo]);
                }

            } catch (\Exception $fileError) {
                \Log::error('⚠️ Error eliminando archivo físico: ' . $fileError->getMessage(), [
                    'documento_id' => $documento->id,
                    'ruta_archivo' => $documento->ruta_archivo
                ]);
            }
        }

        // ELIMINAR REGISTROS DE LA BASE DE DATOS
        $documentosEliminados = \App\Models\HistorialDocumento::where('usuario_id', $usuarioId)->delete();
        
        \Log::info('🗃️ Registros de documentos eliminados:', [
            'usuario_id' => $usuarioId,
            'documentos_eliminados' => $documentosEliminados
        ]);

        // ELIMINAR EL USUARIO
        $usuarioEliminado = $usuario->delete();

        \Log::info('✅ Usuario eliminado completamente', [
            'admin_id' => $admin->id,
            'usuario_id' => $usuarioId,
            'usuario_rfc' => $usuario->RFC,
            'documentos_eliminados' => $documentosEliminados,
            'usuario_eliminado' => $usuarioEliminado
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario y todos sus documentos eliminados correctamente',
            'datos_eliminados' => [
                'usuario' => true,
                'documentos' => $documentosEliminados
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('❌ Error eliminando usuario completamente: ' . $e->getMessage(), [
            'usuario_id' => $usuarioId,
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al eliminar el usuario: ' . $e->getMessage()
        ], 500);
    }
}

public function actualizarPerfil(Request $request, $id)
{
    try {
        \Log::info('🔄 Usuario intentando actualizar perfil', [
            'usuario_id' => $id,
            'datos_recibidos' => $request->all(),
            'usuario_autenticado' => auth()->id()
        ]);
        
        $usuario = Usuarios::find($id);
        
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        // Verificar que el usuario solo pueda actualizar su propio perfil
        $usuarioAutenticado = auth()->user();
        if ($usuarioAutenticado->id != $id && $usuarioAutenticado->id_cargo != 1) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para actualizar este perfil'
            ], 403);
        }
        
        // ✅ VALIDACIÓN - ape_mat puede ser null
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'ape_pat' => 'required|string|max:100',
            'ape_mat' => 'nullable|string|max:100',
            'RFC' => 'required|string|max:13',
            'correo' => 'required|email|unique:usuarios,correo,' . $id,
            'contraseña' => 'nullable|string|min:6'
        ]);
        
        \Log::info('✅ Validación pasada, actualizando datos...');
        
        // ✅ MANEJO MEJORADO DE ape_mat
        // Si viene como null o string vacío, establecer como null
        $apeMat = isset($validated['ape_mat']) && trim($validated['ape_mat']) !== '' 
            ? $validated['ape_mat'] 
            : null;
        
        // Actualizar datos básicos
        $datosActualizar = [
            'nombre' => $validated['nombre'],
            'ape_pat' => $validated['ape_pat'],
            'ape_mat' => $apeMat, // ✅ Puede ser null
            'RFC' => strtoupper($validated['RFC']),
            'correo' => $validated['correo']
        ];
        
        // Actualizar contraseña si se proporcionó
        if (!empty($validated['contraseña'])) {
            $datosActualizar['contraseña'] = Hash::make($validated['contraseña']);
            \Log::info('🔐 Contraseña actualizada');
        }
        
        $usuario->update($datosActualizar);
        
        \Log::info('✅ Usuario actualizado exitosamente', [
            'usuario_id' => $id,
            'campos_actualizados' => array_keys($datosActualizar),
            'ape_mat_final' => $usuario->ape_mat
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado correctamente',
            'usuario' => $usuario->only(['id', 'nombre', 'ape_pat', 'ape_mat', 'RFC', 'correo', 'genero'])
        ]);
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('❌ Error de validación:', $e->errors());
        return response()->json([
            'success' => false,
            'message' => 'Error de validación',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        \Log::error('❌ Error actualizando usuario: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al actualizar el perfil: ' . $e->getMessage()
        ], 500);
    }
}
}