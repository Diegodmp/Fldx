import { useEffect, useState } from 'react';
import {
    Bookmark,
    ChevronLeft,
    ChevronRight,
    Compass,
    Film,
    Home,
    User,
    Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useGroupInvitations } from '../hooks/useGroupInvitations';
import { getCurrentUser, getJoinedYear } from '../utils/currentUser';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Inicio', path: '/', Icon: Home },
    { id: 'filmdex', label: 'Buscar', path: '/filmdex', Icon: Compass },
    { id: 'watchlist', label: 'Watchlist', path: '/watchlist', Icon: Bookmark },
    { id: 'groups', label: 'Grupos', path: '/grupos', Icon: Users, showInvitationBadge: true },
    { id: 'profile', label: 'Perfil', path: '/profile', Icon: User },
];

function isActive(pathname, itemPath) {
    if (itemPath === '/') {
        return pathname === '/';
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function Sidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = getCurrentUser();
    const joinedYear = getJoinedYear(user?.created_at);
    const { count: invitationCount } = useGroupInvitations();

    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar:collapsed') === 'true';
    });
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(max-width: 767px)').matches;
    });

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');

        const syncMobile = () => {
            setIsMobile(media.matches);
        };

        syncMobile();
        media.addEventListener('change', syncMobile);

        return () => media.removeEventListener('change', syncMobile);
    }, []);

    const toggleCollapsed = () => {
        if (isMobile) {
            return;
        }

        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebar:collapsed', String(next));
            return next;
        });
    };

    const isCollapsed = isMobile || collapsed;
    const width = isCollapsed ? 64 : 220;

    return (
        <aside
            className="app-sidebar flex h-screen shrink-0 flex-col"
            style={{
                width,
                background: 'rgba(10,12,20,0.6)',
                borderRight: '1px solid var(--color-border-soft)',
                transition: 'width .25s cubic-bezier(.4,0,.2,1)',
                position: 'relative',
                zIndex: 10,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: isCollapsed ? '20px 0' : '20px 22px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderBottom: '1px solid var(--color-border-soft)',
                    height: 64,
                }}
            >
                {/* TODO: replace with Filmdex logo */}
                <div
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #5a0f0f 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 12px rgba(139,26,26,0.4)',
                        flexShrink: 0,
                    }}
                >
                    <Film size={15} color="#fff" />
                </div>
                {!isCollapsed && (
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, letterSpacing: -0.01 }}>
                        Filmdex
                    </div>
                )}
            </div>

            <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NAV_ITEMS.map((item) => {
                    const active = isActive(pathname, item.path);
                    const Icon = item.Icon;
                    const badgeCount = item.showInvitationBadge ? invitationCount : 0;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate(item.path)}
                            aria-label={item.label}
                            className={`has-tt ${active ? 'nav-active' : ''}`}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: isCollapsed ? '10px 0' : '9px 12px',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                background: active ? 'rgba(201,168,76,0.06)' : 'transparent',
                                border: '1px solid',
                                borderColor: active ? 'rgba(201,168,76,0.18)' : 'transparent',
                                color: active ? 'var(--color-txt)' : 'var(--color-txt-dim)',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background .15s, color .15s',
                                textAlign: 'left',
                                width: '100%',
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.color = 'var(--color-txt)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-txt-dim)';
                                }
                            }}
                        >
                            <span style={{ position: 'relative', display: 'inline-flex' }}>
                                <Icon size={17} color={active ? 'var(--color-gold)' : 'currentColor'} />
                                {badgeCount > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: isCollapsed ? -4 : -6,
                                            minWidth: 16,
                                            height: 16,
                                            padding: '0 4px',
                                            borderRadius: 999,
                                            background: 'var(--color-gold)',
                                            color: 'var(--color-bg-base)',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            lineHeight: '16px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {badgeCount}
                                    </span>
                                )}
                            </span>
                            {!isCollapsed && <span>{item.label}</span>}
                            {isCollapsed && (
                                <span className="tooltip">
                                    {item.label}
                                    {badgeCount > 0 ? ` (${badgeCount})` : ''}
                                </span>
                            )}
                        </button>
                    );
                })}

                <div style={{ flex: 1 }} />

                {!isMobile ? (
                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        className="has-tt"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            padding: isCollapsed ? '10px 0' : '9px 12px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--color-txt-faint)',
                            borderRadius: 6,
                            fontSize: 12.5,
                            gap: 12,
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: 8,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        {!isCollapsed && <span>Colapsar</span>}
                        {isCollapsed && <span className="tooltip">Expandir</span>}
                    </button>
                ) : null}
            </nav>

            <div
                style={{
                    padding: isCollapsed ? '12px 0' : '12px',
                    borderTop: '1px solid var(--color-border-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                }}
            >
                <Avatar user={user} size={isCollapsed ? 30 : 34} />
                {!isCollapsed && user && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 12.5,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {user.name}
                        </div>
                        {joinedYear && (
                            <div style={{ fontSize: 10.5, color: 'var(--color-txt-faint)' }}>
                                desde {joinedYear}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
