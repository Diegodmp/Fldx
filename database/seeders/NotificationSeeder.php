<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupPoll;
use App\Models\Movie;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $mainUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();
        $secondaryUser = User::query()->where('email', DemoData::SECONDARY_EMAIL)->firstOrFail();
        $maria = User::query()->where('email', 'amigo1@example.com')->firstOrFail();

        $mainGroup = Group::query()->where('name', 'Cineclub Filmdex')->firstOrFail();
        $openPoll = GroupPoll::query()
            ->where('group_id', $mainGroup->id)
            ->where('status', GroupPoll::STATUS_OPEN)
            ->firstOrFail();
        $closedPoll = GroupPoll::query()
            ->where('status', GroupPoll::STATUS_CLOSED)
            ->firstOrFail();
        $featuredMovie = Movie::query()->orderBy('id')->firstOrFail();
        $mainReview = Review::query()
            ->where('user_id', $mainUser->id)
            ->where('movie_id', $featuredMovie->id)
            ->firstOrFail();

        $notifications = [
            [
                'type' => NotificationService::TYPE_GROUP_INVITATION,
                'read_at' => null,
                'data' => [
                    'group_id' => Group::query()->where('name', 'Sala vintage')->value('id'),
                    'group_name' => 'Sala vintage',
                    'actor_id' => $secondaryUser->id,
                    'actor_name' => $secondaryUser->name,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_INVITATION_ACCEPTED,
                'read_at' => now()->subDay(),
                'data' => [
                    'group_id' => $mainGroup->id,
                    'group_name' => $mainGroup->name,
                    'actor_id' => $maria->id,
                    'actor_name' => $maria->name,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_INVITATION_REJECTED,
                'read_at' => now()->subDays(2),
                'data' => [
                    'group_id' => Group::query()->where('name', 'Estrenos 2026')->value('id'),
                    'group_name' => 'Estrenos 2026',
                    'actor_id' => User::query()->where('email', 'amigo2@example.com')->value('id'),
                    'actor_name' => 'Carlos Ruiz',
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_WATCHLIST_MOVIE_ADDED,
                'read_at' => null,
                'data' => [
                    'group_id' => $mainGroup->id,
                    'group_name' => $mainGroup->name,
                    'actor_id' => $secondaryUser->id,
                    'actor_name' => $secondaryUser->name,
                    'movie_id' => $featuredMovie->id,
                    'movie_title' => $featuredMovie->title,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_POLL_CREATED,
                'read_at' => null,
                'data' => [
                    'group_id' => $mainGroup->id,
                    'group_name' => $mainGroup->name,
                    'poll_id' => $openPoll->id,
                    'poll_title' => $openPoll->title,
                    'actor_id' => $secondaryUser->id,
                    'actor_name' => $secondaryUser->name,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_POLL_CLOSED,
                'read_at' => now()->subHours(6),
                'data' => [
                    'group_id' => $closedPoll->group_id,
                    'group_name' => Group::query()->whereKey($closedPoll->group_id)->value('name'),
                    'poll_id' => $closedPoll->id,
                    'poll_title' => $closedPoll->title,
                    'actor_id' => $secondaryUser->id,
                    'actor_name' => $secondaryUser->name,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_POLL_MOVIE_ADDED,
                'read_at' => null,
                'data' => [
                    'group_id' => $mainGroup->id,
                    'group_name' => $mainGroup->name,
                    'poll_id' => $openPoll->id,
                    'poll_title' => $openPoll->title,
                    'actor_id' => $mainUser->id,
                    'actor_name' => $mainUser->name,
                    'movie_id' => $featuredMovie->id,
                    'movie_title' => $featuredMovie->title,
                ],
            ],
            [
                'type' => NotificationService::TYPE_GROUP_POLL_VOTED,
                'read_at' => null,
                'data' => [
                    'group_id' => $mainGroup->id,
                    'group_name' => $mainGroup->name,
                    'poll_id' => $openPoll->id,
                    'poll_title' => $openPoll->title,
                    'actor_id' => $maria->id,
                    'actor_name' => $maria->name,
                ],
            ],
            [
                'type' => NotificationService::TYPE_REVIEW_LIKED,
                'read_at' => null,
                'data' => [
                    'actor_id' => $maria->id,
                    'actor_name' => $maria->name,
                    'review_id' => $mainReview->id,
                    'movie_id' => $featuredMovie->id,
                    'movie_tmdb_id' => $featuredMovie->tmdb_id,
                    'movie_title' => $featuredMovie->title,
                ],
            ],
            [
                'type' => NotificationService::TYPE_REVIEW_REPLIED,
                'read_at' => now()->subHours(3),
                'data' => [
                    'actor_id' => $maria->id,
                    'actor_name' => $maria->name,
                    'review_id' => $mainReview->id,
                    'reply_id' => 1,
                    'movie_id' => $featuredMovie->id,
                    'movie_tmdb_id' => $featuredMovie->tmdb_id,
                    'movie_title' => $featuredMovie->title,
                ],
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::query()->create([
                'user_id' => $mainUser->id,
                'type' => $notification['type'],
                'data' => $notification['data'],
                'read_at' => $notification['read_at'],
            ]);
        }

        $this->command?->info(sprintf(
            'Notificaciones creadas para %s: %d tipos.',
            $mainUser->email,
            count($notifications),
        ));
    }
}
