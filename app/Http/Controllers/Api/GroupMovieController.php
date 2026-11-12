<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMovie;
use App\Models\GroupMovieVote;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupMovieController extends Controller
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

        $groupMovies = GroupMovie::query()
            ->where('group_id', $group->id)
            ->with(['movie', 'proposedBy'])
            ->latest()
            ->get();

        return response()->json(
            $groupMovies
                ->map(fn (GroupMovie $groupMovie) => $this->formatGroupMovie($groupMovie))
                ->values()
                ->all(),
        );
    }

    public function store(Request $request, int $id): JsonResponse
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

        $exists = GroupMovie::query()
            ->where('group_id', $group->id)
            ->where('movie_id', $validated['movie_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Esta película ya está propuesta en el grupo.',
            ], 409);
        }

        $groupMovie = GroupMovie::create([
            'group_id' => $group->id,
            'movie_id' => $validated['movie_id'],
            'proposed_by' => $request->user()->id,
        ]);

        $groupMovie->load(['movie', 'proposedBy']);

        $this->notifications->sendToGroupMembersExcept(
            $group,
            $request->user()->id,
            NotificationService::TYPE_GROUP_WATCHLIST_MOVIE_ADDED,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($request->user()),
                'movie_id' => $groupMovie->movie_id,
                'movie_title' => $groupMovie->movie->title,
            ],
        );

        return response()->json($this->formatGroupMovie($groupMovie), 201);
    }

    public function destroy(Request $request, int $id, int $movieId): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $groupMovie = $this->findGroupMovie($group, $movieId);

        if (!$groupMovie) {
            return response()->json([
                'message' => 'Propuesta no encontrada.',
            ], 404);
        }

        $user = $request->user();
        $canDelete = $groupMovie->proposed_by === $user->id
            || $this->isGroupAdmin($group, $user);

        if (!$canDelete) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta propuesta.',
            ], 403);
        }

        $groupMovie->delete();

        return response()->json([
            'message' => 'Propuesta eliminada correctamente.',
        ]);
    }

    public function vote(Request $request, int $id, int $movieId): JsonResponse
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

        $groupMovie = $this->findGroupMovie($group, $movieId);

        if (!$groupMovie) {
            return response()->json([
                'message' => 'Propuesta no encontrada.',
            ], 404);
        }

        $userId = $request->user()->id;
        $voteValue = $validated['vote'];

        DB::transaction(function () use ($groupMovie, $userId, $voteValue) {
            $existingVote = GroupMovieVote::query()
                ->where('group_movie_id', $groupMovie->id)
                ->where('user_id', $userId)
                ->first();

            if (!$existingVote) {
                GroupMovieVote::create([
                    'group_movie_id' => $groupMovie->id,
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

        $groupMovie->refresh()->load(['movie', 'proposedBy']);

        return response()->json($this->formatGroupMovie($groupMovie));
    }

    /**
     * @return array<string, mixed>
     */
    private function formatGroupMovie(GroupMovie $groupMovie): array
    {
        return [
            'id' => $groupMovie->id,
            'group_id' => $groupMovie->group_id,
            'movie_id' => $groupMovie->movie_id,
            'proposed_by' => $groupMovie->proposed_by,
            'created_at' => $groupMovie->created_at,
            'updated_at' => $groupMovie->updated_at,
            'movie' => $groupMovie->movie,
            'proposer' => $groupMovie->proposedBy,
        ];
    }

    private function findMemberGroup(Request $request, int $groupId): ?Group
    {
        return $request->user()
            ->groups()
            ->where('groups.id', $groupId)
            ->first();
    }

    private function findGroupMovie(Group $group, int $movieId): ?GroupMovie
    {
        return GroupMovie::query()
            ->where('group_id', $group->id)
            ->where('movie_id', $movieId)
            ->first();
    }

    private function isGroupAdmin(Group $group, $user): bool
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
