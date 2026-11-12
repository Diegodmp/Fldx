<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\User;
use App\Models\Watchlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $friendIds = $user->friends()->all();

        if ($friendIds === []) {
            return response()->json(['activity' => []]);
        }

        $friends = User::query()
            ->whereIn('id', $friendIds)
            ->get(['id', 'name', 'email', 'avatar'])
            ->keyBy('id');

        $watchedActivity = Watchlist::query()
            ->whereIn('user_id', $friendIds)
            ->where('status', 'watched')
            ->with('movie:id,tmdb_id,title,poster_path')
            ->get()
            ->map(static fn (Watchlist $entry): array => [
                'id' => 'watchlist-' . $entry->id,
                'type' => 'watched',
                'user' => $friends->get($entry->user_id),
                'movie' => [
                    'tmdb_id' => $entry->movie?->tmdb_id,
                    'title' => $entry->movie?->title ?? '',
                    'poster_path' => $entry->movie?->poster_path,
                ],
                'rating' => $entry->rating,
                'comment' => null,
                'date' => $entry->updated_at->toIso8601String(),
                '_sort' => $entry->updated_at,
            ]);

        $reviewActivity = Review::query()
            ->whereIn('user_id', $friendIds)
            ->with('movie:id,tmdb_id,title,poster_path')
            ->get()
            ->map(static fn (Review $review): array => [
                'id' => 'review-' . $review->id,
                'type' => 'review',
                'user' => $friends->get($review->user_id),
                'movie' => [
                    'tmdb_id' => $review->movie?->tmdb_id,
                    'title' => $review->movie?->title ?? '',
                    'poster_path' => $review->movie?->poster_path,
                ],
                'rating' => $review->rating,
                'comment' => filled(trim((string) $review->body)) ? trim((string) $review->body) : null,
                'date' => ($review->watched_at ?? $review->created_at)->toIso8601String(),
                '_sort' => $review->created_at,
            ]);

        $activity = $watchedActivity
            ->concat($reviewActivity)
            ->filter(static fn (array $item): bool => $item['user'] !== null && !empty($item['movie']['tmdb_id']))
            ->sortByDesc('_sort')
            ->take(15)
            ->map(static fn (array $item): array => [
                'id' => $item['id'],
                'type' => $item['type'],
                'user' => [
                    'name' => $item['user']->name,
                    'email' => $item['user']->email,
                    'avatar' => $item['user']->avatar,
                ],
                'movie' => $item['movie'],
                'rating' => $item['rating'],
                'comment' => $item['comment'],
                'date' => $item['date'],
            ])
            ->values()
            ->all();

        return response()->json(['activity' => $activity]);
    }
}
