import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronRight, Plus, Vote } from 'lucide-react';
import CreatePollModal from './CreatePollModal';
import PollDetailModal from './PollDetailModal';
import {
    createGroupPoll,
    fetchGroupPolls,
    formatPollDate,
    formatPollStatus,
    getApiErrorMessage,
} from '../../utils/groups';

function PollListItem({ poll, onOpen }) {
    const isOpen = poll.status === 'open';
    const statusClass = isOpen
        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
        : 'border-border-soft bg-white/3 text-txt-dim';
    const createdLabel = formatPollDate(poll.created_at);

    return (
        <button
            type="button"
            onClick={() => onOpen(poll.id)}
            className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border-soft bg-white/2 p-4 text-left transition-colors hover:border-border-strong hover:bg-white/3"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
                <Vote size={18} className="text-gold" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-serif text-lg text-txt">{poll.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusClass}`}>
                        {formatPollStatus(poll.status)}
                    </span>
                </div>
                <p className="mt-1 text-sm text-txt-dim">
                    {poll.candidates_count ?? 0} candidata{(poll.candidates_count ?? 0) === 1 ? '' : 's'}
                    {' · '}
                    {poll.votes_count ?? 0} voto{(poll.votes_count ?? 0) === 1 ? '' : 's'}
                </p>
                {createdLabel ? (
                    <p className="mt-1 text-xs text-txt-faint">
                        Creada el {createdLabel}
                    </p>
                ) : null}
            </div>

            <ChevronRight size={18} className="shrink-0 text-txt-faint" />
        </button>
    );
}

export default function GroupPollsSection({
    groupId,
    currentUserId,
    isAdmin,
    openCreatePollOnMount = false,
    proposeMovieOnCreate = null,
}) {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [createError, setCreateError] = useState('');
    const [selectedPollId, setSelectedPollId] = useState(null);

    const loadPolls = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchGroupPolls(groupId);
            setPolls(data);
        } catch (err) {
            setPolls([]);
            setError(getApiErrorMessage(err, 'No se pudieron cargar las votaciones.'));
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadPolls();
    }, [loadPolls]);

    useEffect(() => {
        if (openCreatePollOnMount) {
            setCreateError('');
            setShowCreateModal(true);
        }
    }, [openCreatePollOnMount]);

    const handleCreatePoll = async (title) => {
        setCreateBusy(true);
        setCreateError('');

        try {
            const poll = await createGroupPoll(groupId, title);

            if (proposeMovieOnCreate?.tmdb_id) {
                await axios.post(`/polls/${poll.id}/movies`, {
                    tmdb_id: proposeMovieOnCreate.tmdb_id,
                    title: proposeMovieOnCreate.title,
                    poster_path: proposeMovieOnCreate.poster_path ?? null,
                });
            }

            setPolls((current) => [
                {
                    ...poll,
                    candidates_count: proposeMovieOnCreate?.tmdb_id
                        ? Math.max(poll.candidates_count ?? 0, 1)
                        : poll.candidates_count,
                },
                ...current,
            ]);
            setShowCreateModal(false);
            setSelectedPollId(poll.id);
        } catch (err) {
            setCreateError(getApiErrorMessage(err, 'No se pudo crear la votación.'));
        } finally {
            setCreateBusy(false);
        }
    };

    const handlePollUpdated = (updatedPoll) => {
        const votesCount = updatedPoll.movies?.reduce(
            (total, entry) => total + (entry.votes_up ?? 0) + (entry.votes_down ?? 0),
            0,
        ) ?? updatedPoll.votes_count;

        setPolls((current) => current.map((poll) => (
            poll.id === updatedPoll.id
                ? {
                    ...poll,
                    status: updatedPoll.status,
                    title: updatedPoll.title,
                    candidates_count: updatedPoll.candidates_count
                        ?? updatedPoll.movies?.length
                        ?? poll.candidates_count,
                    votes_count: votesCount ?? poll.votes_count,
                }
                : poll
        )));
    };

    const handlePollDeleted = (pollId) => {
        setPolls((current) => current.filter((poll) => poll.id !== pollId));
        setSelectedPollId(null);
    };

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-txt-dim">
                    Crea votaciones para decidir qué película ver el grupo.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        setCreateError('');
                        setShowCreateModal(true);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                    <Plus size={16} />
                    Nueva votación
                </button>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="shimmer h-20 rounded-xl" />
                    ))}
                </div>
            ) : null}

            {!loading && polls.length === 0 && !error ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-soft bg-white/2">
                        <Vote size={20} className="text-txt-faint" />
                    </div>
                    <p className="font-serif text-xl text-txt">No hay votaciones</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">
                        Crea la primera votación para que el grupo elija qué película ver.
                    </p>
                </div>
            ) : null}

            {!loading && polls.length > 0 ? (
                <div className="space-y-3">
                    {polls.map((poll) => (
                        <PollListItem
                            key={poll.id}
                            poll={poll}
                            onOpen={setSelectedPollId}
                        />
                    ))}
                </div>
            ) : null}

            <CreatePollModal
                open={showCreateModal}
                onClose={() => !createBusy && setShowCreateModal(false)}
                onSubmit={handleCreatePoll}
                loading={createBusy}
                error={createError}
            />

            <PollDetailModal
                open={selectedPollId !== null}
                groupId={groupId}
                pollId={selectedPollId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onClose={() => setSelectedPollId(null)}
                onPollUpdated={handlePollUpdated}
                onPollDeleted={handlePollDeleted}
            />
        </div>
    );
}
