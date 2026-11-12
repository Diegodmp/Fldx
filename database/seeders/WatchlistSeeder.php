<?php

namespace Database\Seeders;

use App\Models\Movie;
use App\Models\User;
use App\Models\Watchlist;
use Illuminate\Database\Seeder;

class WatchlistSeeder extends Seeder
{
    public function run(): void
    {
        $mainUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();
        $movies = Movie::query()->orderBy('id')->get();

        foreach ($movies as $index => $movie) {
            Watchlist::query()->updateOrCreate(
                [
                    'user_id' => $mainUser->id,
                    'movie_id' => $movie->id,
                ],
                [
                    'status' => $index < 11 ? 'watched' : 'pending',
                    'rating' => $index < 11 ? random_int(3, 5) : null,
                ],
            );
        }

        $secondaryUser = User::query()->where('email', DemoData::SECONDARY_EMAIL)->first();

        if ($secondaryUser) {
            foreach ($movies->take(6) as $index => $movie) {
                Watchlist::query()->updateOrCreate(
                    [
                        'user_id' => $secondaryUser->id,
                        'movie_id' => $movie->id,
                    ],
                    [
                        'status' => $index < 4 ? 'watched' : 'pending',
                        'rating' => $index < 4 ? random_int(3, 5) : null,
                    ],
                );
            }
        }

        $this->command?->info(sprintf(
            'Watchlist de %s: %d vistas, %d pendientes.',
            $mainUser->email,
            11,
            1,
        ));
    }
}
