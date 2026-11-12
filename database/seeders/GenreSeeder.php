<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;

class GenreSeeder extends Seeder
{
    public function run(): void
    {
        foreach (DemoData::GENRES as $tmdbId => $name) {
            Genre::query()->updateOrCreate(
                ['tmdb_id' => $tmdbId],
                ['name' => $name],
            );
        }

        $this->command?->info(sprintf('Géneros creados: %d.', count(DemoData::GENRES)));
    }
}
