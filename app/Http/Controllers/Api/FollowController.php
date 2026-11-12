<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function followers(Request $request): JsonResponse
    {
        $users = $request->user()
            ->followers()
            ->select('users.id', 'users.name', 'users.email', 'users.avatar')
            ->get();

        return response()->json(['users' => $users]);
    }

    public function following(Request $request): JsonResponse
    {
        $users = $request->user()
            ->following()
            ->select('users.id', 'users.name', 'users.email', 'users.avatar')
            ->get();

        return response()->json(['users' => $users]);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $target = User::query()->find($id);

        if (!$target) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $user = $request->user();

        if ($user->id === $target->id) {
            return response()->json([
                'is_following' => false,
                'is_followed_by' => false,
                'is_friend' => false,
            ]);
        }

        $isFollowing = $user->following()->where('users.id', $target->id)->exists();
        $isFollowedBy = $user->followers()->where('users.id', $target->id)->exists();

        return response()->json([
            'is_following' => $isFollowing,
            'is_followed_by' => $isFollowedBy,
            'is_friend' => $isFollowing && $isFollowedBy,
        ]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $target = User::query()->find($id);

        if (!$target) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $user = $request->user();

        if ($user->id === $target->id) {
            return response()->json(['message' => 'No puedes seguirte a ti mismo.'], 422);
        }

        Follow::query()->firstOrCreate([
            'follower_id' => $user->id,
            'following_id' => $target->id,
        ]);

        $isFollowedBy = $user->followers()->where('users.id', $target->id)->exists();

        return response()->json([
            'is_following' => true,
            'is_followed_by' => $isFollowedBy,
            'is_friend' => $isFollowedBy,
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $target = User::query()->find($id);

        if (!$target) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        Follow::query()
            ->where('follower_id', $request->user()->id)
            ->where('following_id', $target->id)
            ->delete();

        $isFollowedBy = $request->user()->followers()->where('users.id', $target->id)->exists();

        return response()->json([
            'is_following' => false,
            'is_followed_by' => $isFollowedBy,
            'is_friend' => false,
        ]);
    }
}
