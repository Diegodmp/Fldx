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
        Schema::create('group_movies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('movie_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proposed_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('votes_up')->default(0);
            $table->unsignedInteger('votes_down')->default(0);
            $table->unique(['group_id', 'movie_id']); // una película no puede proponerse dos veces en el mismo grupo
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_movies');
    }
};
