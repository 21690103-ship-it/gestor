<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('historial_documentos', function (Blueprint $table) {
            $table->text('ruta_archivo')->change(); 
        });
    }

    public function down()
    {
        Schema::table('historial_documentos', function (Blueprint $table) {
            $table->string('ruta_archivo', 255)->change();
        });
    }
};