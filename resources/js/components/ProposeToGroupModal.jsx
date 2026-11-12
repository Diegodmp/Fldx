import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import axios from 'axios';
import ButtonLoader from './ButtonLoader';
import { fetchGroups, getApiErrorMessage } from '../utils/groups';

function ListSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer h-14 rounded-lg" />
            ))}
        </div>
    );
}

function SelectableRow({ selected, onSelect, title, subtitle }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                selected
                    ? 'border-gold/40 bg-gold/10'
                    : 'border-border-soft bg-white/[0.02] hover:border-border-strong hover:bg-white/[0.04]'
            }`}
        >
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-txt">{title}</p>
                {subtitle ? (
                    <p className="mt-0.5 text-xs text-txt-dim">{subtitle}</p>
                ) : null}
            </div>
            <span
                className={`h-4 w-4 shrink-0 rounded-full border ${
                    selected ? 'border-gold bg-gold' : 'border-border-strong bg-transparent'
                }`}
                aria-hidden="true"
            />
        </button>
    );
}

export default function ProposeToGroupModal({ movie, onClose, onSuccess }) {
    const navigate = useNavigate();
    const panelRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [proposable, setProposable] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const hasProposable = proposable.length > 0;
    const listMode = hasProposable ? 'proposable' : 'groups';

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            setSelectedId(null);

            try {
                const [proposableResult, groupsResult] = await Promise.allSettled([
                    axios.get('/groups/proposable', {
                        params: { tmdb_id: movie.tmdb_id },
                    }),
                    fetchGroups(),
                ]);

                if (cancelled) {
                    return;
                }

                const proposableData = proposableResult.status === 'fulfilled'
                    ? (proposableResult.value.data ?? [])
                    : [];
                const groupsData = groupsResult.status === 'fulfilled'
                    ? (groupsResult.value ?? [])
                    : [];

                setProposable(proposableData);
                setAllGroups(groupsData);

                if (proposableResult.status === 'rejected' && groupsResult.status === 'rejected') {
                    setError('No se pudieron cargar los grupos.');
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
    }, [movie.tmdb_id]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !submitting) {
                onClose();
            }
        };

        const onPointerDown = (event) => {
            if (submitting || panelRef.current?.contains(event.target)) {
                return;
            }

            onClose();
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown, true);
        };
    }, [onClose, submitting]);

    const handlePropose = async () => {
        const entry = proposable.find((item) => item.poll_id === selectedId);

        if (!entry) {
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await axios.post(`/polls/${entry.poll_id}/movies`, {
                tmdb_id: movie.tmdb_id,
                title: movie.title,
                poster_path: movie.poster_path ?? null,
            });
            onSuccess?.(entry.group_name);
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'No se pudo enviar la propuesta.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenPoll = () => {
        const group = allGroups.find((item) => item.id === selectedId);

        if (!group) {
            return;
        }

        onClose();
        navigate(`/grupos/${group.id}`, {
            state: {
                openCreatePoll: true,
                proposeMovie: {
                    tmdb_id: movie.tmdb_id,
                    title: movie.title,
                    poster_path: movie.poster_path ?? null,
                },
            },
        });
    };

    const handleSubmit = () => {
        if (listMode === 'proposable') {
            handlePropose();
            return;
        }

        handleOpenPoll();
    };

    const submitLabel = listMode === 'proposable' ? 'Proponer' : 'Crear votación';
    const canSubmit = selectedId !== null && !loading && !submitting;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Proponer película a grupo"
            className="fixed inset-0 z-[9999]"
        >
            <div
                className="absolute inset-0 bg-[#0a0c14]/88 backdrop-blur-md"
                aria-hidden="true"
            />

            <div className="relative flex min-h-full items-start justify-center px-4 pb-8 pt-[12vh] sm:pt-[14vh]">
                <div
                    ref={panelRef}
                    className="w-full max-w-lg rounded-xl border border-border-strong bg-bg-elev p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-5"
                    style={{ borderRadius: 12 }}
                >
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-serif text-lg text-txt">Proponer a grupo</h2>
                            <p className="mt-1 text-xs text-txt-dim">
                                {movie.title}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="cursor-pointer rounded-md p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                            aria-label="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {error ? (
                        <div className="mb-4 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-2 text-sm text-[#E66B5C]">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <ListSkeleton />
                    ) : hasProposable ? (
                        <div className="space-y-2">
                            <p className="mb-3 text-sm text-txt-dim">
                                Elige una votación abierta para proponer esta película.
                            </p>
                            {proposable.map((item) => (
                                <SelectableRow
                                    key={item.poll_id}
                                    selected={selectedId === item.poll_id}
                                    onSelect={() => setSelectedId(item.poll_id)}
                                    title={item.group_name}
                                    subtitle={`${item.candidate_count} candidata${item.candidate_count === 1 ? '' : 's'} en la votación`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-txt-dim">
                                No hay votaciones en las que puedas participar. Puedes crear una
                                votación en uno de tus grupos y esta película se añadirá
                                automáticamente al crearla.
                            </p>
                            {allGroups.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-txt-faint">
                                        Selecciona un grupo para crear una nueva votación.
                                    </p>
                                    {allGroups.map((group) => (
                                        <SelectableRow
                                            key={group.id}
                                            selected={selectedId === group.id}
                                            onSelect={() => setSelectedId(group.id)}
                                            title={group.name}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-txt-faint">
                                    Aún no perteneces a ningún grupo.
                                </p>
                            )}
                        </div>
                    )}

                    {!loading && (hasProposable || allGroups.length > 0) ? (
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="cursor-pointer rounded-lg border border-border-soft px-4 py-2 text-sm text-txt-dim disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="inline-flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <ButtonLoader size={16} className="text-white" />
                                ) : (
                                    submitLabel
                                )}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body,
    );
}
