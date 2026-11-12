<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\GroupPoll;
use App\Models\GroupPollMovie;
use App\Models\GroupPollVote;
use App\Models\Movie;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupController extends Controller
{
    private const MAX_MEMBERS = 50;

    public function __construct(
        private readonly NotificationService $notifications,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $groups = $request->user()
            ->groups()
            ->with(['users', 'owner'])
            ->orderByDesc('groups.created_at')
            ->get();

        return response()->json($groups);
    }

    public function proposable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tmdb_id' => 'required|integer|min:1',
        ]);

        $tmdbId = (int) $validated['tmdb_id'];
        $user = $request->user();
        $localMovie = Movie::query()->where('tmdb_id', $tmdbId)->first();
        $localMovieId = $localMovie?->id;

        $groups = $user->groups()->get(['groups.id', 'groups.name']);
        $results = [];

        foreach ($groups as $group) {
            $openPolls = GroupPoll::query()
                ->where('group_id', $group->id)
                ->where('status', GroupPoll::STATUS_OPEN)
                ->withCount('movies as candidates_count')
                ->get();

            foreach ($openPolls as $poll) {
                if ($localMovieId !== null) {
                    $alreadyCandidate = GroupPollMovie::query()
                        ->where('poll_id', $poll->id)
                        ->where('movie_id', $localMovieId)
                        ->exists();

                    if ($alreadyCandidate) {
                        continue;
                    }
                }

                $userAlreadyAdded = GroupPollMovie::query()
                    ->where('poll_id', $poll->id)
                    ->where('added_by', $user->id)
                    ->exists();

                if ($userAlreadyAdded) {
                    continue;
                }

                $userHasVoted = GroupPollVote::query()
                    ->where('user_id', $user->id)
                    ->whereHas('pollMovie', function ($query) use ($poll) {
                        $query->where('poll_id', $poll->id);
                    })
                    ->exists();

                if ($userHasVoted) {
                    continue;
                }

                $results[] = [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'poll_id' => $poll->id,
                    'candidate_count' => (int) $poll->candidates_count,
                ];
            }
        }

        return response()->json($results);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = $request->user();

        $group = DB::transaction(function () use ($validated, $user) {
            $group = Group::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'owner_id' => $user->id,
            ]);

            $group->users()->attach($user->id, ['role' => 'admin']);

            return $group;
        });

        $group->load(['users', 'owner']);

        return response()->json($group, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $group->load(['users', 'owner']);

        return response()->json($group);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => 'Debes enviar al menos name o description para actualizar.',
            ], 422);
        }

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $this->assertAdmin($request, $group);

        $group->update($validated);
        $group->load(['users', 'owner']);

        return response()->json($group);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $group = Group::query()->find($id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        if ($group->owner_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Solo el propietario puede eliminar el grupo.',
            ], 403);
        }

        $group->delete();

        return response()->json([
            'message' => 'Grupo eliminado correctamente.',
        ]);
    }

    public function updateMemberRole(Request $request, int $id, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:admin,member',
        ]);

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $this->assertAdmin($request, $group);

        if ($group->owner_id === $userId) {
            return response()->json([
                'message' => 'No se puede cambiar el rol del propietario del grupo.',
            ], 422);
        }

        $member = $group->users()->where('users.id', $userId)->first();

        if (!$member) {
            return response()->json([
                'message' => 'Miembro no encontrado en el grupo.',
            ], 404);
        }

        $group->users()->updateExistingPivot($userId, [
            'role' => $validated['role'],
        ]);

        $group->load(['users', 'owner']);

        return response()->json($group);
    }

    public function removeMember(Request $request, int $id, int $userId): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $this->assertAdmin($request, $group);

        if ($group->owner_id === $userId) {
            return response()->json([
                'message' => 'El propietario del grupo no puede ser expulsado.',
            ], 422);
        }

        $member = $group->users()->where('users.id', $userId)->first();

        if (!$member) {
            return response()->json([
                'message' => 'Miembro no encontrado en el grupo.',
            ], 404);
        }

        $group->users()->detach($userId);
        $group->load(['users', 'owner']);

        return response()->json($group);
    }

    public function leave(Request $request, int $id): JsonResponse
    {
        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        if ($group->owner_id === $request->user()->id) {
            return response()->json([
                'message' => 'El propietario no puede abandonar el grupo.',
            ], 422);
        }

        $group->users()->detach($request->user()->id);

        return response()->json([
            'message' => 'Has abandonado el grupo.',
        ]);
    }

    public function invite(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|integer|exists:users,id|required_without:email',
            'email' => 'nullable|email|max:255|required_without:user_id',
        ]);

        if (!empty($validated['user_id']) && !empty($validated['email'])) {
            return response()->json([
                'message' => 'Debes enviar user_id o email, no ambos.',
            ], 422);
        }

        $group = $this->findMemberGroup($request, $id);

        if (!$group) {
            return response()->json([
                'message' => 'Grupo no encontrado.',
            ], 404);
        }

        $this->assertAdmin($request, $group);

        if ($this->memberCount($group) >= self::MAX_MEMBERS) {
            return response()->json([
                'message' => 'El grupo ha alcanzado el máximo de ' . self::MAX_MEMBERS . ' miembros.',
            ], 422);
        }

        $userId = $validated['user_id'] ?? null;
        $email = isset($validated['email']) ? strtolower($validated['email']) : null;

        if ($userId !== null) {
            if ($group->users()->where('users.id', $userId)->exists()) {
                return response()->json([
                    'message' => 'Este usuario ya es miembro del grupo.',
                ], 409);
            }
        }

        if ($email !== null) {
            $existingUser = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

            if ($existingUser && $group->users()->where('users.id', $existingUser->id)->exists()) {
                return response()->json([
                    'message' => 'Este usuario ya es miembro del grupo.',
                ], 409);
            }
        }

        if ($this->hasPendingInvitation($group, $userId, $email)) {
            return response()->json([
                'message' => 'Ya existe una invitación pendiente para este usuario.',
            ], 409);
        }

        $invitation = GroupInvitation::create([
            'group_id' => $group->id,
            'invited_by' => $request->user()->id,
            'user_id' => $userId,
            'email' => $email,
            'status' => GroupInvitation::STATUS_PENDING,
        ]);

        $invitation->load(['group', 'user', 'invitedBy']);

        $this->notifyGroupInvitation($group, $request->user(), $userId, $email);

        return response()->json($invitation, 201);
    }

    public function invitations(Request $request): JsonResponse
    {
        $user = $request->user();
        $email = strtolower($user->email);

        $invitations = GroupInvitation::query()
            ->where('status', GroupInvitation::STATUS_PENDING)
            ->where(function ($query) use ($user, $email) {
                $query->where('user_id', $user->id)
                    ->orWhereRaw('LOWER(email) = ?', [$email]);
            })
            ->with(['group.owner', 'invitedBy'])
            ->latest()
            ->get();

        return response()->json($invitations);
    }

    public function acceptInvitation(Request $request, int $id): JsonResponse
    {
        $invitation = $this->findPendingInvitationForUser($request, $id);

        if (!$invitation) {
            return response()->json([
                'message' => 'Invitación no encontrada.',
            ], 404);
        }

        $group = $invitation->group;

        if ($this->memberCount($group) >= self::MAX_MEMBERS) {
            return response()->json([
                'message' => 'El grupo ha alcanzado el máximo de ' . self::MAX_MEMBERS . ' miembros.',
            ], 422);
        }

        if ($group->users()->where('users.id', $request->user()->id)->exists()) {
            $invitation->update(['status' => GroupInvitation::STATUS_ACCEPTED]);

            return response()->json([
                'message' => 'Ya eres miembro de este grupo.',
            ], 409);
        }

        DB::transaction(function () use ($invitation, $request) {
            $invitation->update([
                'status' => GroupInvitation::STATUS_ACCEPTED,
                'user_id' => $request->user()->id,
            ]);

            $invitation->group->users()->attach($request->user()->id, [
                'role' => 'member',
            ]);
        });

        $invitation->load(['group.users', 'group.owner', 'invitedBy']);

        $this->notifications->send(
            $invitation->invited_by,
            NotificationService::TYPE_GROUP_INVITATION_ACCEPTED,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($request->user()),
            ],
        );

        return response()->json($invitation);
    }

    public function rejectInvitation(Request $request, int $id): JsonResponse
    {
        $invitation = $this->findPendingInvitationForUser($request, $id);

        if (!$invitation) {
            return response()->json([
                'message' => 'Invitación no encontrada.',
            ], 404);
        }

        $invitation->update([
            'status' => GroupInvitation::STATUS_REJECTED,
            'user_id' => $invitation->user_id ?? $request->user()->id,
        ]);

        $invitation->load(['group.owner', 'invitedBy']);

        $this->notifications->send(
            $invitation->invited_by,
            NotificationService::TYPE_GROUP_INVITATION_REJECTED,
            [
                ...$this->notifications->groupPayload($invitation->group),
                ...$this->notifications->actorPayload($request->user()),
            ],
        );

        return response()->json($invitation);
    }

    private function findMemberGroup(Request $request, int $groupId): ?Group
    {
        return $request->user()
            ->groups()
            ->where('groups.id', $groupId)
            ->first();
    }

    private function assertAdmin(Request $request, Group $group): void
    {
        if ($group->owner_id === $request->user()->id) {
            return;
        }

        $member = $group->users()
            ->where('users.id', $request->user()->id)
            ->first();

        if (!$member || $member->pivot->role !== 'admin') {
            throw new HttpResponseException(response()->json([
                'message' => 'No tienes permisos de administrador en este grupo.',
            ], 403));
        }
    }

    private function memberCount(Group $group): int
    {
        return $group->users()->count();
    }

    private function hasPendingInvitation(Group $group, ?int $userId, ?string $email): bool
    {
        return GroupInvitation::query()
            ->where('group_id', $group->id)
            ->where('status', GroupInvitation::STATUS_PENDING)
            ->where(function ($query) use ($userId, $email) {
                if ($userId !== null) {
                    $query->where('user_id', $userId);
                }

                if ($email !== null) {
                    $query->orWhereRaw('LOWER(email) = ?', [$email]);
                }
            })
            ->exists();
    }

    private function findPendingInvitationForUser(Request $request, int $invitationId): ?GroupInvitation
    {
        $user = $request->user();
        $email = strtolower($user->email);

        return GroupInvitation::query()
            ->whereKey($invitationId)
            ->where('status', GroupInvitation::STATUS_PENDING)
            ->where(function ($query) use ($user, $email) {
                $query->where('user_id', $user->id)
                    ->orWhereRaw('LOWER(email) = ?', [$email]);
            })
            ->with('group')
            ->first();
    }

    private function notifyGroupInvitation(
        Group $group,
        User $actor,
        ?int $userId,
        ?string $email,
    ): void {
        $notifyUserId = $userId;

        if ($notifyUserId === null && $email !== null) {
            $existingUser = User::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $notifyUserId = $existingUser?->id;
        }

        if ($notifyUserId === null) {
            return;
        }

        $this->notifications->send(
            $notifyUserId,
            NotificationService::TYPE_GROUP_INVITATION,
            [
                ...$this->notifications->groupPayload($group),
                ...$this->notifications->actorPayload($actor),
            ],
        );
    }
}
