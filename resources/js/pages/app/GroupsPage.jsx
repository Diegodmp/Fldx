import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import GroupFormModal from '../../components/groups/GroupFormModal';
import PendingInvitationsPanel from '../../components/groups/PendingInvitationsPanel';
import { useGroupInvitations } from '../../hooks/useGroupInvitations';
import { getCurrentUser } from '../../utils/currentUser';
import {
    createGroup,
    fetchGroups,
    formatGroupRole,
    getApiErrorMessage,
    getMemberRole,
    isGroupOwner,
} from '../../utils/groups';

function GroupsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer h-40 rounded-xl" />
            ))}
        </div>
    );
}

function GroupCard({ group, currentUserId }) {
    const memberCount = group.users?.length ?? 0;
    const role = getMemberRole(group, currentUserId);
    const owner = isGroupOwner(group, currentUserId);

    return (
        <Link
            to={`/grupos/${group.id}`}
            className="block h-full no-underline text-inherit"
        >
            <article className="flex h-full flex-col rounded-xl border border-border-soft bg-white/2 p-5 transition-colors hover:border-border-strong hover:bg-white/4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
                        <Users size={18} className="text-gold" />
                    </div>
                    <span className="rounded-full border border-border-soft bg-white/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-txt-dim">
                        {formatGroupRole(role, owner)}
                    </span>
                </div>

                <h2 className="font-serif text-xl leading-tight text-txt">
                    {group.name}
                </h2>

                {group.description ? (
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-txt-dim">
                        {group.description}
                    </p>
                ) : (
                    <p className="mt-2 flex-1 text-sm text-txt-faint">
                        Sin descripción
                    </p>
                )}

                <p className="mt-4 text-xs text-txt-faint">
                    {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                </p>
            </article>
        </Link>
    );
}

export default function GroupsPage() {
    const currentUser = getCurrentUser();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [createError, setCreateError] = useState('');

    const {
        invitations,
        loading: invitationsLoading,
        busyId: invitationBusyId,
        acceptInvitation,
        rejectInvitation,
        count: invitationCount,
        refresh: refreshInvitations,
    } = useGroupInvitations();

    const loadGroups = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchGroups();
            setGroups(data);
        } catch (err) {
            setGroups([]);
            setError(getApiErrorMessage(err, 'No se pudieron cargar los grupos.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const handleCreateGroup = async (payload) => {
        setCreateBusy(true);
        setCreateError('');

        try {
            await createGroup(payload);
            setShowCreateModal(false);
            await Promise.all([loadGroups(), refreshInvitations()]);
        } catch (err) {
            setCreateError(getApiErrorMessage(err, 'No se pudo crear el grupo.'));
        } finally {
            setCreateBusy(false);
        }
    };

    const handleAcceptInvitation = async (id) => {
        await acceptInvitation(id);
        await loadGroups();
    };

    return (
        <div className="page-in mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                        Comunidad
                    </p>
                    <h1 className="mt-2 font-serif text-3xl text-txt sm:text-4xl">Grupos</h1>
                    <p className="mt-2 text-sm text-txt-dim">
                        Comparte películas y descubre qué ven tus amigos.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setCreateError('');
                        setShowCreateModal(true);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                    <Plus size={16} />
                    Crear grupo
                </button>
            </div>

            <PendingInvitationsPanel
                invitations={invitations}
                loading={invitationsLoading}
                busyId={invitationBusyId}
                onAccept={handleAcceptInvitation}
                onReject={rejectInvitation}
                className="mb-8"
            />

            {error && (
                <div className="mb-6 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error}
                </div>
            )}

            {loading && <GroupsSkeleton />}

            {!loading && groups.length === 0 && !error && (
                <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-soft bg-white/2">
                        <Users size={24} className="text-txt-faint" />
                    </div>
                    <p className="font-serif text-xl text-txt">Aún no tienes grupos</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">
                        Crea uno nuevo o acepta una invitación
                        {invitationCount > 0 ? ` (${invitationCount} pendiente${invitationCount === 1 ? '' : 's'})` : ''}.
                    </p>
                </div>
            )}

            {!loading && groups.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            currentUserId={currentUser?.id}
                        />
                    ))}
                </div>
            )}

            <GroupFormModal
                open={showCreateModal}
                onClose={() => !createBusy && setShowCreateModal(false)}
                onSubmit={handleCreateGroup}
                loading={createBusy}
                title="Crear grupo"
                submitLabel="Crear"
                error={createError}
            />
        </div>
    );
}
