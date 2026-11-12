import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, Plus, Trash2 } from 'lucide-react';
import ButtonLoader from '../ButtonLoader';
import ProposeMovieModal from './ProposeMovieModal';
import { useConfirm } from '../../hooks/useConfirm';
import { syncMovieFromTmdb } from '../../utils/movie';
import {
    canDeleteGroupMovie,
    deleteGroupMovie,
    fetchGroupMovies,
    getApiErrorMessage,
    proposeGroupMovie,
    sortWatchlistMovies,
} from '../../utils/groups';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

function formatYear(movie) {
    if (movie?.release_year) {
        return movie.release_year;
    }

    if (movie?.release_date) {
        return movie.release_date.slice(0, 4);
    }

    return '—';
}

function WatchlistMovieCard({
    entry,
    currentUserId,
    isAdmin,
    busy,
    onDelete,
}) {
    const movie = entry.movie;
    const tmdbId = movie?.tmdb_id;
    const canDelete = canDeleteGroupMovie(entry, currentUserId, isAdmin);

    const poster = movie?.poster_path ? (
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
    );

    const titleBlock = (
        <>
            <h3 className="font-serif text-lg leading-tight text-txt">
                {movie?.title ?? 'Película'}
            </h3>
            <p className="mt-1 text-sm text-txt-dim">{formatYear(movie)}</p>
            <p className="mt-2 text-xs text-txt-faint">
                Propuesta por {entry.proposer?.name ?? '—'}
            </p>
        </>
    );

    return (
        <article className="flex flex-col gap-4 rounded-xl border border-border-soft bg-white/2 p-4 sm:flex-row sm:items-start">
            {tmdbId ? (
                <Link to={`/movies/${tmdbId}`} className="mx-auto shrink-0 no-underline sm:mx-0">
                    {poster}
                </Link>
            ) : (
                poster
            )}

            <div className="min-w-0 flex-1">
                {tmdbId ? (
                    <Link to={`/movies/${tmdbId}`} className="no-underline text-inherit hover:opacity-90">
                        {titleBlock}
                    </Link>
                ) : (
                    titleBlock
                )}

                {canDelete ? (
                    <div className="mt-4">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onDelete(entry.movie_id)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-1.5 text-xs text-[#E66B5C] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {busy ? (
                                <ButtonLoader size={12} className="text-[#E66B5C]" />
                            ) : (
                                <Trash2 size={12} />
                            )}
                            Eliminar
                        </button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export default function GroupWatchlistSection({ groupId, currentUserId, isAdmin }) {
    const { confirm, ConfirmDialog } = useConfirm();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyMovieId, setBusyMovieId] = useState(null);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposeBusy, setProposeBusy] = useState(false);
    const [proposeError, setProposeError] = useState('');

    const loadMovies = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchGroupMovies(groupId);
            setMovies(sortWatchlistMovies(data));
        } catch (err) {
            setMovies([]);
            setError(getApiErrorMessage(err, 'No se pudieron cargar las películas.'));
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadMovies();
    }, [loadMovies]);

    const handleDelete = async (movieId) => {
        const entry = movies.find((item) => item.movie_id === movieId);

        const confirmed = await confirm({
            title: 'Eliminar película',
            message: `¿Quieres quitar "${entry?.movie?.title ?? 'esta película'}" de la watchlist grupal?`,
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setBusyMovieId(movieId);
        setError('');

        try {
            await deleteGroupMovie(groupId, movieId);
            setMovies((current) => current.filter((item) => item.movie_id !== movieId));
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo eliminar la película.'));
        } finally {
            setBusyMovieId(null);
        }
    };

    const handlePropose = async (movie) => {
        setProposeBusy(true);
        setProposeError('');

        try {
            const localMovieId = await syncMovieFromTmdb(movie.id);
            const entry = await proposeGroupMovie(groupId, localMovieId);
            setMovies((current) => sortWatchlistMovies([
                entry,
                ...current.filter((item) => item.movie_id !== entry.movie_id),
            ]));
            setShowProposeModal(false);
            setProposeError('');
        } catch (err) {
            setProposeError(getApiErrorMessage(err, 'No se pudo añadir la película.'));
        } finally {
            setProposeBusy(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-txt-dim">
                    Películas que el grupo quiere ver juntos.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        setProposeError('');
                        setShowProposeModal(true);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                    <Plus size={16} />
                    Añadir película
                </button>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="shimmer h-44 rounded-xl" />
                    ))}
                </div>
            ) : null}

            {!loading && movies.length === 0 && !error ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-soft bg-white/2">
                        <Clapperboard size={20} className="text-txt-faint" />
                    </div>
                    <p className="font-serif text-xl text-txt">La watchlist está vacía</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">
                        Añade la primera película para que el grupo pueda verla juntos.
                    </p>
                </div>
            ) : null}

            {!loading && movies.length > 0 ? (
                <div className="space-y-4">
                    {movies.map((entry) => (
                        <WatchlistMovieCard
                            key={entry.id}
                            entry={entry}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            busy={busyMovieId === entry.movie_id}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : null}

            <ProposeMovieModal
                open={showProposeModal}
                onClose={() => {
                    if (!proposeBusy) {
                        setProposeError('');
                        setShowProposeModal(false);
                    }
                }}
                onSelectMovie={handlePropose}
                loading={proposeBusy}
                submitError={proposeError}
                title="Añadir película"
                subtitle="Busca en TMDB y selecciona una película para la watchlist grupal."
                ariaLabel="Buscar película para la watchlist grupal"
            />

            <ConfirmDialog />
        </div>
    );
}
