import { Check, Clock, Plus, Star } from 'lucide-react';

export const WATCH_CFG = {
    none: {
        label: 'Añadir a watchlist',
        Icon: Plus,
        color: 'var(--color-gold)',
        bg: 'rgba(201,168,76,0.10)',
        border: 'rgba(201,168,76,0.35)',
    },
    pendiente: {
        label: 'Pendiente',
        Icon: Clock,
        color: 'var(--color-gold)',
        bg: 'rgba(201,168,76,0.16)',
        border: 'rgba(201,168,76,0.45)',
    },
    vista: {
        label: 'Vista',
        Icon: Check,
        color: '#5CB2A8',
        bg: 'rgba(92,178,168,0.16)',
        border: 'rgba(92,178,168,0.45)',
    },
    puntuada: {
        label: 'Puntuada',
        Icon: Star,
        color: 'var(--color-gold)',
        bg: 'rgba(201,168,76,0.18)',
        border: 'rgba(201,168,76,0.50)',
    },
};

export function deriveWatchState(entry) {
    if (!entry) {
        return 'none';
    }

    if (entry.rating > 0) {
        return 'puntuada';
    }

    if (entry.status === 'watched') {
        return 'vista';
    }

    return 'pendiente';
}

export function getWatchConfig(state) {
    return WATCH_CFG[state] ?? WATCH_CFG.none;
}
