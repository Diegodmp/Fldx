import { getHue, getInitials } from '../utils/currentUser';

export default function Avatar({ user, size = 32, ring = false }) {
    if (!user) return null;

    const hue = getHue(user.email || user.name || '');
    const initials = getInitials(user.name);
    const bg = `linear-gradient(135deg, hsl(${hue} 35% 26%), hsl(${hue} 28% 14%))`;

    return (
        <div
            className="avatar-letter"
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                fontSize: size * 0.36,
                background: bg,
                boxShadow: ring
                    ? '0 0 0 2px var(--color-bg-base), 0 0 0 3px var(--color-gold)'
                    : 'none',
                flexShrink: 0,
            }}
            title={user.name}
        >
            {initials}
        </div>
    );
}
