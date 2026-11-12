<?php

namespace Database\Seeders;

use App\Models\Movie;
use App\Models\Review;
use App\Models\ReviewLike;
use App\Models\ReviewReply;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $mainUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();
        $movies = Movie::query()->orderBy('id')->get();
        $friends = User::query()
            ->whereIn('email', array_column(DemoData::FRIENDS, 'email'))
            ->get()
            ->keyBy('email');

        $featured = $movies->first();
        $mainReview = Review::query()->updateOrCreate(
            [
                'user_id' => $mainUser->id,
                'movie_id' => $featured->id,
            ],
            [
                'body' => 'Visualmente impresionante y con una banda sonora memorable.',
                'rating' => 5,
                'watched_at' => now()->subDays(2)->toDateString(),
            ],
        );

        foreach ($movies->slice(1, 4) as $index => $movie) {
            Review::query()->updateOrCreate(
                [
                    'user_id' => $mainUser->id,
                    'movie_id' => $movie->id,
                ],
                [
                    'body' => 'Reseña demo para actividad reciente del perfil.',
                    'rating' => random_int(3, 5),
                    'watched_at' => now()->subDays($index + 3)->toDateString(),
                ],
            );
        }

        $maria = $friends->get('amigo1@example.com');
        $carlos = $friends->get('amigo2@example.com');
        $laura = $friends->get('amigo3@example.com');

        foreach ([$maria, $carlos, $laura] as $index => $friend) {
            if (!$friend) {
                continue;
            }

            $movie = $movies->get($index + 2);

            if (!$movie) {
                continue;
            }

            $review = Review::query()->updateOrCreate(
                [
                    'user_id' => $friend->id,
                    'movie_id' => $movie->id,
                ],
                [
                    'body' => 'Una película que merece la pena ver en compañía.',
                    'rating' => random_int(4, 5),
                    'watched_at' => now()->subDays($index + 1)->toDateString(),
                ],
            );

            if ($index === 0) {
                ReviewLike::query()->firstOrCreate([
                    'review_id' => $mainReview->id,
                    'user_id' => $friend->id,
                ]);

                ReviewReply::query()->updateOrCreate(
                    [
                        'review_id' => $mainReview->id,
                        'user_id' => $friend->id,
                    ],
                    ['body' => 'Totalmente de acuerdo, una de mis favoritas.'],
                );
            }

            if ($index === 1) {
                ReviewLike::query()->firstOrCreate([
                    'review_id' => $review->id,
                    'user_id' => $mainUser->id,
                ]);
            }
        }

        $this->command?->info(sprintf(
            'Reseñas, likes y respuestas creados. Reseña destacada: %s.',
            $featured->title,
        ));
    }
}
