import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    Lock,
    Plus,
    ThumbsDown,
    ThumbsUp,
    Trash2,
    Trophy,
    X,
} from 'lucide-react';
import ButtonLoader from '../ButtonLoader';
import ProposeMovieModal from './ProposeMovieModal';
import { useConfirm } from '../../hooks/useConfirm';
import { syncMovieFromTmdb } from '../../utils/movie';
import {
    addPollCandidate,
    canDeletePollCandidate,
    canManagePoll,
    closeGroupPoll,
    deleteGroupPoll,
    fetchGroupPoll,
    formatPollDate,
    formatPollStatus,
    getApiErrorMessage,
    getPollWinner,
    removePollCandidate,
    sortPollMovies,
    userHasPollCandidate,
    votePollCandidate,
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

function PollCandidateCard({
    entry,
    isOpen,
    isWinner,
    currentUserId,
    isAdmin,
    busy,
    onVote,
    onDelete,
}) {
    const movie = entry.movie;
    const tmdbId = movie?.tmdb_id;
    const canDelete = isOpen && canDeletePollCandidate(entry, currentUserId, isAdmin);

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

    const cardClass = isWinner
        ? 'border-gold/35 bg-gold/8 ring-1 ring-gold/20'
        : 'border-border-soft bg-white/2';

    return (
        <article className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start ${cardClass}`}>
            {tmdbId ? (
                <Link to={`/movies/${tmdbId}`} className="mx-auto shrink-0 no-underline sm:mx-0">
                    {poster}
                </Link>
            ) : (
                poster
            )}

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                        {tmdbId ? (
                            <Link to={`/movies/${tmdbId}`} className="no-underline text-inherit hover:opacity-90">
                                <h3 className="font-serif text-lg leading-tight text-txt">
                                    {movie?.title ?? 'Película'}
                                </h3>
                            </Link>
                        ) : (
                            <h3 className="font-serif text-lg leading-tight text-txt">
                                {movie?.title ?? 'Película'}
                            </h3>
                        )}
                        <p className="mt-1 text-sm text-txt-dim">{formatYear(movie)}</p>
                        <p className="mt-2 text-xs text-txt-faint">
                            Añadida por {entry.adder?.name ?? '—'}
                        </p>
                    </div>

                    {isWinner ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold/12 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gold">
                            <Trophy size={12} />
                            Ganadora
                        </span>
                    ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        disabled={!isOpen || busy}
                        onClick={() => onVote(entry.movie_id, 'up')}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            entry.user_vote === 'up'
                                ? 'border-gold/45 bg-gold/12 text-gold'
                                : 'border-border-soft bg-white/2 text-txt-dim hover:border-border-strong hover:text-txt'
                        }`}
                        aria-label="Votar a favor"
                    >
                        <ThumbsUp size={15} />
                        {entry.votes_up}
                    </button>

                    <button
                        type="button"
                        disabled={!isOpen || busy}
                        onClick={() => onVote(entry.movie_id, 'down')}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            entry.user_vote === 'down'
                                ? 'border-[rgba(230,107,92,0.45)] bg-[rgba(230,107,92,0.12)] text-[#E66B5C]'
                                : 'border-border-soft bg-white/2 text-txt-dim hover:border-border-strong hover:text-txt'
                        }`}
                        aria-label="Votar en contra"
                    >
                        <ThumbsDown size={15} />
                        {entry.votes_down}
                    </button>

                    {canDelete ? (
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
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export default function PollDetailModal({
    open,
    groupId,
    pollId,
    currentUserId,
    isAdmin,
    onClose,
    onPollUpdated,
    onPollDeleted,
}) {
    const { confirm, ConfirmDialog } = useConfirm();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [busyMovieId, setBusyMovieId] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addBusy, setAddBusy] = useState(false);
    const [addError, setAddError] = useState('');

    const loadPoll = useCallback(async () => {
        if (!pollId) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await fetchGroupPoll(groupId, pollId);
            setPoll(data);
        } catch (err) {
            setPoll(null);
            setError(getApiErrorMessage(err, 'No se pudo cargar la votación.'));
        } finally {
            setLoading(false);
        }
    }, [groupId, pollId]);

    useEffect(() => {
        if (!open) {
            setPoll(null);
            setError('');
            return;
        }

        loadPoll();
    }, [open, loadPoll]);

    const isOpen = poll?.status === 'open';
    const canManage = poll ? canManagePoll(poll, currentUserId, isAdmin) : false;

    const sortedMovies = useMemo(
        () => sortPollMovies(poll?.movies ?? []),
        [poll?.movies],
    );

    const winner = useMemo(() => {
        if (isOpen || !poll?.movies?.length) {
            return null;
        }

        return getPollWinner(poll.movies);
    }, [isOpen, poll?.movies]);

    const userAlreadyAddedCandidate = useMemo(
        () => userHasPollCandidate(poll, currentUserId),
        [poll, currentUserId],
    );

    const replaceCandidate = (updated) => {
        setPoll((current) => {
            if (!current) {
                return current;
            }

            const next = {
                ...current,
                movies: sortPollMovies(
                    current.movies.map((entry) => (
                        entry.movie_id === updated.movie_id ? updated : entry
                    )),
                ),
            };

            onPollUpdated?.(next);

            return next;
        });
    };

    const handleVote = async (movieId, vote) => {
        setBusyMovieId(movieId);
        setError('');

        try {
            const updated = await votePollCandidate(groupId, pollId, movieId, vote);
            replaceCandidate(updated);
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo registrar el voto.'));
        } finally {
            setBusyMovieId(null);
        }
    };

    const handleDeleteCandidate = async (movieId) => {
        const entry = poll?.movies?.find((item) => item.movie_id === movieId);

        const confirmed = await confirm({
            title: 'Eliminar candidata',
            message: `¿Quieres quitar "${entry?.movie?.title ?? 'esta película'}" de la votación?`,
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setBusyMovieId(movieId);
        setError('');

        try {
            await removePollCandidate(groupId, pollId, movieId);
            setPoll((current) => {
                if (!current) {
                    return current;
                }

                const next = {
                    ...current,
                    movies: current.movies.filter((item) => item.movie_id !== movieId),
                    candidates_count: Math.max(0, (current.candidates_count ?? 0) - 1),
                };

                onPollUpdated?.(next);

                return next;
            });
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo eliminar la candidata.'));
        } finally {
            setBusyMovieId(null);
        }
    };

    const handleAddCandidate = async (movie) => {
        setAddBusy(true);
        setAddError('');

        try {
            const localMovieId = await syncMovieFromTmdb(movie.id);
            const entry = await addPollCandidate(groupId, pollId, localMovieId);
            setPoll((current) => {
                if (!current) {
                    return current;
                }

                const nextMovies = sortPollMovies([
                    entry,
                    ...current.movies.filter((item) => item.movie_id !== entry.movie_id),
                ]);

                const next = {
                    ...current,
                    movies: nextMovies,
                    candidates_count: nextMovies.length,
                };

                onPollUpdated?.(next);

                return next;
            });
            setShowAddModal(false);
            setAddError('');
        } catch (err) {
            setAddError(getApiErrorMessage(err, 'No se pudo añadir la candidata.'));
        } finally {
            setAddBusy(false);
        }
    };

    const handleClosePoll = async () => {
        const confirmed = await confirm({
            title: 'Cerrar votación',
            message: 'Nadie podrá votar ni modificar candidatas después de cerrarla.',
            confirmLabel: 'Cerrar votación',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setActionBusy(true);
        setError('');

        try {
            const data = await closeGroupPoll(groupId, pollId);
            setPoll(data);
            onPollUpdated?.(data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo cerrar la votación.'));
        } finally {
            setActionBusy(false);
        }
    };

    const handleDeletePoll = async () => {
        const confirmed = await confirm({
            title: 'Eliminar votación',
            message: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setActionBusy(true);
        setError('');

        try {
            await deleteGroupPoll(groupId, pollId);
            onPollDeleted?.(pollId);
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo eliminar la votación.'));
        } finally {
            setActionBusy(false);
        }
    };

    if (!open) {
        return null;
    }

    const statusClass = isOpen
        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
        : 'border-border-soft bg-white/3 text-txt-dim';
    const createdLabel = formatPollDate(poll?.created_at);

    return createPortal(
        <>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Detalle de votación"
                className="fixed inset-0 z-[9999]"
            >
                <div
                    className="absolute inset-0 bg-[#0a0c14]/88 backdrop-blur-md"
                    aria-hidden="true"
                />

                <div className="relative flex min-h-full items-start justify-center px-4 pb-8 pt-[8vh] sm:pt-[10vh]">
                    <div className="w-full max-w-2xl rounded-xl border border-border-strong bg-bg-elev p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-5">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${statusClass}`}>
                                        {poll ? formatPollStatus(poll.status) : '—'}
                                    </span>
                                </div>
                                <h2 className="font-serif text-2xl text-txt">
                                    {poll?.title ?? 'Votación'}
                                </h2>
                                {poll?.creator?.name && createdLabel ? (
                                    <p className="mt-1 text-sm text-txt-dim">
                                        Creada por {poll.creator.name} el {createdLabel}
                                    </p>
                                ) : poll?.creator?.name ? (
                                    <p className="mt-1 text-sm text-txt-dim">
                                        Creada por {poll.creator.name}
                                    </p>
                                ) : createdLabel ? (
                                    <p className="mt-1 text-sm text-txt-dim">
                                        Creada el {createdLabel}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={actionBusy || addBusy}
                                className="cursor-pointer rounded-md p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {!isOpen && winner ? (
                            <div className="mb-5 rounded-lg border border-gold/25 bg-gold/8 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                                    Resultado final
                                </p>
                                <p className="mt-1 text-sm text-txt">
                                    <span className="font-medium">{winner.movie?.title}</span>
                                    {' '}con {winner.votes_up} voto{winner.votes_up === 1 ? '' : 's'} a favor
                                </p>
                            </div>
                        ) : null}

                        {error ? (
                            <div className="mb-4 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                                {error}
                            </div>
                        ) : null}

                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-txt-dim">
                                {sortedMovies.length} candidata{sortedMovies.length === 1 ? '' : 's'}
                            </p>

                            {isOpen && !userAlreadyAddedCandidate ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAddError('');
                                        setShowAddModal(true);
                                    }}
                                    disabled={actionBusy}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <Plus size={15} />
                                    Añadir mi candidata
                                </button>
                            ) : null}
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <div key={index} className="shimmer h-44 rounded-xl" />
                                ))}
                            </div>
                        ) : null}

                        {!loading && sortedMovies.length === 0 && !error ? (
                            <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-12 text-center">
                                <p className="font-serif text-lg text-txt">Sin candidatas</p>
                                <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">
                                    {isOpen
                                        ? 'Añade películas para que el grupo pueda votar.'
                                        : 'Esta votación se cerró sin candidatas.'}
                                </p>
                            </div>
                        ) : null}

                        {!loading && sortedMovies.length > 0 ? (
                            <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
                                {sortedMovies.map((entry) => (
                                    <PollCandidateCard
                                        key={entry.id}
                                        entry={entry}
                                        isOpen={isOpen}
                                        isWinner={!isOpen && winner?.movie_id === entry.movie_id}
                                        currentUserId={currentUserId}
                                        isAdmin={isAdmin}
                                        busy={busyMovieId === entry.movie_id || actionBusy}
                                        onVote={handleVote}
                                        onDelete={handleDeleteCandidate}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {isOpen && canManage ? (
                            <div className="mt-6 flex flex-wrap gap-2 border-t border-border-soft pt-5">
                                <button
                                    type="button"
                                    disabled={actionBusy}
                                    onClick={handleClosePoll}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-white/2.5 px-4 py-2 text-sm text-txt transition-colors hover:bg-white/5 disabled:opacity-50"
                                >
                                    {actionBusy ? (
                                        <ButtonLoader size={14} />
                                    ) : (
                                        <Lock size={14} />
                                    )}
                                    Cerrar votación
                                </button>
                                <button
                                    type="button"
                                    disabled={actionBusy}
                                    onClick={handleDeletePoll}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-2 text-sm text-[#E66B5C] transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    Eliminar votación
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <ProposeMovieModal
                open={showAddModal}
                onClose={() => {
                    if (!addBusy) {
                        setAddError('');
                        setShowAddModal(false);
                    }
                }}
                onSelectMovie={handleAddCandidate}
                loading={addBusy}
                submitError={addError}
                title="Añadir mi candidata"
                subtitle="Busca en TMDB y selecciona tu película para esta votación."
                ariaLabel="Buscar mi película candidata"
            />

            <ConfirmDialog />
        </>,
        document.body,
    );
}
