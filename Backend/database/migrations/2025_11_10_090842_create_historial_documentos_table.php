<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('historial_documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->string('tipo_documento');
            $table->string('nombre_archivo');
            $table->string('ruta_archivo');
            $table->boolean('es_actual')->default(false);
            $table->timestamp('fecha_expiracion')->nullable();
            $table->timestamps();
            $table->index(['usuario_id', 'tipo_documento']);
            $table->index(['fecha_expiracion']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('historial_documentos');
    }
};