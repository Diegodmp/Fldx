<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('group_movies', function (Blueprint $table) {
            $table->dropColumn(['votes_up', 'votes_down']);
        });
    }

    public function down(): void
    {
        Schema::table('group_movies', function (Blueprint $table) {
            $table->unsignedInteger('votes_up')->default(0)->after('proposed_by');
            $table->unsignedInteger('votes_down')->default(0)->after('votes_up');
        });
    }
};
