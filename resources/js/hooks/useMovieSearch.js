import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { buildDiscoverParams, hasActiveFilters } from '../utils/movieFilters';

export const SEARCH_DEBOUNCE_MS = 350;
export const SUGGESTIONS_LIMIT = 6;

export function useMovieSearch(initialQuery = '', initialPage = 1, options = {}) {
    const { filters = null } = options;
    const canBrowseWithoutQuery = filters !== null;

    const [input, setInput] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [page, setPage] = useState(initialPage);
    const [results, setResults] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const filtersKey = useMemo(
        () => (filters ? JSON.stringify(filters) : ''),
        [filters],
    );
    const prevFiltersKey = useRef(filtersKey);

    const trimmedInput = input.trim();
    const isPendingSearch = trimmedInput.length >= 2 && trimmedInput !== query.trim();
    const suggestions = page === 1 ? results.slice(0, SUGGESTIONS_LIMIT) : [];

    const shouldFetch = useCallback((searchQuery, searchFilters) => {
        if (searchQuery.trim().length >= 2) {
            return true;
        }

        return canBrowseWithoutQuery && hasActiveFilters(searchFilters);
    }, [canBrowseWithoutQuery]);

    const fetchMovies = useCallback(async (searchQuery, searchPage, searchFilters) => {
        if (!shouldFetch(searchQuery, searchFilters)) {
            setResults([]);
            setTotalPages(0);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await axios.get('/movies/discover', {
                params: buildDiscoverParams(searchQuery, searchPage, searchFilters),
            });

            setResults(data.results ?? []);
            setTotalPages(data.total_pages ?? 0);
        } catch (err) {
            const message = err.response?.data?.message
                ?? Object.values(err.response?.data?.errors ?? {}).flat()[0]
                ?? 'No se pudo cargar la búsqueda.';

            setResults([]);
            setTotalPages(0);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [shouldFetch]);

    useEffect(() => {
        if (prevFiltersKey.current !== filtersKey) {
            setPage(1);
            prevFiltersKey.current = filtersKey;
        }
    }, [filtersKey]);

    useEffect(() => {
        fetchMovies(query, page, filters);
    }, [query, page, filters, filtersKey, fetchMovies]);

    useEffect(() => {
        if (trimmedInput.length < 2) {
            if (!canBrowseWithoutQuery || !hasActiveFilters(filters)) {
                setQuery('');
                setPage(1);
                setResults([]);
                setTotalPages(0);
                setError('');
                return undefined;
            }

            setQuery('');
            return undefined;
        }

        const timer = setTimeout(() => {
            setQuery(trimmedInput);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [trimmedInput, canBrowseWithoutQuery, filters, filtersKey]);

    const commitSearch = (value = trimmedInput) => {
        const trimmed = value.trim();

        if (trimmed.length < 2 && !(canBrowseWithoutQuery && hasActiveFilters(filters))) {
            setError('Introduce al menos 2 caracteres para buscar.');
            return false;
        }

        setInput(trimmed);
        setQuery(trimmed);
        setPage(1);
        setError('');
        return true;
    };

    const handleInputChange = (value) => {
        setInput(value);

        if (value.trim().length < 2) {
            setError('');
        }
    };

    const goToPage = (nextPage) => {
        if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) {
            return;
        }

        setPage(nextPage);
    };

    const reset = useCallback(() => {
        setInput('');
        setQuery('');
        setPage(1);
        setResults([]);
        setTotalPages(0);
        setLoading(false);
        setError('');
    }, []);

    return {
        input,
        query,
        page,
        results,
        totalPages,
        loading,
        error,
        trimmedInput,
        isPendingSearch,
        suggestions,
        setInput,
        handleInputChange,
        commitSearch,
        goToPage,
        setError,
        reset,
        hasBrowseCriteria: shouldFetch(query, filters),
    };
}
