import { deriveWatchState } from './watchState';

export function mapWatchlistItem(item) {
    if (item?.movie) {
        return item;
    }

    return {
        id: item.watchlist_id ?? item.id,
        movie_id: item.movie_id,
        status: item.status,
        rating: item.rating,
        created_at: item.added_at ?? item.created_at,
        movie: {
            tmdb_id: item.tmdb_id,
            title: item.title,
            poster_path: item.poster_path,
            release_year: item.year ?? item.release_year,
        },
    };
}

export function getWatchStateFromItem(item) {
    return deriveWatchState(mapWatchlistItem(item));
}

export const SORT_OPTIONS = [
    { value: 'added_desc', label: 'Más recientes' },
    { value: 'added_asc', label: 'Más antiguas' },
    { value: 'title_asc', label: 'Título A–Z' },
    { value: 'rating_desc', label: 'Mejor puntuadas' },
];

export function getWatchlistRangeLabel({ currentPage, perPage, total }) {
    if (total === 0) {
        return 'Mostrando 0 de 0 películas';
    }

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, total);

    return `Mostrando ${start}–${end} de ${total} películas`;
}
