<?php

namespace Database\Seeders;

use App\Models\Genre;
use App\Models\Movie;
use Illuminate\Database\Seeder;

class MovieSeeder extends Seeder
{
    public function run(): void
    {
        $genreIdsByTmdb = Genre::query()->pluck('id', 'tmdb_id');

        foreach (DemoData::MOVIES as $data) {
            $movie = Movie::query()->updateOrCreate(
                ['tmdb_id' => $data['tmdb_id']],
                [
                    'title' => $data['title'],
                    'overview' => 'Película de demo con datos reales de TMDB.',
                    'poster_path' => $data['poster_path'],
                    'release_year' => $data['release_year'],
                    'duration' => $data['duration'],
                    'genre_ids' => $data['genre_ids'],
                ],
            );

            $pivotGenreIds = collect($data['genre_ids'])
                ->map(fn (int $tmdbId) => $genreIdsByTmdb->get($tmdbId))
                ->filter()
                ->values()
                ->all();

            if ($pivotGenreIds !== []) {
                $movie->genres()->sync($pivotGenreIds);
            }
        }

        $this->command?->info(sprintf('Películas creadas: %d.', count(DemoData::MOVIES)));
    }
}
