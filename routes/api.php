<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\GroupMovieController;
use App\Http\Controllers\Api\GroupPollController;
use App\Http\Controllers\Api\MovieController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ReviewLikeController;
use App\Http\Controllers\Api\ReviewReplyController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\VoteController;
use App\Http\Controllers\Api\WatchlistController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',       [AuthController::class, 'me']);
    Route::post('/logout',  [AuthController::class, 'logout']);

    Route::get('/profile/stats', [StatsController::class, 'index']);
    Route::get('/stats/me', [StatsController::class, 'index']);

    Route::get('/activity', [ActivityController::class, 'index']);
    Route::get('/votes/active', [VoteController::class, 'active']);

    Route::get('/me/followers', [FollowController::class, 'followers']);
    Route::get('/me/following', [FollowController::class, 'following']);
    Route::get('/users/{id}/follow-status', [FollowController::class, 'status'])
        ->whereNumber('id');
    Route::post('/users/{id}/follow', [FollowController::class, 'store'])
        ->whereNumber('id');
    Route::delete('/users/{id}/follow', [FollowController::class, 'destroy'])
        ->whereNumber('id');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->whereNumber('id');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])
        ->whereNumber('id');

    Route::get('/movies/genres', [MovieController::class, 'genres']);
    Route::get('/movies/recommended', [MovieController::class, 'recommended']);
    Route::get('/movies/trending', [MovieController::class, 'trending']);
    Route::get('/movies/discover', [MovieController::class, 'discover']);
    Route::get('/movies/search', [MovieController::class, 'search']);
    Route::get('/movies/tmdb/{tmdb_id}/local-id', [MovieController::class, 'localId'])
        ->whereNumber('tmdb_id');
    Route::post('/movies/tmdb/{tmdb_id}/sync', [MovieController::class, 'sync'])
        ->whereNumber('tmdb_id');
    Route::post('/reviews/{review_id}/like', [ReviewLikeController::class, 'toggle'])
        ->whereNumber('review_id');
    Route::get('/reviews/{review_id}/replies', [ReviewReplyController::class, 'index'])
        ->whereNumber('review_id');
    Route::post('/reviews/{review_id}/replies', [ReviewReplyController::class, 'store'])
        ->whereNumber('review_id');
    Route::delete('/reviews/{review_id}/replies/{reply_id}', [ReviewReplyController::class, 'destroy'])
        ->whereNumber(['review_id', 'reply_id']);

    Route::get('/movies/{tmdb_id}/similar', [MovieController::class, 'similar'])
        ->whereNumber('tmdb_id');
    Route::get('/movies/{movie_id}/reviews', [ReviewController::class, 'index'])
        ->whereNumber('movie_id');
    Route::post('/movies/{movie_id}/reviews', [ReviewController::class, 'store'])
        ->whereNumber('movie_id');
    Route::patch('/movies/{movie_id}/reviews/{id}', [ReviewController::class, 'update'])
        ->whereNumber(['movie_id', 'id']);
    Route::delete('/movies/{movie_id}/reviews/{id}', [ReviewController::class, 'destroy'])
        ->whereNumber(['movie_id', 'id']);
    Route::get('/movies/{id}',   [MovieController::class, 'show'])
        ->whereNumber('id');

    Route::get('/watchlist', [WatchlistController::class, 'index']);
    Route::post('/watchlist', [WatchlistController::class, 'store']);
    Route::patch('/watchlist/{movie_id}', [WatchlistController::class, 'update'])
        ->whereNumber('movie_id');
    Route::delete('/watchlist/{movie_id}', [WatchlistController::class, 'destroy'])
        ->whereNumber('movie_id');

    Route::get('/invitations', [GroupController::class, 'invitations']);
    Route::patch('/invitations/{id}/accept', [GroupController::class, 'acceptInvitation'])
        ->whereNumber('id');
    Route::patch('/invitations/{id}/reject', [GroupController::class, 'rejectInvitation'])
        ->whereNumber('id');

    Route::get('/groups', [GroupController::class, 'index']);
    Route::get('/groups/proposable', [GroupController::class, 'proposable']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::post('/polls/{poll_id}/movies', [GroupPollController::class, 'storeMovieByPoll'])
        ->whereNumber('poll_id');
    Route::get('/groups/{id}', [GroupController::class, 'show'])
        ->whereNumber('id');
    Route::patch('/groups/{id}', [GroupController::class, 'update'])
        ->whereNumber('id');
    Route::delete('/groups/{id}', [GroupController::class, 'destroy'])
        ->whereNumber('id');
    Route::delete('/groups/{id}/leave', [GroupController::class, 'leave'])
        ->whereNumber('id');
    Route::post('/groups/{id}/invite', [GroupController::class, 'invite'])
        ->whereNumber('id');
    Route::get('/groups/{id}/movies', [GroupMovieController::class, 'index'])
        ->whereNumber('id');
    Route::post('/groups/{id}/movies', [GroupMovieController::class, 'store'])
        ->whereNumber('id');
    Route::post('/groups/{id}/movies/{movie_id}/vote', [GroupMovieController::class, 'vote'])
        ->whereNumber(['id', 'movie_id']);
    Route::delete('/groups/{id}/movies/{movie_id}', [GroupMovieController::class, 'destroy'])
        ->whereNumber(['id', 'movie_id']);
    Route::get('/groups/{id}/polls', [GroupPollController::class, 'index'])
        ->whereNumber('id');
    Route::post('/groups/{id}/polls', [GroupPollController::class, 'store'])
        ->whereNumber('id');
    Route::get('/groups/{id}/polls/{poll_id}', [GroupPollController::class, 'show'])
        ->whereNumber(['id', 'poll_id']);
    Route::patch('/groups/{id}/polls/{poll_id}', [GroupPollController::class, 'update'])
        ->whereNumber(['id', 'poll_id']);
    Route::delete('/groups/{id}/polls/{poll_id}', [GroupPollController::class, 'destroy'])
        ->whereNumber(['id', 'poll_id']);
    Route::post('/groups/{id}/polls/{poll_id}/movies', [GroupPollController::class, 'storeMovie'])
        ->whereNumber(['id', 'poll_id']);
    Route::delete('/groups/{id}/polls/{poll_id}/movies/{movie_id}', [GroupPollController::class, 'destroyMovie'])
        ->whereNumber(['id', 'poll_id', 'movie_id']);
    Route::post('/groups/{id}/polls/{poll_id}/movies/{movie_id}/vote', [GroupPollController::class, 'vote'])
        ->whereNumber(['id', 'poll_id', 'movie_id']);
    Route::patch('/groups/{id}/members/{user_id}', [GroupController::class, 'updateMemberRole'])
        ->whereNumber(['id', 'user_id']);
    Route::delete('/groups/{id}/members/{user_id}', [GroupController::class, 'removeMember'])
        ->whereNumber(['id', 'user_id']);
});
