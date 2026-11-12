import { useCallback, useEffect, useRef, useState } from 'react';
import {
    deleteNotification,
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../utils/notifications';

const POLL_INTERVAL_MS = 30000;

export function useNotifications({ enabled = true } = {}) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        return () => {
            isMounted.current = false;
        };
    }, []);

    const applyPayload = useCallback((payload) => {
        setNotifications(payload.notifications ?? []);
        setUnreadCount(payload.unread_count ?? 0);
    }, []);

    const refresh = useCallback(async ({ silent = false } = {}) => {
        if (!enabled) {
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            const payload = await fetchNotifications();

            if (isMounted.current) {
                applyPayload(payload);
            }
        } catch {
            if (isMounted.current && !silent) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } finally {
            if (isMounted.current && !silent) {
                setLoading(false);
            }
        }
    }, [applyPayload, enabled]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        refresh();

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refresh({ silent: true });
            }
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [enabled, refresh]);

    const markAllRead = useCallback(async () => {
        setBusy(true);

        try {
            await markAllNotificationsRead();
            await refresh({ silent: true });
        } finally {
            if (isMounted.current) {
                setBusy(false);
            }
        }
    }, [refresh]);

    const markRead = useCallback(async (id) => {
        let wasUnread = false;

        setNotifications((current) => {
            const target = current.find((notification) => notification.id === id);
            wasUnread = target?.read_at == null;

            if (!target || target.read_at != null) {
                return current;
            }

            return current.map((notification) => (
                notification.id === id
                    ? { ...notification, read_at: new Date().toISOString() }
                    : notification
            ));
        });

        if (!wasUnread) {
            return;
        }

        setUnreadCount((current) => Math.max(0, current - 1));

        try {
            await markNotificationRead(id);
        } catch {
            await refresh({ silent: true });
        }
    }, [refresh]);

    const remove = useCallback(async (id) => {
        let wasUnread = false;

        setNotifications((current) => {
            const target = current.find((notification) => notification.id === id);
            wasUnread = target?.read_at == null;

            return current.filter((notification) => notification.id !== id);
        });

        if (wasUnread) {
            setUnreadCount((current) => Math.max(0, current - 1));
        }

        try {
            await deleteNotification(id);
        } catch {
            await refresh({ silent: true });
        }
    }, [refresh]);

    return {
        notifications,
        unreadCount,
        loading,
        busy,
        refresh,
        markAllRead,
        markRead,
        remove,
    };
}
