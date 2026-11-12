<?php

namespace Database\Seeders;

use App\Models\Follow;
use App\Models\Review;
use App\Models\User;
use App\Models\Watchlist;
use Illuminate\Database\Seeder;

class FollowsSeeder extends Seeder
{
    public function run(): void
    {
        $friendUsers = User::query()
            ->whereIn('email', array_column(DemoData::FRIENDS, 'email'))
            ->get();

        $secondaryUser = User::query()->where('email', DemoData::SECONDARY_EMAIL)->firstOrFail();
        $profileUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();

        foreach ($friendUsers as $friend) {
            $this->createMutualFollow($secondaryUser, $friend);
            $this->createMutualFollow($profileUser, $friend);
        }

        $this->createMutualFollow($profileUser, $secondaryUser);

        Follow::query()->firstOrCreate([
            'follower_id' => $friendUsers->first()?->id,
            'following_id' => $secondaryUser->id,
        ]);

        $this->seedFriendActivity($friendUsers);

        $this->command?->info(sprintf(
            'Seguimientos: %s (%d amigos), %s (%d amigos).',
            $profileUser->email,
            $profileUser->friendsCount(),
            $secondaryUser->email,
            $secondaryUser->friendsCount(),
        ));
    }

    private function createMutualFollow(User $userA, User $userB): void
    {
        Follow::query()->firstOrCreate([
            'follower_id' => $userA->id,
            'following_id' => $userB->id,
        ]);

        Follow::query()->firstOrCreate([
            'follower_id' => $userB->id,
            'following_id' => $userA->id,
        ]);
    }

    private function seedFriendActivity($friends): void
    {
        $watchedEntries = Watchlist::query()
            ->where('status', 'watched')
            ->with('movie')
            ->limit(12)
            ->get();

        if ($watchedEntries->isEmpty()) {
            return;
        }

        foreach ($friends->values() as $index => $friend) {
            $entry = $watchedEntries->get($index % $watchedEntries->count());

            if (!$entry?->movie) {
                continue;
            }

            Watchlist::query()->updateOrCreate(
                [
                    'user_id' => $friend->id,
                    'movie_id' => $entry->movie_id,
                ],
                [
                    'status' => 'watched',
                    'rating' => random_int(3, 5),
                ],
            );

            if ($index % 2 === 0) {
                Review::query()->updateOrCreate(
                    [
                        'user_id' => $friend->id,
                        'movie_id' => $entry->movie_id,
                    ],
                    [
                        'body' => 'Actividad reciente de un amigo para el feed.',
                        'rating' => random_int(4, 5),
                        'watched_at' => now()->subDays($index + 1)->toDateString(),
                    ],
                );
            }
        }
    }
}
