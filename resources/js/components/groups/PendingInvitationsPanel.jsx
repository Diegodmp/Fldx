import { MailOpen } from 'lucide-react';
import ButtonLoader from '../ButtonLoader';
import Avatar from '../Avatar';

export default function PendingInvitationsPanel({
    invitations = [],
    loading = false,
    busyId = null,
    onAccept,
    onReject,
    className = '',
}) {
    if (loading) {
        return (
            <section className={`rounded-xl border border-border-soft bg-white/2 p-5 ${className}`}>
                <div className="mb-4 flex items-center gap-2">
                    <div className="shimmer h-5 w-40 rounded" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="shimmer h-20 rounded-lg" />
                    ))}
                </div>
            </section>
        );
    }

    if (invitations.length === 0) {
        return null;
    }

    return (
        <section className={`rounded-xl border border-gold/20 bg-gold/5 p-5 ${className}`}>
            <div className="mb-4 flex items-center gap-2">
                <MailOpen size={18} className="text-gold" />
                <h2 className="font-serif text-xl text-txt">
                    Invitaciones pendientes
                </h2>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-semibold leading-none text-bg-base">
                    {invitations.length}
                </span>
            </div>

            <div className="space-y-3">
                {invitations.map((invitation) => {
                    const busy = busyId === invitation.id;

                    return (
                        <article
                            key={invitation.id}
                            className="flex flex-col gap-4 rounded-lg border border-border-soft bg-bg-elev/80 p-4 sm:flex-row sm:items-center"
                        >
                            <div className="min-w-0 flex-1">
                                <h3 className="font-serif text-lg text-txt">
                                    {invitation.group?.name ?? 'Grupo'}
                                </h3>
                                <p className="mt-1 text-sm text-txt-dim">
                                    Invitado por {invitation.invited_by?.name ?? invitation.invitedBy?.name ?? 'un admin'}
                                </p>
                                {invitation.group?.description && (
                                    <p className="mt-2 line-clamp-2 text-xs text-txt-faint">
                                        {invitation.group.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {invitation.invited_by && (
                                    <Avatar user={invitation.invited_by ?? invitation.invitedBy} size={32} />
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onReject(invitation.id)}
                                    className="cursor-pointer rounded-lg border border-border-soft px-3 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Rechazar
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onAccept(invitation.id)}
                                    className="inline-flex min-w-[96px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {busy ? <ButtonLoader size={14} className="text-white" /> : 'Aceptar'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
