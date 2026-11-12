<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\User;
use App\Models\Watchlist;
use App\Services\TmdbService;
use App\Support\WatchHistoryStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MovieController extends Controller
{
    public function __construct(
        private readonly TmdbService $tmdbService,
    ) {
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
            'page' => 'sometimes|integer|min:1',
        ]);

        $page = $validated['page'] ?? 1;

        return response()->json(
            $this->tmdbService->searchMovies($validated['query'], $page)
        );
    }

    public function genres(): JsonResponse
    {
        return response()->json(
            $this->tmdbService->getGenres()
        );
    }

    public function trending(): JsonResponse
    {
        $payload = $this->tmdbService->getTrending('week');

        return response()->json([
            'movies' => $this->tmdbService->normalizeMovieList(
                $payload['results'] ?? [],
                12,
            ),
        ]);
    }

    public function recommended(Request $request): JsonResponse
    {
        $user = $request->user();

        $movies = Cache::remember(
            "recommendations.{$user->id}",
            7200,
            fn () => $this->buildRecommendations($user),
        );

        return response()->json([
            'movies' => $movies,
        ]);
    }

    public function discover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'nullable|string|min:2',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'integer|min:1',
            'year' => 'nullable|integer|min:1870|max:2100',
            'min_rating' => 'nullable|numeric|min:0|max:10',
            'sort_by' => 'nullable|string|in:' . implode(',', TmdbService::ALLOWED_SORT_VALUES),
            'page' => 'sometimes|integer|min:1',
        ]);

        $page = $validated['page'] ?? 1;
        $filters = $this->buildDiscoverFilters($validated);

        if (!empty($validated['query'])) {
            return response()->json(
                $this->tmdbService->searchMovies($validated['query'], $page, $filters)
            );
        }

        return response()->json(
            $this->tmdbService->discoverMovies($filters, $page)
        );
    }

    public function similar(int $tmdbId): JsonResponse
    {
        try {
            $movies = $this->tmdbService->getSimilarMovies($tmdbId);
        } catch (\Throwable) {
            $movies = [];
        }

        return response()->json([
            'movies' => $movies,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(
            $this->tmdbService->getMovie($id)
        );
    }

    public function localId(int $tmdbId): JsonResponse
    {
        $movie = Movie::query()->where('tmdb_id', $tmdbId)->first();

        return response()->json([
            'movie_id' => $movie?->id,
        ]);
    }

    public function sync(int $tmdbId): JsonResponse
    {
        return response()->json([
            'movie_id' => $this->resolveMovieFromTmdb($tmdbId)->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{
     *     genre_ids?: int[],
     *     year?: int,
     *     min_rating?: float,
     *     sort_by?: string,
     * }
     */
    private function buildDiscoverFilters(array $validated): array
    {
        $filters = [];

        if (!empty($validated['genre_ids'])) {
            $filters['genre_ids'] = array_map('intval', $validated['genre_ids']);
        }

        if (isset($validated['year'])) {
            $filters['year'] = (int) $validated['year'];
        }

        if (isset($validated['min_rating'])) {
            $filters['min_rating'] = (float) $validated['min_rating'];
        }

        if (!empty($validated['sort_by'])) {
            $filters['sort_by'] = $validated['sort_by'];
        }

        return $filters;
    }

    /**
     * @return array<int, array{tmdb_id: int, title: string, year: int|null, poster_path: string|null, rating: float|null, genre_ids: array<int>}>
     */
    private function buildRecommendations(User $user): array
    {
        $watchedEntries = WatchHistoryStats::watchedEntriesForUser($user->id);

        if ($watchedEntries->isEmpty()) {
            return $this->trendingMoviesList(20);
        }

        $topGenres = WatchHistoryStats::topGenreIds($watchedEntries, 3);
        $topDecades = WatchHistoryStats::topDecadeStarts($watchedEntries, 3);
        $primaryDecade = $topDecades[0] ?? null;

        if ($topGenres === []) {
            return $this->trendingMoviesList(20);
        }

        $watchlistTmdbIds = Watchlist::query()
            ->where('user_id', $user->id)
            ->whereHas('movie', static fn ($query) => $query->whereNotNull('tmdb_id'))
            ->with('movie:id,tmdb_id')
            ->get()
            ->pluck('movie.tmdb_id')
            ->filter()
            ->flip()
            ->all();

        $movies = [];
        $seenTmdbIds = [];

        foreach ($topGenres as $genreId) {
            $filters = [
                'genre_ids' => [$genreId],
                'sort_by' => 'popularity.desc',
            ];

            if ($primaryDecade !== null) {
                $filters['decade_start'] = $primaryDecade;
            }

            $payload = $this->tmdbService->discoverMovies($filters);

            foreach ($this->tmdbService->normalizeMovieList($payload['results'] ?? [], 12) as $movie) {
                $tmdbId = $movie['tmdb_id'];

                if (isset($seenTmdbIds[$tmdbId]) || isset($watchlistTmdbIds[$tmdbId])) {
                    continue;
                }

                $seenTmdbIds[$tmdbId] = true;
                $movies[] = $movie;

                if (count($movies) >= 20) {
                    break 2;
                }
            }
        }

        if ($movies === []) {
            return $this->trendingMoviesList(20);
        }

        return array_slice($movies, 0, 20);
    }

    /**
     * @return array<int, array{tmdb_id: int, title: string, year: int|null, poster_path: string|null, rating: float|null, genre_ids: array<int>}>
     */
    private function trendingMoviesList(int $limit = 12): array
    {
        $payload = $this->tmdbService->getTrending('week');

        return $this->tmdbService->normalizeMovieList(
            $payload['results'] ?? [],
            $limit,
        );
    }

    private function resolveMovieFromTmdb(int $tmdbId): Movie
    {
        $movie = Movie::query()->where('tmdb_id', $tmdbId)->first();

        if ($movie) {
            return $movie;
        }

        $data = $this->tmdbService->getMovie($tmdbId);

        if (!isset($data['title']) || ($data['success'] ?? true) === false) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(
                response()->json(['message' => 'Película no encontrada.'], 404)
            );
        }

        return Movie::create([
            'tmdb_id' => $tmdbId,
            'title' => $data['title'],
            'overview' => $data['overview'] ?? null,
            'poster_path' => $data['poster_path'] ?? null,
            'release_year' => isset($data['release_date'])
                ? (int) substr($data['release_date'], 0, 4)
                : null,
            'duration' => $data['runtime'] ?? null,
            'genre_ids' => $this->extractGenreIds($data),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int>|null
     */
    private function extractGenreIds(array $data): ?array
    {
        if (!empty($data['genres']) && is_array($data['genres'])) {
            return array_values(array_map(
                static fn (array $genre): int => (int) $genre['id'],
                $data['genres'],
            ));
        }

        if (!empty($data['genre_ids']) && is_array($data['genre_ids'])) {
            return array_values(array_map(intval(...), $data['genre_ids']));
        }

        return null;
    }
}
