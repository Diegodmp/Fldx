<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_poll_movies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained('group_polls')->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained()->cascadeOnDelete();
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['poll_id', 'movie_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_poll_movies');
    }
};
