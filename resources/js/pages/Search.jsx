import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { SlidersHorizontal } from 'lucide-react';
import MovieFiltersPanel from '../components/MovieFiltersPanel';
import MovieSearchField from '../components/MovieSearchField';
import StarRating from '../components/StarRating';
import { useMovieSearch } from '../hooks/useMovieSearch';
import {
    countActiveFilters,
    emptyFilters,
    parseFiltersFromSearchParams,
} from '../utils/movieFilters';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';
const GRID_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

function formatGenres(genreIds = [], genreMap = {}) {
    if (!genreIds.length) {
        return 'Sin género';
    }

    return genreIds
        .map((id) => genreMap[id])
        .filter(Boolean)
        .join(', ') || 'Sin género';
}

function formatYear(releaseDate) {
    if (!releaseDate) {
        return '—';
    }

    const year = releaseDate.slice(0, 4);
    return year || '—';
}

function SearchResultPosterCard({ movie, genreMap, onNavigate }) {
    const src = movie?.poster_path ? `${GRID_POSTER_BASE}${movie.poster_path}` : null;

    return (
        <Link
            to={`/movies/${movie.id}`}
            onClick={onNavigate}
            className="block w-full no-underline text-inherit"
        >
            <div
                className="poster-hover relative block w-full overflow-hidden rounded-md bg-white/3"
                style={{ aspectRatio: '2 / 3' }}
            >
                {src ? (
                    <img
                        src={src}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/4 px-2 text-center text-xs text-txt-faint">
                        {movie?.title ?? 'Sin póster'}
                    </div>
                )}
                <div className="ph-overlay absolute inset-0 bg-black/35" />
            </div>
            <div className="mt-2.5 font-serif text-[15px] leading-[1.15] text-txt">
                {movie.title}
            </div>
            <div className="mt-0.5 text-[11px] text-txt-faint">
                {formatYear(movie.release_date)}
            </div>
        </Link>
    );
}

function RecommendedGridSkeleton({ count = 8 }) {
    return (
        <div className="movie-poster-grid">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    <div className="shimmer aspect-2/3 w-full rounded-md" />
                    <div className="mt-2.5 shimmer h-4 w-4/5 rounded" />
                    <div className="mt-1 shimmer h-3 w-1/2 rounded" />
                </div>
            ))}
        </div>
    );
}

