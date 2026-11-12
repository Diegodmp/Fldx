<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Watchlist;
use App\Support\WatchHistoryStats;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class StatsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $watchedEntries = WatchHistoryStats::watchedEntriesForUser($user->id);

        return response()->json([
            'peliculas_vistas' => $watchedEntries->count(),
            'horas_totales' => $this->calculateTotalHours($watchedEntries),
            'resenas' => Review::query()->where('user_id', $user->id)->count(),
            'racha_actual' => $this->calculateCurrentStreak($watchedEntries),
            'seguidores' => $user->followers()->count(),
            'siguiendo' => $user->following()->count(),
            'amigos' => $user->friendsCount(),
            'generos' => WatchHistoryStats::topGenres($watchedEntries),
            'decadas' => WatchHistoryStats::decades($watchedEntries),
            'actividad_reciente' => $this->buildRecentActivity($user->id),
            'ultimas_peliculas' => $this->buildLatestWatchedMovies($watchedEntries, $user->id),
        ]);
    }

    private function calculateTotalHours(Collection $watchedEntries): int
    {
        $totalMinutes = $watchedEntries->sum(
            static fn (Watchlist $entry): int => (int) ($entry->movie?->duration ?? 0),
        );

        return (int) round($totalMinutes / 60);
    }

    private function calculateCurrentStreak(Collection $watchedEntries): int
    {
        if ($watchedEntries->isEmpty()) {
            return 0;
        }

        $activeWeeks = $watchedEntries
            ->map(static fn (Watchlist $entry): string => $entry->updated_at
                ->copy()
                ->startOfWeek(Carbon::MONDAY)
                ->toDateString())
            ->unique()
            ->flip();

        $checkWeek = Carbon::now()->startOfWeek(Carbon::MONDAY);

        if (!$activeWeeks->has($checkWeek->toDateString())) {
            $checkWeek->subWeek();
        }

        $streak = 0;

        while ($activeWeeks->has($checkWeek->toDateString())) {
            $streak++;
            $checkWeek->subWeek();
        }

        return $streak;
    }

    /**
     * @return array<int, array{type: string, movie_id: int, title: string, poster_path: string|null, date: string}>
     */
    private function buildRecentActivity(int $userId): array
    {
        $watchedActivity = Watchlist::query()
            ->where('user_id', $userId)
            ->where('status', 'watched')
            ->with('movie:id,tmdb_id,title,poster_path')
            ->get()
            ->map(static fn (Watchlist $entry): array => [
                'type' => 'watched',
                'movie_id' => $entry->movie_id,
                'tmdb_id' => $entry->movie?->tmdb_id,
                'title' => $entry->movie?->title ?? '',
                'poster_path' => $entry->movie?->poster_path,
                'date' => $entry->updated_at->toIso8601String(),
                '_sort' => $entry->updated_at,
            ]);

        $reviewActivity = Review::query()
            ->where('user_id', $userId)
            ->with('movie:id,tmdb_id,title,poster_path')
            ->get()
            ->map(static fn (Review $review): array => [
                'type' => 'review',
                'movie_id' => $review->movie_id,
                'tmdb_id' => $review->movie?->tmdb_id,
                'title' => $review->movie?->title ?? '',
                'poster_path' => $review->movie?->poster_path,
                'date' => $review->created_at->toIso8601String(),
                '_sort' => $review->created_at,
            ]);

        return $watchedActivity
            ->concat($reviewActivity)
            ->sortByDesc('_sort')
            ->take(10)
            ->map(static fn (array $item): array => [
                'type' => $item['type'],
                'movie_id' => $item['movie_id'],
                'tmdb_id' => $item['tmdb_id'] ?? null,
                'title' => $item['title'],
                'poster_path' => $item['poster_path'],
                'date' => $item['date'],
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{movie_id: int, title: string, poster_path: string|null, rating: int|null, date: string}>
     */
    private function buildLatestWatchedMovies(Collection $watchedEntries, int $userId): array
    {
        if ($watchedEntries->isEmpty()) {
            return [];
        }

        $reviewRatings = Review::query()
            ->where('user_id', $userId)
            ->whereIn('movie_id', $watchedEntries->pluck('movie_id')->unique())
            ->whereNotNull('rating')
            ->orderByDesc('created_at')
            ->get(['movie_id', 'rating'])
            ->unique('movie_id')
            ->pluck('rating', 'movie_id');

        return $watchedEntries
            ->sortByDesc(static fn (Watchlist $entry) => $entry->updated_at)
            ->take(6)
            ->map(static fn (Watchlist $entry): array => [
                'movie_id' => $entry->movie_id,
                'tmdb_id' => $entry->movie?->tmdb_id,
                'title' => $entry->movie?->title ?? '',
                'poster_path' => $entry->movie?->poster_path,
                'rating' => $entry->rating ?? $reviewRatings->get($entry->movie_id),
                'date' => $entry->updated_at->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
