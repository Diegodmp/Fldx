import {
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    Bookmark,
    Clock,
    Compass,
    Eye,
    Film,
    LayoutGrid,
    List,
    Search,
    Star,
    X,
} from 'lucide-react';
import MovieCardMini from '../../components/MovieCardMini';
import StarRating from '../../components/StarRating';
import WatchButton from '../../components/WatchButton';
import WatchStateBadge from '../../components/WatchStateBadge';
import { useWatchlistContext } from '../../contexts/WatchlistContext';
import {
    getWatchlistRangeLabel,
    getWatchStateFromItem,
    mapWatchlistItem,
    SORT_OPTIONS,
} from '../../utils/watchlist';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

const TABS = [
    { id: 'todas', label: 'Todas', Icon: Film },
    { id: 'pendiente', label: 'Pendientes', Icon: Clock },
    { id: 'vista', label: 'Vistas', Icon: Eye },
    { id: 'puntuada', label: 'Puntuadas', Icon: Star },
];

const INITIAL_STATE = {
    filter: 'todas',
    searchInput: '',
    search: '',
    sort: 'added_desc',
    page: 1,
    view: 'list',
};

function watchlistReducer(state, action) {
    switch (action.type) {
        case 'SET_FILTER':
            return { ...state, filter: action.payload, page: 1 };
        case 'SET_SEARCH_INPUT':
            return { ...state, searchInput: action.payload };
        case 'SET_SEARCH':
            return { ...state, search: action.payload, page: 1 };
        case 'SET_SORT':
            return { ...state, sort: action.payload, page: 1 };
        case 'SET_PAGE':
            return { ...state, page: action.payload };
        case 'SET_VIEW':
            return { ...state, view: action.payload };
        case 'CLEAR_FILTERS':
            return {
                ...state,
                filter: 'todas',
                searchInput: '',
                search: '',
                sort: 'added_desc',
                page: 1,
            };
        default:
            return state;
    }
}

function WatchlistGridCard({ entry, watchState, busy, onToggleWatch }) {
    const movie = entry.movie;

    if (!movie) {
        return null;
    }

    return (
        <article className="group relative">
            <div className="relative overflow-hidden rounded-xl border border-border-soft bg-white/2">
                <Link
                    to={`/movies/${movie.tmdb_id}`}
                    className="block w-full no-underline"
                >
                    {movie.poster_path ? (
                        <img
                            src={`${POSTER_BASE}${movie.poster_path}`}
                            alt={movie.title}
                            className="aspect-2/3 w-full object-cover transition-opacity group-hover:opacity-90"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex aspect-2/3 w-full items-center justify-center bg-white/4 text-xs text-txt-faint">
                            Sin póster
                        </div>
                    )}
                </Link>

                <div className="pointer-events-none absolute top-2 left-2">
                    <WatchStateBadge watchState={watchState} />
                </div>

                <div
                    className="absolute right-2 bottom-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                >
                    <WatchButton
                        watchState={watchState}
                        onChange={() => onToggleWatch(entry)}
                        loading={busy}
                        compact
                    />
                </div>
            </div>

            <Link
                to={`/movies/${movie.tmdb_id}`}
                className="mt-2.5 block no-underline hover:opacity-90"
            >
                <h3 className="truncate font-serif text-sm leading-[1.15] text-txt">
                    {movie.title}
                </h3>
            </Link>
            <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[10.5px] text-txt-faint">
                    {movie.release_year ?? '—'}
                </p>
                {entry.rating > 0 ? (
                    <StarRating value={entry.rating} readOnly size={9} showNumber />
                ) : null}
            </div>
        </article>
    );
}

function WatchlistEmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-soft bg-white/2">
                <Bookmark size={24} className="text-txt-faint" />
            </div>
            <p className="font-serif text-xl text-txt">Tu watchlist está vacía</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">
                Cuando añadas películas pendientes de ver, aparecerán aquí.
                Empieza buscando películas en el catálogo.
            </p>
            <Link
                to="/filmdex"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-primary px-5 py-2.5 text-sm font-medium text-white no-underline transition-opacity hover:opacity-90"
            >
                <Compass size={16} />
                Explorar películas
            </Link>
        </div>
    );
}

