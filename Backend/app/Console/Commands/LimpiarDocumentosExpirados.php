<?php

namespace App\Console\Commands;

use App\Models\HistorialDocumento;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class LimpiarDocumentosExpirados extends Command
{
    protected $signature = 'documentos:limpiar';
    protected $description = 'Eliminar documentos expirados del sistema';

    public function handle()
    {
        $this->info('🔍 Buscando documentos expirados...');
        
        $expirados = HistorialDocumento::where('fecha_expiracion', '<', now())
            ->where('es_actual', false)
            ->get();

        $this->info("📄 Encontrados {$expirados->count()} documentos expirados");

        $eliminados = 0;
        
        foreach ($expirados as $documento) {
            try {
                // Eliminar archivo físico
                if (Storage::disk('public')->exists($documento->ruta_archivo)) {
                    Storage::disk('public')->delete($documento->ruta_archivo);
                    $this->line("🗑️  Archivo eliminado: {$documento->nombre_archivo}");
                }
                
                // Eliminar registro de la base de datos
                $documento->delete();
                $eliminados++;

                Log::info("🗑️ Documento expirado eliminado", [
                    'id' => $documento->id,
                    'archivo' => $documento->nombre_archivo,
                    'tipo' => $documento->tipo_documento
                ]);

            } catch (\Exception $e) {
                $this->error("❌ Error eliminando documento {$documento->id}: " . $e->getMessage());
                Log::error("❌ Error eliminando documento expirado", [
                    'id' => $documento->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info("✅ {$eliminados} documentos expirados eliminados correctamente");
        return 0;
    }
}