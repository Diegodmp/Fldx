<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_movie_id')->constrained('group_poll_movies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('vote');
            $table->timestamps();

            $table->unique(['poll_movie_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_poll_votes');
    }
};
