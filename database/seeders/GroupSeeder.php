<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\GroupMovie;
use App\Models\GroupMovieVote;
use App\Models\GroupPoll;
use App\Models\GroupPollMovie;
use App\Models\GroupPollVote;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class GroupSeeder extends Seeder
{
    public function run(): void
    {
        $mainUser = User::query()->where('email', DemoData::MAIN_EMAIL)->firstOrFail();
        $secondaryUser = User::query()->where('email', DemoData::SECONDARY_EMAIL)->firstOrFail();
        $friends = User::query()
            ->whereIn('email', array_column(DemoData::FRIENDS, 'email'))
            ->get()
            ->keyBy('email');

        $maria = $friends->get('amigo1@example.com');
        $carlos = $friends->get('amigo2@example.com');
        $laura = $friends->get('amigo3@example.com');
        $movies = Movie::query()->orderBy('id')->get();

        $created = 0;

        $created += $this->seedGroup(
            name: 'Cineclub Filmdex',
            description: 'Grupo principal con propuestas, votos y encuesta abierta.',
            owner: $mainUser,
            memberIds: collect([$mainUser->id, $secondaryUser->id, $maria?->id, $carlos?->id, $laura?->id])->filter()->values(),
            movies: $movies,
            movieSlice: [0, 3],
            openPoll: [
                'title' => '¿Qué vemos este finde?',
                'creator' => $secondaryUser,
                'movieSlice' => [3, 3],
                'skipVotesForUserId' => $mainUser->id,
            ],
        );

        $created += $this->seedGroup(
            name: 'Maratón Sci-Fi',
            description: 'Clásicos y estrenos de ciencia ficción.',
            owner: $secondaryUser,
            memberIds: collect([$secondaryUser->id, $mainUser->id, $carlos?->id, $laura?->id])->filter()->values(),
            movies: $movies,
            movieSlice: [2, 2],
            closedPoll: [
                'title' => 'Mejor película del mes',
                'creator' => $secondaryUser,
                'movieSlice' => [6, 2],
            ],
        );

        $created += $this->seedGroup(
            name: 'Cine de autor',
            description: 'Películas con mirada personal.',
            owner: $mainUser,
            memberIds: collect([$mainUser->id, $maria?->id, $laura?->id])->filter()->values(),
            movies: $movies,
            movieSlice: [4, 2],
        );

        if ($maria) {
            $created += $this->seedGroup(
                name: 'Viernes de terror',
                description: 'Suspenso y thrillers para el fin de semana.',
                owner: $maria,
                memberIds: collect([$maria->id, $mainUser->id, $carlos?->id])->filter()->values(),
                movies: $movies,
                movieSlice: [5, 2],
            );
        }

        $this->command?->info(sprintf('Grupos creados: %d.', $created));
    }

    /**
     * @param  array{title: string, creator: User, movieSlice: array{0: int, 1: int}, skipVotesForUserId?: int}  $openPoll
     * @param  array{title: string, creator: User, movieSlice: array{0: int, 1: int}}  $closedPoll
     */
    private function seedGroup(
        string $name,
        string $description,
        User $owner,
        Collection $memberIds,
        Collection $movies,
        array $movieSlice,
        ?array $openPoll = null,
        ?array $closedPoll = null,
    ): int {
        $group = Group::query()->updateOrCreate(
            ['name' => $name, 'owner_id' => $owner->id],
            ['description' => $description],
        );

        foreach ($memberIds as $memberId) {
            $group->users()->syncWithoutDetaching([
                $memberId => ['role' => (int) $memberId === $owner->id ? 'admin' : 'member'],
            ]);
        }

        foreach ($movies->slice($movieSlice[0], $movieSlice[1])->values() as $index => $movie) {
            $proposerId = $memberIds->get($index % max(1, $memberIds->count()), $owner->id);

            $groupMovie = GroupMovie::query()->updateOrCreate(
                [
                    'group_id' => $group->id,
                    'movie_id' => $movie->id,
                ],
                ['proposed_by' => $proposerId],
            );

            foreach ($memberIds->values() as $voterIndex => $voterId) {
                GroupMovieVote::query()->updateOrCreate(
                    [
                        'group_movie_id' => $groupMovie->id,
                        'user_id' => $voterId,
                    ],
                    [
                        'vote' => $voterIndex % 4 === 3
                            ? GroupMovieVote::VOTE_DOWN
                            : GroupMovieVote::VOTE_UP,
                    ],
                );
            }
        }

        if ($openPoll) {
            $this->seedPoll(
                group: $group,
                owner: $owner,
                memberIds: $memberIds,
                movies: $movies,
                config: $openPoll,
                status: GroupPoll::STATUS_OPEN,
            );
        }

        if ($closedPoll) {
            $this->seedPoll(
                group: $group,
                owner: $owner,
                memberIds: $memberIds,
                movies: $movies,
                config: $closedPoll,
                status: GroupPoll::STATUS_CLOSED,
            );
        }

        return 1;
    }

    /**
     * @param  array{title: string, creator: User, movieSlice: array{0: int, 1: int}, skipVotesForUserId?: int}  $config
     */
    private function seedPoll(
        Group $group,
        User $owner,
        Collection $memberIds,
        Collection $movies,
        array $config,
        string $status,
    ): void {
        $poll = GroupPoll::query()->updateOrCreate(
            [
                'group_id' => $group->id,
                'title' => $config['title'],
            ],
            [
                'created_by' => $config['creator']->id,
                'status' => $status,
            ],
        );

        foreach ($movies->slice($config['movieSlice'][0], $config['movieSlice'][1])->values() as $index => $movie) {
            $pollMovie = GroupPollMovie::query()->updateOrCreate(
                [
                    'poll_id' => $poll->id,
                    'movie_id' => $movie->id,
                ],
                ['added_by' => $index === 0 ? $owner->id : $config['creator']->id],
            );

            foreach ($memberIds as $voterId) {
                if (
                    $status === GroupPoll::STATUS_OPEN
                    && isset($config['skipVotesForUserId'])
                    && (int) $voterId === (int) $config['skipVotesForUserId']
                ) {
                    continue;
                }

                GroupPollVote::query()->updateOrCreate(
                    [
                        'poll_movie_id' => $pollMovie->id,
                        'user_id' => $voterId,
                    ],
                    ['vote' => GroupPollVote::VOTE_UP],
                );
            }
        }
    }
}
