<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('codigos_recuperacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->string('codigo', 6);
            $table->timestamp('expira_en');
            $table->boolean('usado')->default(false);
            $table->timestamps();
            $table->index('usuario_id');
            $table->index('codigo');
            $table->index('expira_en');
            $table->index('usado');
            $table->index(['usuario_id', 'codigo', 'expira_en']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('codigos_recuperacion');
    }
};