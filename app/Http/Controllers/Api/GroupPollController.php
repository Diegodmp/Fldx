<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupPoll;
use App\Models\GroupPollMovie;
use App\Models\GroupPollVote;
use App\Models\Movie;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupPollController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $polls = GroupPoll::query()
            ->where('group_id', $group->id)
            ->with('createdBy')
            ->withCount('movies as candidates_count')
            ->latest()
            ->get();

        $votesByPoll = $this->totalVotesByPoll($polls->pluck('id')->all());

        return response()->json(
            $polls
                ->map(fn (GroupPoll $poll) => $this->formatPollSummary(
                    $poll,
                    $votesByPoll[$poll->id] ?? 0,
                ))
                ->values()
                ->all(),
        );
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = GroupPoll::create([
            'group_id' => $group->id,
            'created_by' => $request->user()->id,
            'title' => $validated['title'],
            'status' => GroupPoll::STATUS_OPEN,
        ]);

        $poll->load('createdBy');

        $this->notifications->sendToGroupMembersExcept(
            $group,
            $request->user()->id,
            NotificationService::TYPE_GROUP_POLL_CREATED,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($request->user()),
                'poll_id' => $poll->id,
                'poll_title' => $poll->title,
            ],
        );

        return response()->json($this->formatPollSummary($poll, 0), 201);
    }

    public function show(Request $request, int $id, int $pollId): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        $poll->load(['createdBy', 'movies.movie', 'movies.addedBy']);

        return response()->json($this->formatPollDetail($poll, $request->user()->id));
    }

    public function update(Request $request, int $id, int $pollId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:closed',
        ]);

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        if (!$this->isPollCreatorOrAdmin($poll, $group, $request->user())) {
            return response()->json([
                'message' => 'No tienes permiso para cerrar esta votación.',
            ], 403);
        }

        if ($poll->status === GroupPoll::STATUS_CLOSED) {
            return response()->json([
                'message' => 'La votación ya está cerrada.',
            ], 422);
        }

        $poll->update([
            'status' => $validated['status'],
        ]);

        $poll->load(['createdBy', 'movies.movie', 'movies.addedBy']);

        $this->notifications->sendToGroupMembersExcept(
            $group,
            $request->user()->id,
            NotificationService::TYPE_GROUP_POLL_CLOSED,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($request->user()),
                'poll_id' => $poll->id,
                'poll_title' => $poll->title,
            ],
        );

        return response()->json($this->formatPollDetail($poll, $request->user()->id));
    }

    public function destroy(Request $request, int $id, int $pollId): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        if (!$this->isPollCreatorOrAdmin($poll, $group, $request->user())) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta votación.',
            ], 403);
        }

        if ($poll->status !== GroupPoll::STATUS_OPEN) {
            return response()->json([
                'message' => 'Solo se pueden eliminar votaciones abiertas.',
            ], 422);
        }

        $poll->delete();

        return response()->json([
            'message' => 'Votación eliminada correctamente.',
        ]);
    }

    public function storeMovie(Request $request, int $id, int $pollId): JsonResponse
    {
        $validated = $request->validate([
            'movie_id' => 'required|integer|exists:movies,id',
        ]);

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        return $this->addMovieToPoll(
            $request,
            $group,
            $poll,
            (int) $validated['movie_id'],
        );
    }

    public function storeMovieByPoll(Request $request, int $pollId): JsonResponse
    {
        $validated = $request->validate([
            'tmdb_id' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'poster_path' => 'nullable|string|max:255',
        ]);

        $poll = GroupPoll::query()->whereKey($pollId)->first();

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        $group = $this->findMemberGroup($request, $poll->group_id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $movie = $this->resolveMovieFromTmdbPayload($validated);

        return $this->addMovieToPoll($request, $group, $poll, $movie->id);
    }

    public function destroyMovie(Request $request, int $id, int $pollId, int $movieId): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        if ($poll->status !== GroupPoll::STATUS_OPEN) {
            return response()->json([
                'message' => 'La votación está cerrada.',
            ], 422);
        }

        $pollMovie = $this->findPollMovie($poll, $movieId);

        if (!$pollMovie) {
            return response()->json([
                'message' => 'Candidata no encontrada.',
            ], 404);
        }

        $user = $request->user();
        $canDelete = $pollMovie->added_by === $user->id
            || $this->isGroupAdmin($group, $user);

        if (!$canDelete) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta candidata.',
            ], 403);
        }

        $pollMovie->delete();

        return response()->json([
            'message' => 'Candidata eliminada correctamente.',
        ]);
    }

    public function vote(Request $request, int $id, int $pollId, int $movieId): JsonResponse
    {
        $validated = $request->validate([
            'vote' => 'required|string|in:up,down',
        ]);

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $poll = $this->findPoll($group, $pollId);

        if (!$poll) {
            return response()->json([
                'message' => 'Votación no encontrada.',
            ], 404);
        }

        if ($poll->status !== GroupPoll::STATUS_OPEN) {
            return response()->json([
                'message' => 'La votación está cerrada.',
            ], 422);
        }

        $pollMovie = $this->findPollMovie($poll, $movieId);

        if (!$pollMovie) {
            return response()->json([
                'message' => 'Candidata no encontrada.',
            ], 404);
        }

        $userId = $request->user()->id;
        $voteValue = $validated['vote'];

        DB::transaction(function () use ($pollMovie, $userId, $voteValue) {
            $existingVote = GroupPollVote::query()
                ->where('poll_movie_id', $pollMovie->id)
                ->where('user_id', $userId)
                ->first();

            if (!$existingVote) {
                GroupPollVote::create([
                    'poll_movie_id' => $pollMovie->id,
                    'user_id' => $userId,
                    'vote' => $voteValue,
                ]);
            } elseif ($existingVote->vote === $voteValue) {
                $existingVote->delete();
            } else {
                $existingVote->update([
                    'vote' => $voteValue,
                ]);
            }
        });

        $pollMovie->refresh()->load(['movie', 'addedBy']);

        $voteCounts = $this->voteCountsByPollMovie([$pollMovie->id]);
        $userVote = GroupPollVote::query()
            ->where('poll_movie_id', $pollMovie->id)
            ->where('user_id', $userId)
            ->value('vote');

        if ($userVote !== null) {
            $this->notifications->sendPollVoteNotification(
                $poll->created_by,
                $userId,
                [
                    ...$this->notifications->groupPayload($group),
                    ...$this->notifications->actorPayload($request->user()),
                    'poll_id' => $poll->id,
                    'poll_title' => $poll->title,
                ],
            );
        }

        return response()->json(
            $this->formatPollMovie(
                $pollMovie,
                $voteCounts[$pollMovie->id] ?? ['votes_up' => 0, 'votes_down' => 0],
                $userVote,
            ),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function formatPollSummary(GroupPoll $poll, int $votesCount): array
    {
        return [
            'id' => $poll->id,
            'group_id' => $poll->group_id,
            'created_by' => $poll->created_by,
            'title' => $poll->title,
            'status' => $poll->status,
            'candidates_count' => (int) ($poll->candidates_count ?? $poll->movies()->count()),
            'votes_count' => $votesCount,
            'created_at' => $poll->created_at,
            'updated_at' => $poll->updated_at,
            'creator' => $poll->createdBy,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatPollDetail(GroupPoll $poll, int $userId): array
    {
        $pollMovieIds = $poll->movies->pluck('id')->all();
        $voteCounts = $this->voteCountsByPollMovie($pollMovieIds);
        $userVotes = $this->userVotesByPollMovie($userId, $pollMovieIds);
        $votesCount = array_sum(array_map(
            fn (array $counts) => $counts['votes_up'] + $counts['votes_down'],
            $voteCounts,
        ));

        return [
            ...$this->formatPollSummary($poll, $votesCount),
            'movies' => $poll->movies
                ->map(fn (GroupPollMovie $pollMovie) => $this->formatPollMovie(
                    $pollMovie,
                    $voteCounts[$pollMovie->id] ?? ['votes_up' => 0, 'votes_down' => 0],
                    $userVotes[$pollMovie->id] ?? null,
                ))
                ->values()
                ->all(),
        ];
    }

    /**
     * @param array{votes_up: int, votes_down: int} $voteCounts
     * @return array<string, mixed>
     */
    private function formatPollMovie(
        GroupPollMovie $pollMovie,
        array $voteCounts,
        ?string $userVote,
    ): array {
        return [
            'id' => $pollMovie->id,
            'poll_id' => $pollMovie->poll_id,
            'movie_id' => $pollMovie->movie_id,
            'added_by' => $pollMovie->added_by,
            'votes_up' => $voteCounts['votes_up'],
            'votes_down' => $voteCounts['votes_down'],
            'user_vote' => $userVote,
            'created_at' => $pollMovie->created_at,
            'updated_at' => $pollMovie->updated_at,
            'movie' => $pollMovie->movie,
            'adder' => $pollMovie->addedBy,
        ];
    }

    /**
     * @param array<int, int> $pollIds
     * @return array<int, int>
     */
    private function totalVotesByPoll(array $pollIds): array
    {
        if ($pollIds === []) {
            return [];
        }

        return GroupPollVote::query()
            ->join('group_poll_movies', 'group_poll_votes.poll_movie_id', '=', 'group_poll_movies.id')
            ->whereIn('group_poll_movies.poll_id', $pollIds)
            ->groupBy('group_poll_movies.poll_id')
            ->selectRaw('group_poll_movies.poll_id, COUNT(*) as votes_count')
            ->pluck('votes_count', 'poll_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * @param array<int, int> $pollMovieIds
     * @return array<int, array{votes_up: int, votes_down: int}>
     */
    private function voteCountsByPollMovie(array $pollMovieIds): array
    {
        $result = [];

        foreach ($pollMovieIds as $pollMovieId) {
            $result[$pollMovieId] = [
                'votes_up' => 0,
                'votes_down' => 0,
            ];
        }

        if ($pollMovieIds === []) {
            return $result;
        }

        $rows = GroupPollVote::query()
            ->whereIn('poll_movie_id', $pollMovieIds)
            ->selectRaw('poll_movie_id, vote, COUNT(*) as total')
            ->groupBy('poll_movie_id', 'vote')
            ->get();

        foreach ($rows as $row) {
            $key = $row->vote === GroupPollVote::VOTE_UP ? 'votes_up' : 'votes_down';
            $result[$row->poll_movie_id][$key] = (int) $row->total;
        }

        return $result;
    }

    /**
     * @param array<int, int> $pollMovieIds
     * @return array<int, string>
     */
    private function userVotesByPollMovie(int $userId, array $pollMovieIds): array
    {
        if ($pollMovieIds === []) {
            return [];
        }

        return GroupPollVote::query()
            ->where('user_id', $userId)
            ->whereIn('poll_movie_id', $pollMovieIds)
            ->pluck('vote', 'poll_movie_id')
            ->all();
    }

    /**
     * @param  array{tmdb_id: int, title: string, poster_path?: string|null}  $payload
     */
    private function resolveMovieFromTmdbPayload(array $payload): Movie
    {
        $movie = Movie::query()->where('tmdb_id', $payload['tmdb_id'])->first();

        if ($movie) {
            return $movie;
        }

        return Movie::create([
            'tmdb_id' => $payload['tmdb_id'],
            'title' => $payload['title'],
            'poster_path' => $payload['poster_path'] ?? null,
        ]);
    }

    private function addMovieToPoll(
        Request $request,
        Group $group,
        GroupPoll $poll,
        int $movieId,
    ): JsonResponse {
        if ($poll->status !== GroupPoll::STATUS_OPEN) {
            return response()->json([
                'message' => 'La votación está cerrada.',
            ], 422);
        }

        $userAlreadyAdded = GroupPollMovie::query()
            ->where('poll_id', $poll->id)
            ->where('added_by', $request->user()->id)
            ->exists();

        if ($userAlreadyAdded) {
            return response()->json([
                'message' => 'Ya has añadido una película candidata a esta votación.',
            ], 422);
        }

        $exists = GroupPollMovie::query()
            ->where('poll_id', $poll->id)
            ->where('movie_id', $movieId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Esta película ya es candidata en la votación.',
            ], 409);
        }

        $pollMovie = GroupPollMovie::create([
            'poll_id' => $poll->id,
            'movie_id' => $movieId,
            'added_by' => $request->user()->id,
        ]);

        $pollMovie->load(['movie', 'addedBy']);

        $recipientIds = GroupPollMovie::query()
            ->where('poll_id', $poll->id)
            ->where('added_by', '!=', $request->user()->id)
            ->distinct()
            ->pluck('added_by')
            ->all();

        $this->notifications->sendToMany(
            $recipientIds,
            NotificationService::TYPE_GROUP_POLL_MOVIE_ADDED,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($request->user()),
                'poll_id' => $poll->id,
                'poll_title' => $poll->title,
                'movie_id' => $pollMovie->movie_id,
                'movie_title' => $pollMovie->movie->title,
            ],
        );

        return response()->json(
            $this->formatPollMovie($pollMovie, ['votes_up' => 0, 'votes_down' => 0], null),
            201,
        );
    }

    private function findMemberGroup(Request $request, int $groupId): ?Group
    {
        return $request->user()
            ->groups()
            ->where('groups.id', $groupId)
            ->first();
    }

    private function findPoll(Group $group, int $pollId): ?GroupPoll
    {
        return GroupPoll::query()
            ->where('group_id', $group->id)
            ->whereKey($pollId)
            ->first();
    }

    private function findPollMovie(GroupPoll $poll, int $movieId): ?GroupPollMovie
    {
        return GroupPollMovie::query()
            ->where('poll_id', $poll->id)
            ->where('movie_id', $movieId)
            ->first();
    }

    private function isPollCreatorOrAdmin(GroupPoll $poll, Group $group, User $user): bool
    {
        if ($poll->created_by === $user->id) {
            return true;
        }

        return $this->isGroupAdmin($group, $user);
    }

    private function isGroupAdmin(Group $group, User $user): bool
    {
        if ($group->owner_id === $user->id) {
            return true;
        }

        $member = $group->users()
            ->where('users.id', $user->id)
            ->first();

        return $member !== null && $member->pivot->role === 'admin';
    }
}
