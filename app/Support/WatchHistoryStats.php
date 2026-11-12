<?php

namespace App\Support;

use App\Models\Watchlist;
use Illuminate\Support\Collection;

class WatchHistoryStats
{
    /**
     * @return array<int, int>
     */
    public static function topGenreIds(Collection $watchedEntries, int $limit = 3): array
    {
        $counts = [];

        foreach ($watchedEntries as $entry) {
            foreach ($entry->movie?->genre_ids ?? [] as $genreId) {
                $genreId = (int) $genreId;
                $counts[$genreId] = ($counts[$genreId] ?? 0) + 1;
            }
        }

        arsort($counts);

        return array_slice(array_keys($counts), 0, $limit);
    }

    /**
     * @return array<int, array{genre_id: int, name: string|null, count: int}>
     */
    public static function topGenres(Collection $watchedEntries, int $limit = 5): array
    {
        $counts = [];

        foreach ($watchedEntries as $entry) {
            foreach ($entry->movie?->genre_ids ?? [] as $genreId) {
                $genreId = (int) $genreId;
                $counts[$genreId] = ($counts[$genreId] ?? 0) + 1;
            }
        }

        arsort($counts);

        return collect($counts)
            ->take($limit)
            ->map(static fn (int $count, int $genreId): array => [
                'genre_id' => $genreId,
                'name' => TmdbGenres::name($genreId),
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, int>
     */
    public static function topDecadeStarts(Collection $watchedEntries, int $limit = 3): array
    {
        $counts = [];

        foreach ($watchedEntries as $entry) {
            $releaseYear = $entry->movie?->release_year;

            if ($releaseYear === null) {
                continue;
            }

            $decadeStart = (int) (floor((int) $releaseYear / 10) * 10);
            $counts[$decadeStart] = ($counts[$decadeStart] ?? 0) + 1;
        }

        arsort($counts);

        return array_slice(array_keys($counts), 0, $limit);
    }

    /**
     * @return array<int, array{decade: string, count: int}>
     */
    public static function decades(Collection $watchedEntries): array
    {
        $counts = [];

        foreach ($watchedEntries as $entry) {
            $releaseYear = $entry->movie?->release_year;

            if ($releaseYear === null) {
                continue;
            }

            $decadeStart = (int) (floor((int) $releaseYear / 10) * 10);
            $counts[$decadeStart] = ($counts[$decadeStart] ?? 0) + 1;
        }

        ksort($counts);

        return collect($counts)
            ->map(static fn (int $count, int $decadeStart): array => [
                'decade' => $decadeStart . 's',
                'count' => $count,
            ])
            ->values()
            ->all();
    }

    public static function watchedEntriesForUser(int $userId): Collection
    {
        return Watchlist::query()
            ->where('user_id', $userId)
            ->where('status', 'watched')
            ->with('movie')
            ->get();
    }
}
