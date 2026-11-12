<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_movie_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_movie_id')->constrained('group_movies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('vote');
            $table->timestamps();

            $table->unique(['group_movie_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_movie_votes');
    }
};
