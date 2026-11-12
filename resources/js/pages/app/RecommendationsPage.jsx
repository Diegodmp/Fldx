import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

function formatGenres(genreIds = [], genreMap = {}) {
    if (!genreIds.length) {
        return 'Sin género';
    }

    return genreIds
        .map((id) => genreMap[id])
        .filter(Boolean)
        .join(', ') || 'Sin género';
}

function buildGenreSubtitle(genres = []) {
    const names = genres
        .slice(0, 3)
        .map((genre) => genre.name)
        .filter(Boolean);

    if (names.length === 0) {
        return 'Basado en las películas populares de la semana.';
    }

    return `Basado en tus géneros favoritos: ${names.join(', ')}`;
}

function GridSkeleton() {
    return (
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
    );
}

export default function RecommendationsPage() {
    const [movies, setMovies] = useState([]);
    const [topGenres, setTopGenres] = useState([]);
    const [genreMap, setGenreMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');

            try {
                const [recommendedResult, statsResult, genresResult] = await Promise.allSettled([
                    axios.get('/movies/recommended'),
                    axios.get('/stats/me'),
                    axios.get('/movies/genres'),
                ]);

                if (cancelled) {
                    return;
                }

                if (recommendedResult.status === 'fulfilled') {
                    setMovies(recommendedResult.value.data.movies ?? []);
                } else {
                    setMovies([]);
                    setError('No se pudieron cargar las recomendaciones.');
                }

                if (statsResult.status === 'fulfilled') {
                    setTopGenres(statsResult.value.data.generos ?? []);
                }

                if (genresResult.status === 'fulfilled') {
                    const list = genresResult.value.data.genres ?? [];
                    setGenreMap(Object.fromEntries(list.map((genre) => [genre.id, genre.name])));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="page-in mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-gold uppercase">
                    Recomendado para ti
                </div>
                <h1 className="font-serif text-3xl text-txt">Tus recomendaciones</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-txt-dim">
                    {buildGenreSubtitle(topGenres)}
                </p>
            </header>

            {error ? (
                <div className="mb-6 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <GridSkeleton />
            ) : movies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-16 text-center">
                    <p className="font-serif text-xl text-txt">Sin recomendaciones por ahora</p>
                    <p className="mt-2 text-sm text-txt-dim">
                        Marca películas como vistas en tu watchlist para personalizar esta sección.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {movies.map((movie) => (
                        <Link
                            key={movie.tmdb_id}
                            to={`/movies/${movie.tmdb_id}`}
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
                                        {movie.year ?? '—'}
                                        {movie.rating != null ? ` · ${movie.rating}` : ''}
                                    </p>
                                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-txt-faint">
                                        {formatGenres(movie.genre_ids, genreMap)}
                                    </p>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
