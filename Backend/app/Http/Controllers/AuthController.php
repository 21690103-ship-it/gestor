<?php

namespace App\Http\Controllers;

use App\Models\Usuarios;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\CodigoRecuperacion;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $throttleKey = 'login:' . $request->ip() . ':' . Str::lower($request->RFC);
        
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Demasiados intentos. Por favor espere {$seconds} segundos.",
                'retry_after' => $seconds
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'RFC' => 'required|string|max:13',
            'contraseña' => 'required|string|min:1'
        ], [
            'RFC.required' => 'El RFC es obligatorio',
            'RFC.max' => 'El RFC no debe exceder 13 caracteres',
            'contraseña.required' => 'La contraseña es obligatoria'
        ]);

        if ($validator->fails()) {
            RateLimiter::hit($throttleKey, 300);
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $rfcNormalizado = Str::upper(Str::replace(' ', '', $request->RFC));
        
        $user = Usuarios::where('RFC', $rfcNormalizado)->first();

        if (!$user || !Hash::check($request->contraseña, $user->contraseña)) {
            RateLimiter::hit($throttleKey, 300); // ✅ 5 minutos de bloqueo
            \Log::warning('Intento de login fallido', [
                'rfc' => $rfcNormalizado,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'RFC o contraseña incorrectos'
            ], 401);
        }

        RateLimiter::clear($throttleKey);
        
        $token = $user->createToken('react-app')->plainTextToken;

        \Log::info('Login exitoso', [
            'user_id' => $user->id,
            'rfc' => $user->RFC,
            'ip' => $request->ip()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => null, 
            'user' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'ape_pat' => $user->ape_pat,
                'ape_mat' => $user->ape_mat,
                'correo' => $user->correo,
                'RFC' => $user->RFC,
                'genero' => $user->genero,
                'id_cargo' => $user->id_cargo,
                'debe_mostrar_cartilla_militar' => $user->genero === 'masculino'
            ]
        ]);
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            \Log::info('Logout', [
                'user_id' => $user->id,
                'rfc' => $user->RFC
            ]);

            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada correctamente'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error en logout:', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión'
            ], 500);
        }
    }

    public function user(Request $request)
    {
        try {
            $user = $request->user();
            
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'ape_pat' => $user->ape_pat,
                    'ape_mat' => $user->ape_mat,
                    'correo' => $user->correo,
                    'RFC' => $user->RFC,
                    'genero' => $user->genero,
                    'id_cargo' => $user->id_cargo,
                    'debe_mostrar_cartilla_militar' => $user->genero === 'masculino'
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error obteniendo usuario:', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información del usuario'
            ], 500);
        }
    }

    public function verifyToken(Request $request)
    {
        try {
            $user = $request->user();
            
            return response()->json([
                'success' => true,
                'message' => 'Token válido',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'rfc' => $user->RFC,
                    'id_cargo' => $user->id_cargo
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado'
            ], 401);
        }
    }

    public function recuperarContrasena(Request $request)
{
    try {
        $request->validate([
            'RFC' => 'required|string|max:13',
            'correo' => 'required|email',
            'accion' => 'required|in:solicitar'
        ]);

        $usuario = Usuarios::where('RFC', strtoupper($request->RFC))
            ->where('correo', $request->correo)
            ->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró un usuario con esos datos'
            ], 404);
        }

        \DB::table('codigos_recuperacion')
            ->where('usuario_id', $usuario->id)
            ->where('expira_en', '<', now())
            ->orWhere('created_at', '<', now()->subHour())
            ->delete();

        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        \DB::table('codigos_recuperacion')->insert([
            'usuario_id' => $usuario->id,
            'codigo' => $codigo,
            'expira_en' => now()->addMinutes(15),
            'usado' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        try {
            Mail::to($usuario->correo)->send(new CodigoRecuperacion($codigo, $usuario->nombre));
            Log::info('✅ Email de recuperación preparado', [
                'usuario_id' => $usuario->id,
                'correo' => $usuario->correo,
                'codigo' => $codigo
            ]);
        } catch (\Exception $mailError) {
            Log::warning('⚠️ Error enviando email, pero código generado', [
                'error' => $mailError->getMessage(),
                'usuario_id' => $usuario->id
            ]);
        }

        Log::info('Código de recuperación generado', [
            'usuario_id' => $usuario->id,
            'codigo' => $codigo
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Código de recuperación enviado al correo',
            'codigo' => config('app.debug') ? $codigo : null // Solo en desarrollo
        ]);

    } catch (\Exception $e) {
        Log::error('Error en recuperación de contraseña:', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al procesar la solicitud: ' . (config('app.debug') ? $e->getMessage() : 'Error interno'),
            'debug' => config('app.debug') ? [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ] : null
        ], 500);
    }
}

public function verificarCodigoRecuperacion(Request $request)
{
    try {
        $request->validate([
            'RFC' => 'required|string|max:13',
            'codigo' => 'required|string|size:6'
        ]);

        $usuario = Usuarios::where('RFC', strtoupper($request->RFC))->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $codigoRecuperacion = \DB::table('codigos_recuperacion')
            ->where('usuario_id', $usuario->id)
            ->where('codigo', $request->codigo)
            ->where('expira_en', '>', now())
            ->where('usado', false)
            ->first();

        if (!$codigoRecuperacion) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido o expirado'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Código verificado correctamente'
        ]);

    } catch (\Exception $e) {
        Log::error('Error verificando código:', [
            'error' => $e->getMessage()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al verificar el código'
        ], 500);
    }
}

public function cambiarContrasena(Request $request)
{
    try {
        $request->validate([
            'RFC' => 'required|string|max:13',
            'codigo' => 'required|string|size:6',
            'nuevaContraseña' => 'required|string|min:6'
        ]);

        $usuario = Usuarios::where('RFC', strtoupper($request->RFC))->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $codigoRecuperacion = \DB::table('codigos_recuperacion')
            ->where('usuario_id', $usuario->id)
            ->where('codigo', $request->codigo)
            ->where('expira_en', '>', now())
            ->where('usado', false)
            ->first();

        if (!$codigoRecuperacion) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido o expirado'
            ], 400);
        }

        $usuario->contraseña = Hash::make($request->nuevaContraseña);
        $usuario->save();

        \DB::table('codigos_recuperacion')
            ->where('id', $codigoRecuperacion->id)
            ->update(['usado' => true]);

        Log::info('Contraseña cambiada exitosamente', [
            'usuario_id' => $usuario->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña cambiada exitosamente'
        ]);

    } catch (\Exception $e) {
        Log::error('Error cambiando contraseña:', [
            'error' => $e->getMessage()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Error al cambiar la contraseña'
        ], 500);
    }
}
}