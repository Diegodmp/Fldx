<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewLike;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewLikeController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function toggle(Request $request, int $reviewId): JsonResponse
    {
        $review = Review::query()
            ->with('movie')
            ->find($reviewId);

        if (!$review) {
            return response()->json([
                'message' => 'Reseña no encontrada.',
            ], 404);
        }

        $user = $request->user();
        $existingLike = ReviewLike::query()
            ->where('review_id', $review->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingLike) {
            $existingLike->delete();
            $liked = false;
        } else {
            ReviewLike::create([
                'review_id' => $review->id,
                'user_id' => $user->id,
            ]);
            $liked = true;

            $this->notifications->sendReviewLikedNotification(
                $review->user_id,
                $user->id,
                [
                    ...$this->notifications->actorPayload($user),
                    'review_id' => $review->id,
                    'movie_id' => $review->movie_id,
                    'movie_tmdb_id' => $review->movie?->tmdb_id,
                    'movie_title' => $review->movie?->title,
                ],
            );
        }

        $likesCount = ReviewLike::query()
            ->where('review_id', $review->id)
            ->count();

        return response()->json([
            'liked' => $liked,
            'likes_count' => $likesCount,
        ]);
    }
}
