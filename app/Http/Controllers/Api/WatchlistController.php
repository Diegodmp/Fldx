<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\User;
use App\Models\Watchlist;
use App\Services\TmdbService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    public function __construct(
        private readonly TmdbService $tmdbService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:todas,pendiente,vista,puntuada,watched',
            'search' => 'nullable|string|max:100',
            'sort' => 'nullable|string|in:added_desc,added_asc,title_asc,rating_desc',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:500',
        ]);

        $status = $validated['status'] ?? 'todas';
        $search = trim($validated['search'] ?? '');
        $sort = $validated['sort'] ?? 'added_desc';
        $perPage = $validated['per_page'] ?? 20;

        if ($status === 'watched') {
            $status = 'vista';
        }

        $user = $request->user();
        $query = $this->buildFilteredQuery($user, $status, $search);
        $this->applySort($query, $sort);

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (Watchlist $entry) => $this->formatWatchlistItem($entry))
                ->values()
                ->all(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'counts' => $this->getWatchlistCounts($user),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'movie_id' => 'required_without:tmdb_id|integer|exists:movies,id',
            'tmdb_id' => 'required_without:movie_id|integer|min:1',
        ]);

        $movieId = $validated['movie_id']
            ?? $this->resolveMovieFromTmdb($validated['tmdb_id'])->id;

        $exists = Watchlist::query()
            ->where('user_id', $request->user()->id)
            ->where('movie_id', $movieId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'La película ya está en tu watchlist.',
            ], 409);
        }

        $entry = Watchlist::create([
            'user_id' => $request->user()->id,
            'movie_id' => $movieId,
            'status' => 'pending',
        ]);

        $entry->load('movie');

        return response()->json($entry, 201);
    }

    public function update(Request $request, int $movieId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,watched',
            'rating' => 'sometimes|nullable|integer|min:1|max:5',
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => 'Debes enviar al menos status o rating para actualizar.',
            ], 422);
        }

        $entry = $this->findUserEntry($request, $movieId);

        if (!$entry) {
            return response()->json([
                'message' => 'Entrada de watchlist no encontrada.',
            ], 404);
        }

        $entry->update($validated);
        $entry->load('movie');

        return response()->json($entry);
    }

    public function destroy(Request $request, int $movieId): JsonResponse
    {
        $entry = $this->findUserEntry($request, $movieId);

        if (!$entry) {
            return response()->json([
                'message' => 'Entrada de watchlist no encontrada.',
            ], 404);
        }

        $entry->delete();

        return response()->json([
            'message' => 'Película eliminada de la watchlist.',
        ]);
    }

    private function buildFilteredQuery(User $user, string $status, string $search): Builder
    {
        $query = Watchlist::query()
            ->where('user_id', $user->id)
            ->with('movie');

        match ($status) {
            'pendiente' => $query->where('status', 'pending'),
            'vista' => $query
                ->where('status', 'watched')
                ->where(function (Builder $builder) {
                    $builder->whereNull('rating')
                        ->orWhere('rating', 0);
                }),
            'puntuada' => $query->where('rating', '>', 0),
            default => null,
        };

        if ($search !== '') {
            $needle = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $search) . '%';

            $query->whereHas('movie', function (Builder $builder) use ($needle) {
                $builder->whereRaw('LOWER(title) LIKE LOWER(?)', [$needle]);
            });
        }

        return $query;
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'added_asc' => $query->orderBy('watchlist.created_at'),
            'title_asc' => $query
                ->join('movies', 'watchlist.movie_id', '=', 'movies.id')
                ->select('watchlist.*')
                ->orderBy('movies.title'),
            'rating_desc' => $query
                ->orderByRaw('CASE WHEN watchlist.rating IS NULL OR watchlist.rating = 0 THEN 1 ELSE 0 END')
                ->orderByDesc('watchlist.rating')
                ->orderByDesc('watchlist.created_at'),
            default => $query->orderByDesc('watchlist.created_at'),
        };
    }

    /**
     * @return array<string, int>
     */
    private function getWatchlistCounts(User $user): array
    {
        $base = Watchlist::query()->where('user_id', $user->id);

        $pendiente = (clone $base)->where('status', 'pending')->count();
        $puntuada = (clone $base)->where('rating', '>', 0)->count();
        $vista = (clone $base)
            ->where('status', 'watched')
            ->where(function (Builder $query) {
                $query->whereNull('rating')
                    ->orWhere('rating', 0);
            })
            ->count();

        $todas = $base->count();

        return [
            'todas' => $todas,
            'pendiente' => $pendiente,
            'vista' => $vista,
            'puntuada' => $puntuada,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatWatchlistItem(Watchlist $entry): array
    {
        $movie = $entry->movie;

        return [
            'watchlist_id' => $entry->id,
            'movie_id' => $entry->movie_id,
            'tmdb_id' => $movie?->tmdb_id,
            'title' => $movie?->title,
            'year' => $movie?->release_year,
            'poster_path' => $movie?->poster_path,
            'status' => $entry->status,
            'rating' => $entry->rating,
            'added_at' => $entry->created_at,
        ];
    }

    private function findUserEntry(Request $request, int $movieId): ?Watchlist
    {
        return Watchlist::query()
            ->where('user_id', $request->user()->id)
            ->where('movie_id', $movieId)
            ->first();
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
