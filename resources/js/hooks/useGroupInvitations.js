import { useCallback, useEffect, useState } from 'react';
import {
    acceptInvitation,
    fetchInvitations,
    rejectInvitation,
} from '../utils/groups';

export function useGroupInvitations() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        setError('');

        try {
            const data = await fetchInvitations();
            setInvitations(data);
        } catch (err) {
            setInvitations([]);
            setError(err.response?.data?.message ?? 'No se pudieron cargar las invitaciones.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleAccept = async (id) => {
        setBusyId(id);

        try {
            await acceptInvitation(id);
            await refresh();
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id) => {
        setBusyId(id);

        try {
            await rejectInvitation(id);
            await refresh();
        } finally {
            setBusyId(null);
        }
    };

    return {
        invitations,
        loading,
        busyId,
        error,
        count: invitations.length,
        refresh,
        acceptInvitation: handleAccept,
        rejectInvitation: handleReject,
    };
}