function PaginationButton({ children, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="cursor-pointer rounded-lg border border-border-strong bg-white/2.5 px-4 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    );
}

export default function WatchlistPage() {
    const listTopRef = useRef(null);
    const previousPageRef = useRef(1);
    const [state, dispatch] = useReducer(watchlistReducer, INITIAL_STATE);
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20,
    });
    const [counts, setCounts] = useState({
        todas: 0,
        pendiente: 0,
        vista: 0,
        puntuada: 0,
    });
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const {
        isBusy,
        toggleWatch,
        fetchWatchlist,
    } = useWatchlistContext();

    const isEntryBusy = useCallback((entry) => {
        const tmdbId = entry.movie?.tmdb_id;
        return isBusy(`tmdb:${tmdbId}`) || isBusy(`movie:${entry.movie_id}`);
    }, [isBusy]);

    const handleToggleWatch = async (entry) => {
        await toggleWatch({
            tmdbId: entry.movie?.tmdb_id,
            movieId: entry.movie_id,
        });
        await fetchWatchlist();
        await loadWatchlist({ silent: true });
    };

    const loadWatchlist = useCallback(async ({ silent = false } = {}) => {
        if (silent) {
            setFetching(true);
        } else {
            setLoading(true);
        }
        setError('');

        try {
            const { data } = await axios.get('/watchlist', {
                params: {
                    status: state.filter,
                    search: state.search || undefined,
                    sort: state.sort,
                    page: state.page,
                    per_page: 20,
                },
            });

            setItems((data.data ?? []).map(mapWatchlistItem));
            setMeta({
                current_page: data.current_page ?? 1,
                last_page: data.last_page ?? 1,
                total: data.total ?? 0,
                per_page: data.per_page ?? 20,
            });
            if (data.counts) {
                setCounts(data.counts);
            }
        } catch (err) {
            const message = err.response?.data?.message ?? 'No se pudo cargar la watchlist.';
            setError(message);
            setItems([]);
        } finally {
            setLoading(false);
            setFetching(false);
            setInitialLoaded(true);
        }
    }, [state.filter, state.search, state.sort, state.page]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (state.searchInput !== state.search) {
                dispatch({ type: 'SET_SEARCH', payload: state.searchInput.trim() });
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [state.searchInput, state.search]);

    useEffect(() => {
        loadWatchlist();
    }, [loadWatchlist]);

    useEffect(() => {
        if (!initialLoaded || loading) {
            return;
        }

        if (state.page !== previousPageRef.current) {
            listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        previousPageRef.current = state.page;
    }, [state.page, initialLoaded, loading]);

    const hasActiveFilters = state.filter !== 'todas'
        || state.search.trim() !== ''
        || state.sort !== 'added_desc';

    const isWatchlistEmpty = counts.todas === 0 && !loading && !error;
    const isFilteredEmpty = !loading && meta.total === 0 && !isWatchlistEmpty;

    return (
        <div className="page-in mx-auto max-w-[1200px] px-4 py-7 pb-[60px] sm:px-9">
            <div className="mb-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                    Tu colección
                </p>
                <h1 className="mt-2 font-serif text-4xl leading-none tracking-[-0.01em] text-txt sm:text-[42px]">
                    Watchlist
                </h1>
                <p className="mt-3 text-sm text-txt-dim">
                    <strong className="text-txt">{counts.pendiente}</strong> por ver ·{' '}
                    <strong className="text-txt">{counts.vista + counts.puntuada}</strong> vistas ·{' '}
                    <strong className="text-txt">{counts.puntuada}</strong> puntuadas
                </p>
            </div>

            {!isWatchlistEmpty && (
                <div className="mb-5 border-b border-border-soft">
                    <div className="flex flex-col gap-3 pb-px lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-1 overflow-x-auto">
                            {TABS.map((tab) => {
                                const Icon = tab.Icon;
                                const active = state.filter === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_FILTER', payload: tab.id })}
                                        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent px-4 py-3 text-[13px] font-medium transition-colors ${
                                            active
                                                ? 'border-gold text-txt'
                                                : 'border-transparent text-txt-dim hover:text-txt'
                                        }`}
                                    >
                                        <Icon
                                            size={13}
                                            className={active ? 'text-gold' : 'text-current'}
                                        />
                                        <span
                                            className={`watchlist-tab-label${active ? ' watchlist-tab-label--active' : ''}`}
                                        >
                                            {tab.label}
                                        </span>
                                        <span
                                            className={`rounded-full px-1.5 py-px text-[10.5px] tabular-nums ${
                                                active
                                                    ? 'bg-gold/10 text-gold'
                                                    : 'bg-white/4 text-txt-faint'
                                            }`}
                                        >
                                            {counts[tab.id] ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="watchlist-controls-row mb-3 flex flex-wrap items-center gap-2 lg:mb-2 lg:shrink-0">
                            <div className="watchlist-search-wrap relative min-w-[200px] flex-1 sm:flex-none sm:w-[220px]">
                                <Search
                                    size={14}
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-txt-faint"
                                />
                                <input
                                    type="search"
                                    value={state.searchInput}
                                    onChange={(event) => dispatch({
                                        type: 'SET_SEARCH_INPUT',
                                        payload: event.target.value,
                                    })}
                                    placeholder="Buscar en tu watchlist…"
                                    className="w-full rounded-md border border-border-soft bg-white/[0.03] py-2 pr-8 pl-9 text-sm text-txt outline-none focus:border-gold/35"
                                />
                                {state.searchInput ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: 'SET_SEARCH_INPUT', payload: '' });
                                            dispatch({ type: 'SET_SEARCH', payload: '' });
                                        }}
                                        className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-txt-faint hover:text-txt"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : null}
                            </div>

                            <div className="watchlist-controls-actions flex w-full items-center gap-2 md:contents">
                                <select
                                    value={state.sort}
                                    onChange={(event) => dispatch({
                                        type: 'SET_SORT',
                                        payload: event.target.value,
                                    })}
                                    className="cursor-pointer rounded-md border border-border-soft bg-white/[0.03] px-3 py-2 text-sm text-txt outline-none"
                                    aria-label="Ordenar watchlist"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="watchlist-view-toggle ml-auto flex shrink-0 rounded-md border border-border-soft bg-white/[0.025] p-0.5 md:ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'list' })}
                                        className={`inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded border-0 transition-colors ${
                                            state.view === 'list'
                                                ? 'bg-white/[0.06] text-gold'
                                                : 'bg-transparent text-txt-dim hover:text-txt'
                                        }`}
                                        aria-label="Vista lista"
                                    >
                                        <List size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'grid' })}
                                        className={`inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded border-0 transition-colors ${
                                            state.view === 'grid'
                                                ? 'bg-white/[0.06] text-gold'
                                                : 'bg-transparent text-txt-dim hover:text-txt'
                                        }`}
                                        aria-label="Vista cuadrícula"
                                    >
                                        <LayoutGrid size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            )}

            <div ref={listTopRef} />

            {isWatchlistEmpty ? (
                <WatchlistEmptyState />
            ) : (
                <>
                    {isFilteredEmpty ? (
                        <div className="rounded-lg border border-border-soft bg-white/[0.02] px-5 py-8 text-center">
                            <p className="text-sm text-txt-dim">
                                No hay películas que coincidan con tu búsqueda.
                            </p>
                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
                                    className="mt-3 cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-gold transition-opacity hover:opacity-80"
                                >
                                    Limpiar filtros
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div
                                className="transition-opacity duration-200"
                                style={{
                                    opacity: fetching ? 0.4 : 1,
                                    pointerEvents: fetching ? 'none' : 'auto',
                                }}
                            >
                                {state.view === 'list' ? (
                                    <div className="flex flex-col gap-2">
                                        {items.map((entry) => (
                                            <MovieCardMini
                                                key={entry.id}
                                                entry={entry}
                                                watchState={getWatchStateFromItem(entry)}
                                                busy={isEntryBusy(entry)}
                                                onToggleWatch={handleToggleWatch}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="watchlist-poster-grid">
                                        {items.map((entry) => (
                                            <WatchlistGridCard
                                                key={entry.id}
                                                entry={entry}
                                                watchState={getWatchStateFromItem(entry)}
                                                busy={isEntryBusy(entry)}
                                                onToggleWatch={handleToggleWatch}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {meta.total > 0 && (
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-txt-faint">
                                        {getWatchlistRangeLabel({
                                            currentPage: meta.current_page,
                                            perPage: meta.per_page,
                                            total: meta.total,
                                        })}
                                    </p>
                                    {meta.last_page > 1 ? (
                                        <div className="flex items-center gap-2">
                                            <PaginationButton
                                                onClick={() => dispatch({
                                                    type: 'SET_PAGE',
                                                    payload: meta.current_page - 1,
                                                })}
                                                disabled={fetching || meta.current_page <= 1}
                                            >
                                                Anterior
                                            </PaginationButton>
                                            <PaginationButton
                                                onClick={() => dispatch({
                                                    type: 'SET_PAGE',
                                                    payload: meta.current_page + 1,
                                                })}
                                                disabled={fetching || meta.current_page >= meta.last_page}
                                            >
                                                Siguiente
                                            </PaginationButton>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
