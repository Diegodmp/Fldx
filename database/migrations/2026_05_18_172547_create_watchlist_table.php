<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('watchlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'watched'])->default('pending');
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5
            $table->unique(['user_id', 'movie_id']); // un usuario no puede tener la misma película dos veces
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('watchlist');
    }
};
