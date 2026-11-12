import axios from 'axios';

export function getMemberRole(group, userId) {
    const member = group?.users?.find((user) => user.id === userId);

    return member?.pivot?.role ?? null;
}

export function isGroupOwner(group, userId) {
    return sameUserId(group?.owner_id, userId);
}

export function isGroupAdmin(group, userId) {
    return sameUserId(group?.owner_id, userId) || getMemberRole(group, userId) === 'admin';
}

export function formatGroupRole(role, isOwner = false) {
    if (isOwner) {
        return 'Propietario';
    }

    if (role === 'admin') {
        return 'Admin';
    }

    if (role === 'member') {
        return 'Miembro';
    }

    return '—';
}

export function getApiErrorMessage(error, fallback = 'Ha ocurrido un error.') {
    return error.response?.data?.message
        ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
        ?? fallback;
}

export function normalizeUserId(userId) {
    if (userId == null || userId === '') {
        return null;
    }

    const normalized = Number(userId);

    return Number.isFinite(normalized) ? normalized : null;
}

export function sameUserId(firstId, secondId) {
    const a = normalizeUserId(firstId);
    const b = normalizeUserId(secondId);

    return a !== null && b !== null && a === b;
}

export async function fetchGroups() {
    const { data } = await axios.get('/groups');

    return data;
}

export async function fetchGroup(id) {
    const { data } = await axios.get(`/groups/${id}`);

    return data;
}

export async function createGroup(payload) {
    const { data } = await axios.post('/groups', payload);

    return data;
}

export async function updateGroup(id, payload) {
    const { data } = await axios.patch(`/groups/${id}`, payload);

    return data;
}

export async function deleteGroup(id) {
    await axios.delete(`/groups/${id}`);
}

export async function leaveGroup(id) {
    await axios.delete(`/groups/${id}/leave`);
}

export async function inviteToGroup(id, payload) {
    const { data } = await axios.post(`/groups/${id}/invite`, payload);

    return data;
}

export async function updateMemberRole(groupId, userId, role) {
    const { data } = await axios.patch(`/groups/${groupId}/members/${userId}`, { role });

    return data;
}

export async function removeMember(groupId, userId) {
    const { data } = await axios.delete(`/groups/${groupId}/members/${userId}`);

    return data;
}

export async function fetchInvitations() {
    const { data } = await axios.get('/invitations');

    return data;
}

export async function acceptInvitation(id) {
    const { data } = await axios.patch(`/invitations/${id}/accept`);

    return data;
}

export async function rejectInvitation(id) {
    const { data } = await axios.patch(`/invitations/${id}/reject`);

    return data;
}

export function sortWatchlistMovies(movies) {
    return [...movies].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
}

export function sortGroupMovies(movies) {
    return [...movies].sort((a, b) => {
        if (b.votes_up !== a.votes_up) {
            return b.votes_up - a.votes_up;
        }

        if (a.votes_down !== b.votes_down) {
            return a.votes_down - b.votes_down;
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });
}

export async function fetchGroupMovies(groupId) {
    const { data } = await axios.get(`/groups/${groupId}/movies`);

    return data;
}

export async function proposeGroupMovie(groupId, movieId) {
    const { data } = await axios.post(`/groups/${groupId}/movies`, {
        movie_id: movieId,
    });

    return data;
}

export async function voteGroupMovie(groupId, movieId, vote) {
    const { data } = await axios.post(`/groups/${groupId}/movies/${movieId}/vote`, {
        vote,
    });

    return data;
}

export async function deleteGroupMovie(groupId, movieId) {
    await axios.delete(`/groups/${groupId}/movies/${movieId}`);
}

export function canDeleteGroupMovie(entry, currentUserId, isAdmin) {
    return sameUserId(entry.proposed_by, currentUserId) || isAdmin;
}

export function formatPollStatus(status) {
    return status === 'open' ? 'Abierta' : 'Cerrada';
}

export function formatPollDate(createdAt) {
    if (!createdAt) {
        return null;
    }

    const value = typeof createdAt === 'string' || typeof createdAt === 'number'
        ? createdAt
        : createdAt?.date ?? createdAt?.iso ?? null;

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function sortPollMovies(movies) {
    return [...movies].sort((a, b) => {
        if (b.votes_up !== a.votes_up) {
            return b.votes_up - a.votes_up;
        }

        if (a.votes_down !== b.votes_down) {
            return a.votes_down - b.votes_down;
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });
}

export function canManagePoll(poll, currentUserId, isAdmin) {
    return sameUserId(poll.created_by, currentUserId) || isAdmin;
}

export function canDeletePollCandidate(entry, currentUserId, isAdmin) {
    return sameUserId(entry.added_by, currentUserId)
        || sameUserId(entry.adder?.id, currentUserId)
        || isAdmin;
}

export function userHasPollCandidate(poll, currentUserId) {
    const userId = normalizeUserId(currentUserId);

    if (!poll?.movies?.length || userId === null) {
        return false;
    }

    return poll.movies.some(
        (entry) => sameUserId(entry.added_by, userId) || sameUserId(entry.adder?.id, userId),
    );
}

export function getPollWinner(movies) {
    if (!movies?.length) {
        return null;
    }

    const [top] = sortPollMovies(movies);

    return top?.votes_up > 0 ? top : null;
}

export async function fetchGroupPolls(groupId) {
    const { data } = await axios.get(`/groups/${groupId}/polls`);

    return data;
}

export async function createGroupPoll(groupId, title) {
    const { data } = await axios.post(`/groups/${groupId}/polls`, { title });

    return data;
}

export async function fetchGroupPoll(groupId, pollId) {
    const { data } = await axios.get(`/groups/${groupId}/polls/${pollId}`);

    return data;
}

export async function closeGroupPoll(groupId, pollId) {
    const { data } = await axios.patch(`/groups/${groupId}/polls/${pollId}`, {
        status: 'closed',
    });

    return data;
}

export async function deleteGroupPoll(groupId, pollId) {
    await axios.delete(`/groups/${groupId}/polls/${pollId}`);
}

export async function addPollCandidate(groupId, pollId, movieId) {
    const { data } = await axios.post(`/groups/${groupId}/polls/${pollId}/movies`, {
        movie_id: movieId,
    });

    return data;
}

export async function removePollCandidate(groupId, pollId, movieId) {
    await axios.delete(`/groups/${groupId}/polls/${pollId}/movies/${movieId}`);
}

export async function votePollCandidate(groupId, pollId, movieId, vote) {
    const { data } = await axios.post(
        `/groups/${groupId}/polls/${pollId}/movies/${movieId}/vote`,
        { vote },
    );

    return data;
}
