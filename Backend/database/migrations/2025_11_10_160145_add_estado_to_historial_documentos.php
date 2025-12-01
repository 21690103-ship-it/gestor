<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up()
{
    Schema::table('historial_documentos', function (Blueprint $table) {
        $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
        $table->text('comentario_admin')->nullable();
        $table->timestamp('revisado_at')->nullable();
        $table->unsignedBigInteger('revisado_por')->nullable();
        
        $table->foreign('revisado_por')->references('id')->on('usuarios');
    });
}

    public function down(): void
    {
        Schema::table('historial_documentos', function (Blueprint $table) {
            //
        });
    }
};