function RecommendedMovieCard({ movie, onClick }) {
    const src = movie?.poster_path ? `${GRID_POSTER_BASE}${movie.poster_path}` : null;

    return (
        <div>
            <button
                type="button"
                onClick={onClick}
                className="poster-hover relative block w-full cursor-pointer overflow-hidden rounded-md border-0 bg-white/3 p-0"
                style={{ aspectRatio: '2 / 3' }}
            >
                {src ? (
                    <img
                        src={src}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/4 px-2 text-center text-xs text-txt-faint">
                        {movie?.title ?? 'Sin póster'}
                    </div>
                )}
                <div className="ph-overlay absolute inset-0 bg-black/35" />
            </button>
            <div className="mt-2.5 font-serif text-[15px] leading-[1.15] text-txt">
                {movie.title}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-txt-faint">
                    {movie.year ?? '—'}
                </span>
                {movie.rating != null && movie.rating > 0 ? (
                    <StarRating value={movie.rating} readOnly size={11} />
                ) : null}
            </div>
        </div>
    );
}

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';
    const initialPage = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const initialFilters = parseFiltersFromSearchParams(searchParams);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [genres, setGenres] = useState([]);
    const [genresLoading, setGenresLoading] = useState(true);
    const [genreMap, setGenreMap] = useState({});
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [recommendedLoading, setRecommendedLoading] = useState(true);
    const inputRef = useRef(null);

    const activeFilterCount = countActiveFilters(appliedFilters);

    const {
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
        handleInputChange,
        commitSearch,
        goToPage,
        hasBrowseCriteria,
    } = useMovieSearch(initialQuery, initialPage, { filters: appliedFilters });

    const showRecommendedSection = trimmedInput.trim() === '' && activeFilterCount === 0;

    useEffect(() => {
        let cancelled = false;

        setRecommendedLoading(true);

        axios.get('/movies/recommended')
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                setRecommendedMovies(data.movies ?? []);
            })
            .catch(() => {
                if (!cancelled) {
                    setRecommendedMovies([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setRecommendedLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        setGenresLoading(true);

        axios.get('/movies/genres')
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                const list = data.genres ?? [];
                setGenres(list);
                setGenreMap(Object.fromEntries(list.map((genre) => [genre.id, genre.name])));
            })
            .catch(() => {
                if (!cancelled) {
                    setGenres([]);
                    setGenreMap({});
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setGenresLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const next = new URLSearchParams();

        if (query.trim()) {
            next.set('q', query.trim());
        }

        if (page > 1) {
            next.set('page', String(page));
        }

        appliedFilters.genreIds?.forEach((id) => {
            next.append('genre_ids', String(id));
        });

        if (String(appliedFilters.year ?? '').trim()) {
            next.set('year', String(appliedFilters.year).trim());
        }

        if (appliedFilters.minRating != null && appliedFilters.minRating > 1) {
            next.set('min_rating', String(appliedFilters.minRating));
        }

        if (appliedFilters.sortBy && appliedFilters.sortBy !== 'popularity.desc') {
            next.set('sort_by', appliedFilters.sortBy);
        }

        setSearchParams(next, { replace: true });
    }, [query, page, appliedFilters, setSearchParams]);

    useEffect(() => {
        if (!loading && results.length > 0 && query.trim() === trimmedInput.trim()) {
            setShowSuggestions(false);
        }
    }, [loading, results.length, query, trimmedInput]);

    const handleSearchSubmit = () => {
        if (commitSearch()) {
            setShowSuggestions(false);
        }
    };

    const handleOpenFilters = () => {
        setDraftFilters(appliedFilters);
        setFiltersOpen(true);
    };

    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        setFiltersOpen(false);
        setShowSuggestions(false);
    };

    const handleClearFilters = () => {
        const cleared = emptyFilters();
        setDraftFilters(cleared);
        setAppliedFilters(cleared);
    };

    const showEmptyBrowseHint = !loading
        && !hasBrowseCriteria
        && !error
        && !(showRecommendedSection && (recommendedLoading || recommendedMovies.length > 0));
    const showNoResults = !loading && hasBrowseCriteria && results.length === 0 && !error;

    return (
        <div className="page-in mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="font-serif text-2xl text-txt sm:text-3xl">Buscar</h1>
                <p className="mt-2 text-sm text-txt-dim">
                    Explora el catálogo de TMDB y encuentra tu próxima película.
                </p>
            </div>

            <div className="relative z-20 mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start">
                <MovieSearchField
                    inputRef={inputRef}
                    input={input}
                    onInputChange={(value) => {
                        handleInputChange(value);
                        setShowSuggestions(true);
                    }}
                    onSubmit={handleSearchSubmit}
                    loading={loading}
                    error={error}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    suggestionsBusy={isPendingSearch || loading}
                    onSuggestionClick={() => setShowSuggestions(false)}
                    onFocus={() => {
                        if (trimmedInput.length >= 2) {
                            setShowSuggestions(true);
                        }
                    }}
                    className="relative min-w-0 flex-1"
                />

                <button
                    type="button"
                    onClick={handleOpenFilters}
                    className="relative flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-strong bg-white/2.5 px-4 py-2.5 text-sm text-txt transition-colors hover:border-gold/30 hover:bg-white/5 sm:py-2.5"
                    aria-label="Abrir filtros"
                >
                    <SlidersHorizontal size={16} className="text-txt-dim" />
                    <span>Filtros</span>
                    {activeFilterCount > 0 && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold leading-none text-bg-base">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            <MovieFiltersPanel
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                draftFilters={draftFilters}
                onDraftChange={setDraftFilters}
                genres={genres}
                genresLoading={genresLoading}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
            />

            <section
                aria-hidden={!showRecommendedSection}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                    showRecommendedSection
                        ? 'mb-8 max-h-[4000px] opacity-100'
                        : 'mb-0 max-h-0 opacity-0 pointer-events-none'
                }`}
            >
                <div className="mb-4">
                    <div className="mb-1 text-[10.5px] font-semibold tracking-[0.14em] text-gold uppercase">
                        Recomendado para ti
                    </div>
                    <h2 className="font-serif text-xl text-txt">Por tu historial reciente</h2>
                    <button
                        type="button"
                        onClick={() => navigate('/recomendaciones')}
                        className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-gold transition-opacity hover:opacity-80"
                    >
                        Ver todas las recomendaciones →
                    </button>
                </div>

                {recommendedLoading ? (
                    <RecommendedGridSkeleton />
                ) : recommendedMovies.length === 0 ? (
                    <p className="text-sm text-txt-dim">
                        Aún no hay recomendaciones para mostrar.
                    </p>
                ) : (
                    <div className="movie-poster-grid">
                        {recommendedMovies.map((movie) => (
                            <RecommendedMovieCard
                                key={movie.tmdb_id}
                                movie={movie}
                                onClick={() => navigate(`/movies/${movie.tmdb_id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {error && !showSuggestions && (
                <div className="mb-6 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            )}

            {showEmptyBrowseHint && (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-16 text-center">
                    <p className="font-serif text-xl text-txt">Explora el catálogo</p>
                    <p className="mt-2 text-sm text-txt-dim">
                        Busca por título o aplica filtros para descubrir películas.
                    </p>
                </div>
            )}

            {loading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex gap-4 rounded-xl border border-border-soft bg-white/2 p-4"
                        >
                            <div className="shimmer h-36 w-24 shrink-0 rounded-lg" />
                            <div className="flex flex-1 flex-col gap-3 py-1">
                                <div className="shimmer h-5 w-3/4 rounded" />
                                <div className="shimmer h-4 w-1/4 rounded" />
                                <div className="shimmer h-4 w-full rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showNoResults && (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-16 text-center">
                    <p className="font-serif text-xl text-txt">No se encontraron resultados</p>
                    <p className="mt-2 text-sm text-txt-dim">
                        Prueba con otro término o ajusta los filtros.
                    </p>
                </div>
            )}

            {!loading && results.length > 0 && (
                <>
                    <div className="search-results-poster-grid">
                        {results.map((movie) => (
                            <SearchResultPosterCard
                                key={movie.id}
                                movie={movie}
                                genreMap={genreMap}
                                onNavigate={() => setShowSuggestions(false)}
                            />
                        ))}
                    </div>

                    <div className="search-results-list-grid">
                        {results.map((movie) => (
                            <Link
                                key={movie.id}
                                to={`/movies/${movie.id}`}
                                onClick={() => setShowSuggestions(false)}
                                className="block h-full w-full no-underline text-inherit"
                            >
                                <article className="flex h-full gap-4 rounded-xl border border-border-soft bg-white/2 p-4 transition-colors hover:border-border-strong hover:bg-white/4">
                                    {movie.poster_path ? (
                                        <img
                                            src={`${POSTER_BASE}${movie.poster_path}`}
                                            alt={movie.title}
                                            className="h-36 w-24 shrink-0 rounded-lg object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-700/80 text-xs text-txt-faint">
                                            Sin póster
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-serif text-lg leading-tight text-txt">
                                            {movie.title}
                                        </h2>
                                        <p className="mt-1 text-sm text-txt-dim">
                                            {formatYear(movie.release_date)}
                                        </p>
                                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-txt-faint">
                                            {formatGenres(movie.genre_ids, genreMap)}
                                        </p>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                onClick={() => goToPage(page - 1)}
                                disabled={page <= 1}
                                className="cursor-pointer rounded-lg border border-border-strong bg-white/2.5 px-4 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-txt-dim">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => goToPage(page + 1)}
                                disabled={page >= totalPages}
                                className="cursor-pointer rounded-lg border border-border-strong bg-white/2.5 px-4 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
