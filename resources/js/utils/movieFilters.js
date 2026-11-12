export const SORT_OPTIONS = [
    { value: 'popularity.desc', label: 'Más populares' },
    { value: 'vote_average.desc', label: 'Mejor valoradas' },
    { value: 'primary_release_date.desc', label: 'Más recientes' },
    { value: 'primary_release_date.asc', label: 'Más antiguas' },
];

export const DEFAULT_SORT = 'popularity.desc';

export function emptyFilters() {
    return {
        genreIds: [],
        year: '',
        minRating: null,
        sortBy: DEFAULT_SORT,
    };
}

export function hasActiveFilters(filters) {
    if (!filters) {
        return false;
    }

    return (
        (filters.genreIds?.length ?? 0) > 0
        || String(filters.year ?? '').trim() !== ''
        || (filters.minRating != null && filters.minRating > 1)
        || (filters.sortBy && filters.sortBy !== DEFAULT_SORT)
    );
}

export function countActiveFilters(filters) {
    if (!filters) {
        return 0;
    }

    let count = 0;

    if ((filters.genreIds?.length ?? 0) > 0) {
        count += 1;
    }

    if (String(filters.year ?? '').trim() !== '') {
        count += 1;
    }

    if (filters.minRating != null && filters.minRating > 1) {
        count += 1;
    }

    if (filters.sortBy && filters.sortBy !== DEFAULT_SORT) {
        count += 1;
    }

    return count;
}

export function parseFiltersFromSearchParams(searchParams) {
    const genreIds = searchParams
        .getAll('genre_ids')
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0);

    const yearRaw = searchParams.get('year') ?? '';
    const year = /^\d{4}$/.test(yearRaw) ? yearRaw : '';

    const minRatingRaw = searchParams.get('min_rating');
    const minRatingParsed = minRatingRaw != null ? Number.parseFloat(minRatingRaw) : null;
    const minRating = minRatingParsed != null
        && !Number.isNaN(minRatingParsed)
        && minRatingParsed >= 1
        && minRatingParsed <= 10
        ? minRatingParsed
        : null;

    const sortBy = searchParams.get('sort_by') ?? DEFAULT_SORT;
    const validSort = SORT_OPTIONS.some((option) => option.value === sortBy)
        ? sortBy
        : DEFAULT_SORT;

    return {
        genreIds,
        year,
        minRating,
        sortBy: validSort,
    };
}

export function filtersToSearchParams(filters) {
    const params = {};

    if (String(filters.year ?? '').trim()) {
        params.year = String(filters.year).trim();
    }

    if (filters.minRating != null && filters.minRating > 1) {
        params.min_rating = String(filters.minRating);
    }

    if (filters.sortBy && filters.sortBy !== DEFAULT_SORT) {
        params.sort_by = filters.sortBy;
    }

    return params;
}

export function buildDiscoverParams(query, page, filters) {
    const trimmed = query.trim();
    const params = { page };

    if (trimmed.length >= 2) {
        params.query = trimmed;
    }

    if (filters?.genreIds?.length) {
        params.genre_ids = filters.genreIds;
    }

    if (String(filters?.year ?? '').trim()) {
        params.year = Number.parseInt(String(filters.year).trim(), 10);
    }

    if (filters?.minRating != null && filters.minRating > 1) {
        params.min_rating = filters.minRating;
    }

    if (filters?.sortBy) {
        params.sort_by = filters.sortBy;
    }

    return params;
}
