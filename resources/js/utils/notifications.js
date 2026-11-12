import axios from 'axios';
import {
    Check,
    Clapperboard,
    Film,
    Heart,
    Lock,
    MessageCircle,
    ThumbsUp,
    UserPlus,
    Vote,
    X,
} from 'lucide-react';

export async function fetchNotifications() {
    const { data } = await axios.get('/notifications');

    return data;
}

export async function markAllNotificationsRead() {
    await axios.patch('/notifications/read-all');
}

export async function markNotificationRead(id) {
    const { data } = await axios.patch(`/notifications/${id}/read`);

    return data;
}

export async function deleteNotification(id) {
    await axios.delete(`/notifications/${id}`);
}

export function getNotificationMessage(notification) {
    const { type, data = {} } = notification;
    const actor = data.actor_name ?? 'Alguien';
    const group = data.group_name ?? 'un grupo';
    const poll = data.poll_title ?? 'una votación';
    const movie = data.movie_title ?? 'una película';

    switch (type) {
        case 'group_invitation':
            return `${actor} te ha invitado al grupo ${group}`;
        case 'group_invitation_accepted':
            return `${actor} ha aceptado tu invitación al grupo ${group}`;
        case 'group_invitation_rejected':
            return `${actor} ha rechazado tu invitación al grupo ${group}`;
        case 'group_watchlist_movie_added':
            return `${actor} ha añadido «${movie}» a la watchlist de ${group}`;
        case 'group_poll_created':
            return `${actor} ha creado la votación «${poll}» en ${group}`;
        case 'group_poll_closed':
            return `${actor} ha cerrado la votación «${poll}» en ${group}`;
        case 'group_poll_movie_added':
            return `${actor} ha añadido «${movie}» a la votación «${poll}»`;
        case 'group_poll_voted':
            return `${actor} ha votado en la votación «${poll}» de ${group}`;
        case 'review_liked':
            return `${actor} le ha dado me gusta a tu reseña de «${movie}»`;
        case 'review_replied':
            return `${actor} ha respondido a tu reseña de «${movie}»`;
        default:
            return 'Tienes una nueva notificación';
    }
}

export function getNotificationPath(notification) {
    const { type, data = {} } = notification;

    if (type === 'group_invitation') {
        return '/grupos';
    }

    if (type === 'review_liked' || type === 'review_replied') {
        const tmdbId = data.movie_tmdb_id;

        if (tmdbId != null) {
            return `/movies/${tmdbId}`;
        }
    }

    const groupId = data.group_id;

    if (groupId != null) {
        return `/grupos/${groupId}`;
    }

    return null;
}

export function getNotificationIcon(type) {
    switch (type) {
        case 'group_invitation':
            return UserPlus;
        case 'group_invitation_accepted':
            return Check;
        case 'group_invitation_rejected':
            return X;
        case 'group_watchlist_movie_added':
            return Clapperboard;
        case 'group_poll_created':
            return Vote;
        case 'group_poll_closed':
            return Lock;
        case 'group_poll_movie_added':
            return Film;
        case 'group_poll_voted':
            return ThumbsUp;
        case 'review_liked':
            return Heart;
        case 'review_replied':
            return MessageCircle;
        default:
            return Vote;
    }
}

export function formatRelativeTime(isoDate) {
    if (!isoDate) {
        return '';
    }

    const date = new Date(isoDate);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(diffMs)) {
        return '';
    }

    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Hace un momento';
    }

    if (diffMinutes < 60) {
        return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
        return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 7) {
        return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
    }

    return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}
