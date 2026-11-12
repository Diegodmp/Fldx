<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Review;
use App\Models\Watchlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request, int $movieId): JsonResponse
    {
        if (!$this->movieExists($movieId)) {
            return response()->json([
                'message' => 'Película no encontrada.',
            ], 404);
        }

        $perPage = min(max((int) $request->query('per_page', 5), 1), 50);
        $userId = $request->user()->id;

        $paginator = Review::query()
            ->where('movie_id', $movieId)
            ->with('user')
            ->withCount(['likes', 'replies'])
            ->withExists([
                'likes as liked_by_me' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->with([
                'replies' => fn ($query) => $query
                    ->with('user:id,name,avatar')
                    ->orderBy('created_at')
                    ->limit(2),
            ])
            ->latest()
            ->paginate($perPage);

        $data = collect($paginator->items())
            ->map(fn (Review $review) => $this->formatReview($review))
            ->values()
            ->all();

        return response()->json([
            'data' => $data,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    public function store(Request $request, int $movieId): JsonResponse
    {
        if (!$this->movieExists($movieId)) {
            return response()->json([
                'message' => 'Película no encontrada.',
            ], 404);
        }

        $validated = $request->validate([
            'body' => 'nullable|string|max:10000',
            'rating' => 'nullable|integer|min:1|max:5',
            'watched_at' => 'nullable|date',
        ]);

        $review = Review::create([
            'user_id' => $request->user()->id,
            'movie_id' => $movieId,
            'body' => $validated['body'] ?? '',
            'rating' => $validated['rating'] ?? null,
            'watched_at' => $validated['watched_at'] ?? now()->toDateString(),
        ]);

        $this->syncWatchlistAfterReview(
            $request->user()->id,
            $movieId,
            $validated['rating'] ?? null,
        );

        $review->load('user');

        return response()->json($review, 201);
    }

    public function update(Request $request, int $movieId, int $id): JsonResponse
    {
        $review = $this->findReview($movieId, $id);

        if (!$review) {
            return response()->json([
                'message' => 'Reseña no encontrada.',
            ], 404);
        }

        if ($review->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tienes permiso para editar esta reseña.',
            ], 403);
        }

        $validated = $request->validate([
            'body' => 'nullable|string|max:10000',
        ]);

        $review->update([
            'body' => $validated['body'] ?? '',
        ]);
        $review->load('user');

        return response()->json($review);
    }

    public function destroy(Request $request, int $movieId, int $id): JsonResponse
    {
        $review = $this->findReview($movieId, $id);

        if (!$review) {
            return response()->json([
                'message' => 'Reseña no encontrada.',
            ], 404);
        }

        if ($review->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta reseña.',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Reseña eliminada correctamente.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'user_id' => $review->user_id,
            'movie_id' => $review->movie_id,
            'body' => $review->body,
            'rating' => $review->rating,
            'watched_at' => $review->watched_at,
            'created_at' => $review->created_at,
            'updated_at' => $review->updated_at,
            'user' => $review->user,
            'likes_count' => (int) ($review->likes_count ?? 0),
            'replies_count' => (int) ($review->replies_count ?? 0),
            'liked_by_me' => (bool) ($review->liked_by_me ?? false),
            'replies' => $review->replies
                ->map(fn ($reply) => [
                    'id' => $reply->id,
                    'user_id' => $reply->user_id,
                    'user' => [
                        'name' => $reply->user?->name,
                        'avatar' => $reply->user?->avatar,
                    ],
                    'body' => $reply->body,
                    'created_at' => $reply->created_at,
                ])
                ->values()
                ->all(),
        ];
    }

    private function movieExists(int $movieId): bool
    {
        return Movie::query()->whereKey($movieId)->exists();
    }

    private function findReview(int $movieId, int $id): ?Review
    {
        return Review::query()
            ->where('movie_id', $movieId)
            ->whereKey($id)
            ->first();
    }

    private function syncWatchlistAfterReview(int $userId, int $movieId, ?int $rating = null): void
    {
        $watchlistEntry = Watchlist::query()
            ->where('user_id', $userId)
            ->where('movie_id', $movieId)
            ->first();

        if (!$watchlistEntry) {
            return;
        }

        $updates = ['status' => 'watched'];

        if ($rating !== null) {
            $updates['rating'] = $rating;
        }

        $watchlistEntry->update($updates);
    }
}
