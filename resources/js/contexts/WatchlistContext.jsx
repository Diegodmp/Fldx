import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import axios from 'axios';
import { deriveWatchState } from '../utils/watchState';
import { mapWatchlistItem } from '../utils/watchlist';

const WatchlistContext = createContext(null);

function findEntryByTmdbId(entries, tmdbId) {
    return entries.find((entry) => entry.movie?.tmdb_id === Number(tmdbId)) ?? null;
}

function findEntryByMovieId(entries, movieId) {
    return entries.find((entry) => entry.movie_id === Number(movieId)) ?? null;
}

function resolveBusyKey({ entry, tmdbId, movieId }) {
    if (entry?.movie?.tmdb_id) {
        return `tmdb:${entry.movie.tmdb_id}`;
    }

    if (tmdbId) {
        return `tmdb:${tmdbId}`;
    }

    return `movie:${movieId ?? entry?.movie_id}`;
}

export function WatchlistProvider({ children }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyKeys, setBusyKeys] = useState({});

    const setKeyBusy = useCallback((key, value) => {
        setBusyKeys((prev) => ({ ...prev, [key]: value }));
    }, []);

    const fetchWatchlist = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const { data } = await axios.get('/watchlist', {
                params: { per_page: 500 },
            });
            const items = (data.data ?? data).map(mapWatchlistItem);
            setEntries(items);
            return items;
        } catch (err) {
            const message = err.response?.data?.message ?? 'No se pudo cargar la watchlist.';
            setError(message);
            setEntries([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const upsertEntry = useCallback((entry) => {
        setEntries((prev) => [entry, ...prev.filter((item) => item.movie_id !== entry.movie_id)]);
    }, []);

    const removeEntryByMovieId = useCallback((movieId) => {
        setEntries((prev) => prev.filter((item) => item.movie_id !== movieId));
    }, []);

    const getEntry = useCallback((tmdbId) => findEntryByTmdbId(entries, tmdbId), [entries]);

    const getWatchState = useCallback((tmdbId) => {
        return deriveWatchState(findEntryByTmdbId(entries, Number(tmdbId)));
    }, [entries]);

    const isBusy = useCallback((key) => Boolean(busyKeys[key]), [busyKeys]);

    const addToWatchlist = useCallback(async (payload) => {
        const key = payload.tmdb_id ? `tmdb:${payload.tmdb_id}` : `movie:${payload.movie_id}`;
        setKeyBusy(key, true);

        try {
            const { data } = await axios.post('/watchlist', payload);
            upsertEntry(data);
            return data;
        } finally {
            setKeyBusy(key, false);
        }
    }, [setKeyBusy, upsertEntry]);

    const updateWatchlistEntry = useCallback(async (movieId, payload) => {
        const key = `movie:${movieId}`;
        setKeyBusy(key, true);

        try {
            const { data } = await axios.patch(`/watchlist/${movieId}`, payload);
            upsertEntry(data);
            return data;
        } finally {
            setKeyBusy(key, false);
        }
    }, [setKeyBusy, upsertEntry]);

    const removeFromWatchlist = useCallback(async (movieId, tmdbId = null) => {
        const key = tmdbId ? `tmdb:${tmdbId}` : `movie:${movieId}`;
        setKeyBusy(key, true);

        try {
            await axios.delete(`/watchlist/${movieId}`);
            removeEntryByMovieId(movieId);
        } finally {
            setKeyBusy(key, false);
        }
    }, [removeEntryByMovieId, setKeyBusy]);

    const toggleWatch = useCallback(async ({ tmdbId, movieId }) => {
        const entry = tmdbId
            ? findEntryByTmdbId(entries, tmdbId)
            : findEntryByMovieId(entries, movieId);
        const resolvedTmdbId = Number(entry?.movie?.tmdb_id ?? tmdbId);
        const busyKey = resolveBusyKey({ entry, tmdbId: resolvedTmdbId, movieId });

        setKeyBusy(busyKey, true);

        try {
            if (!entry) {
                await addToWatchlist({ tmdb_id: resolvedTmdbId });
            } else {
                await removeFromWatchlist(entry.movie_id, resolvedTmdbId);
            }
        } finally {
            setKeyBusy(busyKey, false);
        }
    }, [addToWatchlist, entries, removeFromWatchlist, setKeyBusy]);

    const value = useMemo(() => ({
        entries,
        loading,
        error,
        fetchWatchlist,
        getEntry,
        getWatchState,
        isBusy,
        toggleWatch,
        addToWatchlist,
        updateWatchlistEntry,
        removeFromWatchlist,
    }), [
        entries,
        loading,
        error,
        fetchWatchlist,
        getEntry,
        getWatchState,
        isBusy,
        toggleWatch,
        addToWatchlist,
        updateWatchlistEntry,
        removeFromWatchlist,
    ]);

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlistContext() {
    const context = useContext(WatchlistContext);

    if (!context) {
        throw new Error('useWatchlistContext debe usarse dentro de WatchlistProvider');
    }

    return context;
}
