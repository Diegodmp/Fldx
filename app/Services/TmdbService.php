<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TmdbService
{
    public const DEFAULT_SORT = 'popularity.desc';

    public const ALLOWED_SORT_VALUES = [
        'popularity.desc',
        'vote_average.desc',
        'primary_release_date.desc',
        'primary_release_date.asc',
    ];

    private string $baseUrl;

    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.tmdb.base_url');
        $this->apiKey = config('services.tmdb.api_key');
    }

    /**
     * @param  array{
     *     genre_ids?: int[],
     *     year?: int,
     *     min_rating?: float,
     *     sort_by?: string,
     * }  $filters
     */
    public function searchMovies(string $query, int $page = 1, array $filters = []): array
    {
        $cacheKey = 'tmdb_search_' . md5(json_encode([
            'query' => $query,
            'page' => $page,
            'filters' => $filters,
        ]));

        $payload = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($query, $page, $filters) {
            $params = [
                'query' => $query,
                'page' => $page,
                'language' => 'es-ES',
            ];

            if (isset($filters['year'])) {
                $params['year'] = $filters['year'];
            }

            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/search/movie", $params);

            return $response->json();
        });

        return $this->applySearchFilters($payload, $filters);
    }

    public function getTrending(string $window = 'week'): array
    {
        $cacheKey = "tmdb_trending_movie_{$window}";

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($window) {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/trending/movie/{$window}", [
                    'language' => 'es-ES',
                ]);

            return $response->json();
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $results
     * @return array<int, array{tmdb_id: int, title: string, year: int|null, poster_path: string|null, rating: float|null, genre_ids: array<int>, runtime: int|null}>
     */
    public function normalizeMovieList(array $results, int $limit = 20): array
    {
        $normalized = [];

        foreach ($results as $movie) {
            if (!isset($movie['id'], $movie['title'])) {
                continue;
            }

            $tmdbId = (int) $movie['id'];

            if (isset($normalized[$tmdbId])) {
                continue;
            }

            $year = null;
            if (!empty($movie['release_date'])) {
                $year = (int) substr((string) $movie['release_date'], 0, 4);
            }

            $voteAverage = isset($movie['vote_average'])
                ? (float) $movie['vote_average']
                : null;

            $normalized[$tmdbId] = [
                'tmdb_id' => $tmdbId,
                'title' => (string) $movie['title'],
                'year' => $year,
                'poster_path' => $movie['poster_path'] ?? null,
                'rating' => $voteAverage !== null ? round($voteAverage / 2, 1) : null,
                'genre_ids' => array_values(array_map(intval(...), $movie['genre_ids'] ?? [])),
                'runtime' => isset($movie['runtime']) ? (int) $movie['runtime'] : null,
            ];

            if (count($normalized) >= $limit) {
                break;
            }
        }

        return array_values($normalized);
    }

    /**
     * @param  array{
     *     genre_ids?: int[],
     *     year?: int,
     *     decade_start?: int,
     *     min_rating?: float,
     *     sort_by?: string,
     * }  $filters
     */
    public function discoverMovies(array $filters = [], int $page = 1): array
    {
        $sortBy = $filters['sort_by'] ?? self::DEFAULT_SORT;

        $cacheKey = 'tmdb_discover_' . md5(json_encode([
            'page' => $page,
            'filters' => $filters,
        ]));

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($filters, $page, $sortBy) {
            $params = [
                'page' => $page,
                'language' => 'es-ES',
                'sort_by' => $sortBy,
            ];

            if (!empty($filters['genre_ids'])) {
                $params['with_genres'] = implode(',', $filters['genre_ids']);
            }

            if (isset($filters['year'])) {
                $params['primary_release_year'] = $filters['year'];
            }

            if (isset($filters['decade_start'])) {
                $decadeStart = (int) $filters['decade_start'];
                $params['primary_release_date.gte'] = "{$decadeStart}-01-01";
                $params['primary_release_date.lte'] = ($decadeStart + 9) . '-12-31';
            }

            if (isset($filters['min_rating'])) {
                $params['vote_average.gte'] = $filters['min_rating'];
            }

            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/discover/movie", $params);

            return $response->json();
        });
    }

    public function getGenres(): array
    {
        return Cache::remember('tmdb_genres_es', now()->addDay(), function () {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/genre/movie/list", [
                    'language' => 'es-ES',
                ]);

            return $response->json();
        });
    }

    public function getMovie(int $id): array
    {
        $cacheKey = "tmdb_movie_{$id}";

        return Cache::remember($cacheKey, now()->addDay(), function () use ($id) {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/movie/{$id}", [
                    'language' => 'es-ES',
                    'append_to_response' => 'credits,videos',
                ]);

            return $response->json();
        });
    }

    /**
     * @return array<int, array{tmdb_id: int, title: string, year: int|null, poster_path: string|null, rating: float|null}>
     */
    public function getSimilarMovies(int $tmdbId): array
    {
        return Cache::remember("similar.{$tmdbId}", 86400, function () use ($tmdbId) {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->baseUrl}/movie/{$tmdbId}/similar", [
                    'language' => 'es-ES',
                ]);

            if (!$response->successful()) {
                return [];
            }

            $payload = $response->json();

            if (!is_array($payload)) {
                return [];
            }

            return $this->normalizeMovieList($payload['results'] ?? [], 6);
        });
    }

    /**
     * @param  array{
     *     genre_ids?: int[],
     *     year?: int,
     *     min_rating?: float,
     *     sort_by?: string,
     * }  $filters
     */
    private function applySearchFilters(array $payload, array $filters): array
    {
        if (!isset($payload['results']) || !is_array($payload['results'])) {
            return $payload;
        }

        $results = $payload['results'];

        if (!empty($filters['genre_ids'])) {
            $genreIds = $filters['genre_ids'];
            $results = array_values(array_filter(
                $results,
                static fn (array $movie): bool => count(array_intersect(
                    $movie['genre_ids'] ?? [],
                    $genreIds,
                )) > 0,
            ));
        }

        if (isset($filters['min_rating'])) {
            $minRating = (float) $filters['min_rating'];
            $results = array_values(array_filter(
                $results,
                static fn (array $movie): bool => (float) ($movie['vote_average'] ?? 0) >= $minRating,
            ));
        }

        if (isset($filters['year'])) {
            $year = (int) $filters['year'];
            $results = array_values(array_filter(
                $results,
                static fn (array $movie): bool => isset($movie['release_date'])
                    && (int) substr((string) $movie['release_date'], 0, 4) === $year,
            ));
        }

        if (isset($filters['sort_by'])) {
            $results = $this->sortResults($results, $filters['sort_by']);
        }

        $payload['results'] = $results;
        $payload['total_results'] = count($results);

        return $payload;
    }

    /**
     * @param  array<int, array<string, mixed>>  $results
     * @return array<int, array<string, mixed>>
     */
    private function sortResults(array $results, string $sortBy): array
    {
        usort($results, static function (array $a, array $b) use ($sortBy): int {
            return match ($sortBy) {
                'vote_average.desc' => ($b['vote_average'] ?? 0) <=> ($a['vote_average'] ?? 0),
                'primary_release_date.desc' => strcmp(
                    (string) ($b['release_date'] ?? ''),
                    (string) ($a['release_date'] ?? ''),
                ),
                'primary_release_date.asc' => strcmp(
                    (string) ($a['release_date'] ?? ''),
                    (string) ($b['release_date'] ?? ''),
                ),
                default => ($b['popularity'] ?? 0) <=> ($a['popularity'] ?? 0),
            };
        });

        return $results;
    }
}
