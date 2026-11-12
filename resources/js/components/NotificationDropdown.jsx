import { X } from 'lucide-react';
import ButtonLoader from './ButtonLoader';
import {
    formatRelativeTime,
    getNotificationIcon,
    getNotificationMessage,
} from '../utils/notifications';

function NotificationItem({ notification, onOpen, onDelete }) {
    const isUnread = notification.read_at == null;
    const Icon = getNotificationIcon(notification.type);

    return (
        <div
            className={`group relative flex gap-3 border-b border-border-soft px-4 py-3 transition-colors last:border-b-0 ${
                isUnread ? 'bg-white/[0.04]' : 'bg-transparent hover:bg-white/[0.02]'
            }`}
        >
            <button
                type="button"
                onClick={() => onOpen(notification)}
                className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-none bg-transparent p-0 text-left"
            >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                    <Icon size={15} />
                </div>

                <div className="min-w-0 flex-1">
                    <p className={`text-[12.5px] leading-snug ${isUnread ? 'text-txt' : 'text-txt-dim'}`}>
                        {getNotificationMessage(notification)}
                    </p>
                    <p className="mt-1 text-[11px] text-txt-faint">
                        {formatRelativeTime(notification.created_at)}
                    </p>
                </div>

                {isUnread ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                ) : null}
            </button>

            <button
                type="button"
                aria-label="Eliminar notificación"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete(notification.id);
                }}
                className="mt-0.5 shrink-0 cursor-pointer rounded-md p-1 text-txt-faint opacity-0 transition-opacity hover:bg-white/5 hover:text-txt group-hover:opacity-100"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function NotificationDropdown({
    notifications,
    loading,
    busy,
    onMarkAllRead,
    onOpen,
    onDelete,
}) {
    const hasUnread = notifications.some((notification) => notification.read_at == null);

    return (
        <div
            className="notification-dropdown z-[100] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-border-strong bg-[rgba(20,24,38,0.92)] shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px] backdrop-saturate-[140%]"
        >
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
                <div className="text-[13px] font-semibold text-txt">Notificaciones</div>
                {hasUnread ? (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onMarkAllRead}
                        className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-[11.5px] text-gold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? <ButtonLoader size={12} className="text-gold" /> : null}
                        Marcar todas como leídas
                    </button>
                ) : null}
            </div>

            <div className="max-h-[min(420px,60vh)] overflow-y-auto">
                {loading ? (
                    <div className="space-y-0">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="border-b border-border-soft px-4 py-3 last:border-b-0">
                                <div className="shimmer h-12 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : null}

                {!loading && notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[12.5px] text-txt-dim">
                        Aún no tienes notificaciones.
                    </div>
                ) : null}

                {!loading && notifications.length > 0
                    ? notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onOpen={onOpen}
                            onDelete={onDelete}
                        />
                    ))
                    : null}
            </div>
        </div>
    );
}
