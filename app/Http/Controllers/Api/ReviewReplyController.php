<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewReply;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewReplyController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function index(int $reviewId): JsonResponse
    {
        $review = Review::query()->find($reviewId);

        if (!$review) {
            return response()->json([
                'message' => 'Reseña no encontrada.',
            ], 404);
        }

        $replies = ReviewReply::query()
            ->where('review_id', $review->id)
            ->with('user:id,name,avatar')
            ->orderBy('created_at')
            ->get()
            ->map(fn (ReviewReply $reply) => $this->formatReply($reply));

        return response()->json([
            'replies' => $replies,
        ]);
    }

    public function store(Request $request, int $reviewId): JsonResponse
    {
        $review = Review::query()
            ->with('movie')
            ->find($reviewId);

        if (!$review) {
            return response()->json([
                'message' => 'Reseña no encontrada.',
            ], 404);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:280',
        ]);

        $user = $request->user();

        $reply = ReviewReply::create([
            'review_id' => $review->id,
            'user_id' => $user->id,
            'body' => trim($validated['body']),
        ]);

        $reply->load('user:id,name,avatar');

        if ($review->user_id !== $user->id) {
            $this->notifications->send(
                $review->user_id,
                NotificationService::TYPE_REVIEW_REPLIED,
                [
                    ...$this->notifications->actorPayload($user),
                    'review_id' => $review->id,
                    'reply_id' => $reply->id,
                    'movie_id' => $review->movie_id,
                    'movie_tmdb_id' => $review->movie?->tmdb_id,
                    'movie_title' => $review->movie?->title,
                ],
            );
        }

        return response()->json($this->formatReply($reply), 201);
    }

    public function destroy(Request $request, int $reviewId, int $replyId): JsonResponse
    {
        $reply = ReviewReply::query()
            ->where('review_id', $reviewId)
            ->whereKey($replyId)
            ->first();

        if (!$reply) {
            return response()->json([
                'message' => 'Respuesta no encontrada.',
            ], 404);
        }

        if ($reply->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta respuesta.',
            ], 403);
        }

        $reply->delete();

        return response()->json([
            'message' => 'Respuesta eliminada correctamente.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReply(ReviewReply $reply): array
    {
        return [
            'id' => $reply->id,
            'user_id' => $reply->user_id,
            'user' => [
                'name' => $reply->user?->name,
                'avatar' => $reply->user?->avatar,
            ],
            'body' => $reply->body,
            'created_at' => $reply->created_at,
        ];
    }
}
