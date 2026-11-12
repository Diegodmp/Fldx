export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export function getInitials(name = '') {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function getHue(seed = '') {
    let h = 0;
    for (const c of seed) {
        h = (h * 31 + c.charCodeAt(0)) >>> 0;
    }
    return h % 360;
}

export function getJoinedYear(createdAt) {
    if (!createdAt) return null;
    const y = new Date(createdAt).getFullYear();
    return Number.isFinite(y) ? y : null;
}
