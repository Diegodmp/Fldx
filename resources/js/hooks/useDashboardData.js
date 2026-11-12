import { useEffect, useState } from 'react';
import axios from 'axios';

const INITIAL_SECTION = { data: [], loading: true, error: null };

export function useDashboardData() {
    const [recommended, setRecommended] = useState({ ...INITIAL_SECTION });
    const [trending, setTrending] = useState({ ...INITIAL_SECTION });
    const [votes, setVotes] = useState({ ...INITIAL_SECTION });
    const [activity, setActivity] = useState({ ...INITIAL_SECTION });
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const results = await Promise.allSettled([
                axios.get('/movies/recommended'),
                axios.get('/movies/trending'),
                axios.get('/votes/active'),
                axios.get('/activity'),
                axios.get('/watchlist', { params: { per_page: 1 } }),
            ]);

            if (cancelled) {
                return;
            }

            const [recResult, trendResult, votesResult, activityResult, watchlistResult] = results;

            setRecommended({
                data: recResult.status === 'fulfilled' ? (recResult.value.data.movies ?? []) : [],
                loading: false,
                error: recResult.status === 'rejected' ? 'No se pudieron cargar las recomendaciones.' : null,
            });

            setTrending({
                data: trendResult.status === 'fulfilled' ? (trendResult.value.data.movies ?? []) : [],
                loading: false,
                error: trendResult.status === 'rejected' ? 'No se pudieron cargar las tendencias.' : null,
            });

            setVotes({
                data: votesResult.status === 'fulfilled' ? (votesResult.value.data.votes ?? []) : [],
                loading: false,
                error: votesResult.status === 'rejected' ? 'No se pudieron cargar las votaciones.' : null,
            });

            setActivity({
                data: activityResult.status === 'fulfilled' ? (activityResult.value.data.activity ?? []) : [],
                loading: false,
                error: activityResult.status === 'rejected' ? 'No se pudo cargar la actividad.' : null,
            });

            if (watchlistResult.status === 'fulfilled') {
                const payload = watchlistResult.value.data ?? {};
                setPendingCount(payload.counts?.pendiente ?? 0);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return {
        recommended,
        trending,
        votes,
        activity,
        pendingCount,
    };
}
