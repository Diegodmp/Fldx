import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Crown,
    LogOut,
    Pencil,
    Shield,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import GroupFormModal from '../../components/groups/GroupFormModal';
import InviteMemberModal from '../../components/groups/InviteMemberModal';
import GroupContentTabs from '../../components/groups/GroupContentTabs';
import ButtonLoader from '../../components/ButtonLoader';
import { useConfirm } from '../../hooks/useConfirm';
import { getCurrentUser } from '../../utils/currentUser';
import { setPageTitle } from '../../utils/pageTitle';
import {
    deleteGroup,
    fetchGroup,
    formatGroupRole,
    getApiErrorMessage,
    inviteToGroup,
    isGroupAdmin,
    isGroupOwner,
    leaveGroup,
    removeMember,
    updateGroup,
    updateMemberRole,
} from '../../utils/groups';

function DetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="shimmer h-32 rounded-xl" />
            <div className="shimmer h-64 rounded-xl" />
        </div>
    );
}

function MemberRow({
    member,
    group,
    currentUserId,
    isAdmin,
    busy,
    onRoleChange,
    onRemove,
}) {
    const owner = isGroupOwner(group, member.id);
    const role = member.pivot?.role ?? 'member';
    const canManage = isAdmin && !owner && member.id !== currentUserId;

    return (
        <article className="flex flex-col gap-4 rounded-lg border border-border-soft bg-white/2 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar user={member} size={40} />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-txt">{member.name}</p>
                        {owner && <Crown size={14} className="shrink-0 text-gold" />}
                    </div>
                    <p className="truncate text-xs text-txt-faint">{member.email}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="rounded-full border border-border-soft bg-white/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-txt-dim">
                    {formatGroupRole(role, owner)}
                </span>

                {canManage && (
                    <>
                        <select
                            value={role}
                            disabled={busy}
                            onChange={(event) => onRoleChange(member.id, event.target.value)}
                            className="cursor-pointer rounded-lg border border-border-soft bg-white/2.5 px-3 py-1.5 text-xs text-txt outline-none focus:border-gold/35 disabled:opacity-50"
                        >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                        </select>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRemove(member.id)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-1.5 text-xs text-[#E66B5C] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {busy ? <ButtonLoader size={12} className="text-[#E66B5C]" /> : <Trash2 size={12} />}
                            Expulsar
                        </button>
                    </>
                )}
            </div>
        </article>
    );
}

export default function GroupDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const { confirm, ConfirmDialog } = useConfirm();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [memberBusyId, setMemberBusyId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [actionError, setActionError] = useState('');
    const [createPollFlow] = useState(() => ({
        open: location.state?.openCreatePoll === true,
        movie: location.state?.proposeMovie ?? null,
    }));

    const loadGroup = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchGroup(id);
            setGroup(data);
        } catch (err) {
            setGroup(null);
            setError(getApiErrorMessage(err, 'No se pudo cargar el grupo.'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadGroup();
    }, [loadGroup]);

    useEffect(() => {
        if (group?.name) {
            setPageTitle(group.name);
        }
    }, [group?.name]);

    useEffect(() => {
        if (!createPollFlow.open) {
            return;
        }

        navigate(location.pathname, { replace: true, state: {} });
    }, [createPollFlow.open, navigate, location.pathname]);

    const userIsAdmin = group && currentUser ? isGroupAdmin(group, currentUser.id) : false;
    const userIsOwner = group && currentUser ? isGroupOwner(group, currentUser.id) : false;

    const handleUpdateGroup = async (payload) => {
        setBusy(true);
        setActionError('');

        try {
            const data = await updateGroup(id, payload);
            setGroup(data);
            setShowEditModal(false);
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo actualizar el grupo.'));
        } finally {
            setBusy(false);
        }
    };

    const handleInvite = async (payload) => {
        setBusy(true);
        setActionError('');

        try {
            await inviteToGroup(id, payload);
            setShowInviteModal(false);
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo enviar la invitación.'));
        } finally {
            setBusy(false);
        }
    };

    const handleRoleChange = async (userId, role) => {
        setMemberBusyId(userId);
        setActionError('');

        try {
            const data = await updateMemberRole(id, userId, role);
            setGroup(data);
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo cambiar el rol.'));
        } finally {
            setMemberBusyId(null);
        }
    };

    const handleRemoveMember = async (userId) => {
        const member = group?.users?.find((user) => user.id === userId);

        const confirmed = await confirm({
            title: 'Expulsar miembro',
            message: `¿Quieres expulsar a ${member?.name ?? 'este miembro'} del grupo?`,
            confirmLabel: 'Expulsar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setMemberBusyId(userId);
        setActionError('');

        try {
            const data = await removeMember(id, userId);
            setGroup(data);
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo expulsar al miembro.'));
        } finally {
            setMemberBusyId(null);
        }
    };

    const handleLeave = async () => {
        const confirmed = await confirm({
            title: 'Abandonar grupo',
            message: '¿Seguro que quieres abandonar este grupo?',
            confirmLabel: 'Abandonar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setBusy(true);
        setActionError('');

        try {
            await leaveGroup(id);
            navigate('/grupos');
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo abandonar el grupo.'));
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Eliminar grupo',
            message: 'Esta acción no se puede deshacer. Se eliminarán todos los miembros e invitaciones.',
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setBusy(true);
        setActionError('');

        try {
            await deleteGroup(id);
            navigate('/grupos');
        } catch (err) {
            setActionError(getApiErrorMessage(err, 'No se pudo eliminar el grupo.'));
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="page-in mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <DetailSkeleton />
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="page-in mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <Link
                    to="/grupos"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-txt-dim no-underline transition-colors hover:text-txt"
                >
                    <ArrowLeft size={16} />
                    Volver a grupos
                </Link>
                <div className="rounded-xl border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {error || 'Grupo no encontrado.'}
                </div>
            </div>
        );
    }

    return (
        <div className="page-in mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <Link
                to="/grupos"
                className="mb-6 inline-flex items-center gap-2 text-sm text-txt-dim no-underline transition-colors hover:text-txt"
            >
                <ArrowLeft size={16} />
                Volver a grupos
            </Link>

            <header className="mb-8 rounded-xl border border-border-soft bg-white/2 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
                            <Users size={20} className="text-gold" />
                        </div>
                        <h1 className="font-serif text-3xl text-txt">{group.name}</h1>
                        <p className="mt-2 text-sm leading-relaxed text-txt-dim">
                            {group.description || 'Sin descripción'}
                        </p>
                        <p className="mt-3 text-xs text-txt-faint">
                            {group.users?.length ?? 0} miembros · Propietario: {group.owner?.name ?? '—'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {userIsAdmin && (
                            <>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                        setActionError('');
                                        setShowEditModal(true);
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-white/2.5 px-3 py-2 text-sm text-txt transition-colors hover:bg-white/5 disabled:opacity-50"
                                >
                                    <Pencil size={14} />
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                        setActionError('');
                                        setShowInviteModal(true);
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    <UserPlus size={14} />
                                    Invitar
                                </button>
                            </>
                        )}
                        {!userIsOwner && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={handleLeave}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-white/2.5 px-3 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                            >
                                <LogOut size={14} />
                                Abandonar
                            </button>
                        )}
                        {userIsOwner && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={handleDelete}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-2 text-sm text-[#E66B5C] transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                Eliminar grupo
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {actionError && (
                <div className="mb-6 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-4 py-3 text-sm text-[#E66B5C]">
                    {actionError}
                </div>
            )}

            <section>
                <div className="mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-gold" />
                    <h2 className="font-serif text-2xl text-txt">Miembros</h2>
                </div>

                <div className="space-y-3">
                    {group.users?.map((member) => (
                        <MemberRow
                            key={member.id}
                            member={member}
                            group={group}
                            currentUserId={currentUser?.id}
                            isAdmin={userIsAdmin}
                            busy={memberBusyId === member.id}
                            onRoleChange={handleRoleChange}
                            onRemove={handleRemoveMember}
                        />
                    ))}
                </div>
            </section>

            <GroupContentTabs
                groupId={Number(id)}
                currentUserId={currentUser?.id != null ? Number(currentUser.id) : null}
                isAdmin={userIsAdmin}
                openCreatePollOnMount={createPollFlow.open}
                proposeMovieOnCreate={createPollFlow.movie}
            />

            <GroupFormModal
                open={showEditModal}
                onClose={() => !busy && setShowEditModal(false)}
                onSubmit={handleUpdateGroup}
                loading={busy}
                title="Editar grupo"
                submitLabel="Guardar"
                initialValues={{
                    name: group.name,
                    description: group.description ?? '',
                }}
                error={actionError}
            />

            <InviteMemberModal
                open={showInviteModal}
                onClose={() => !busy && setShowInviteModal(false)}
                onSubmit={handleInvite}
                loading={busy}
            />

            <ConfirmDialog />
        </div>
    );
}
