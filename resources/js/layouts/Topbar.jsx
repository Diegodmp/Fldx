import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    Bell,
    Bookmark,
    ChevronDown,
    Edit,
    LogOut,
    Search,
    Settings,
    User,
    Users,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../components/Avatar';
import MobileSearchModal from '../components/MobileSearchModal';
import MovieSearchField from '../components/MovieSearchField';
import NotificationDropdown from '../components/NotificationDropdown';
import ReviewFormModal from '../components/ReviewFormModal';
import ReviewMovieSearchModal from '../components/ReviewMovieSearchModal';
import { useMovieSearch } from '../hooks/useMovieSearch';
import { useNotifications } from '../hooks/useNotifications';
import { clearSession, getCurrentUser } from '../utils/currentUser';
import { syncMovieFromTmdb } from '../utils/movie';
import { getNotificationPath } from '../utils/notifications';

function UserDropdown({ user, onNavigate, onLogout }) {
    const menuItems = [
        { label: 'Mi perfil', Icon: User, path: '/profile' },
        { label: 'Watchlist', Icon: Bookmark, path: '/watchlist' },
        { label: 'Mis grupos', Icon: Users, path: '/grupos' },
        { label: 'Ajustes', Icon: Settings },
    ];

    return (
        <div
            style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                background: 'rgba(20,24,38,0.92)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
                zIndex: 100,
            }}
        >
            <div
                style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--color-border-soft)',
                }}
            >
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-txt-faint)' }}>{user?.email}</div>
            </div>
            {menuItems.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => item.path && onNavigate(item.path)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '9px 14px',
                        color: 'var(--color-txt-dim)',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'var(--color-txt)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-txt-dim)';
                    }}
                >
                    <item.Icon size={14} />
                    {item.label}
                </button>
            ))}
            <button
                type="button"
                onClick={onLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid var(--color-border-soft)',
                    padding: '10px 14px',
                    color: '#E66B5C',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(230,107,92,0.06)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <LogOut size={14} />
                Cerrar sesión
            </button>
        </div>
    );
}

export default function Topbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getCurrentUser();
    const [showNotifs, setShowNotifs] = useState(false);
    const [showUser, setShowUser] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [showReviewSearch, setShowReviewSearch] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewMovie, setReviewMovie] = useState(null);
    const [reviewBusy, setReviewBusy] = useState(false);

    const notifRef = useRef(null);
    const userRef = useRef(null);
    const searchRef = useRef(null);
    const {
        input: searchQuery,
        loading: searchLoading,
        error: searchError,
        trimmedInput,
        isPendingSearch,
        suggestions,
        handleInputChange,
        commitSearch,
        reset: resetSearch,
    } = useMovieSearch('');
    const {
        notifications,
        unreadCount,
        loading: notificationsLoading,
        busy: notificationsBusy,
        refresh: refreshNotifications,
        markAllRead,
        markRead,
        remove: removeNotification,
    } = useNotifications();

    useEffect(() => {
        if (showNotifs) {
            refreshNotifications({ silent: true });
        }
    }, [showNotifs, refreshNotifications]);

    useEffect(() => {
        const close = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
            if (userRef.current && !userRef.current.contains(e.target)) {
                setShowUser(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchSuggestions(false);
            }
        };

        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => {
        setShowMobileSearch(false);
        setShowReviewSearch(false);
        setShowReviewModal(false);
        setShowSearchSuggestions(false);
        setReviewMovie(null);
        resetSearch();
    }, [location.pathname, resetSearch]);

    const closeMobileSearch = () => setShowMobileSearch(false);

    const closeDesktopSearch = () => {
        setShowSearchSuggestions(false);
    };

    const handleSearchSubmit = () => {
        if (!commitSearch()) {
            setShowSearchSuggestions(true);
            return;
        }

        navigate(`/filmdex?q=${encodeURIComponent(trimmedInput)}`);
        closeDesktopSearch();
    };

    const openReviewFlow = () => {
        closeMobileSearch();
        closeDesktopSearch();
        setShowNotifs(false);
        setShowUser(false);
        setShowReviewSearch(true);
    };

    const handleReviewMovieSelect = (movie) => {
        setReviewMovie(movie);
        setShowReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        if (reviewBusy) {
            return;
        }

        setShowReviewModal(false);
        setReviewMovie(null);
    };

    const handlePublishReview = async (payload) => {
        if (!reviewMovie) {
            return;
        }

        setReviewBusy(true);

        try {
            const movieId = await syncMovieFromTmdb(reviewMovie.id);
            await axios.post(`/movies/${movieId}/reviews`, payload);
            setShowReviewModal(false);
            setReviewMovie(null);
            navigate(`/movies/${reviewMovie.id}`);
        } finally {
            setReviewBusy(false);
        }
    };

    const handleSearchSuggestionClick = () => {
        closeDesktopSearch();
        resetSearch();
    };

    const handleLogout = async () => {
        try {
            await axios.post('/logout');
        } catch {
            // Si el token ya expiró, igualmente cerramos sesión en cliente
        } finally {
            clearSession();
            navigate('/login');
        }
    };

    const handleNotificationOpen = async (notification) => {
        if (notification.read_at == null) {
            try {
                await markRead(notification.id);
            } catch {
                // La navegación sigue aunque falle marcar como leída
            }
        }

        const path = getNotificationPath(notification);
        setShowNotifs(false);

        if (path) {
            navigate(path);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await removeNotification(id);
        } catch {
            // Ignorar errores de eliminación en UI
        }
    };

    return (
        <>
        <header
            className="sticky top-0 z-[9] flex h-16 shrink-0 items-center gap-3 border-b border-border-soft bg-[rgba(13,15,26,0.7)] px-4 backdrop-blur-[20px] sm:gap-4 sm:px-6 md:gap-6 md:px-7"
        >
            <button
                type="button"
                onClick={() => setShowMobileSearch(true)}
                aria-label="Buscar películas"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-soft bg-white/[0.025] text-txt-dim transition-colors hover:border-border-strong hover:bg-white/5 hover:text-txt md:hidden"
            >
                <Search size={18} />
            </button>

            <div ref={searchRef} className="relative z-[20] hidden max-w-[520px] flex-1 md:block">
                <MovieSearchField
                    input={searchQuery}
                    onInputChange={(value) => {
                        handleInputChange(value);
                        setShowSearchSuggestions(true);
                    }}
                    onSubmit={handleSearchSubmit}
                    loading={searchLoading}
                    error={searchError}
                    suggestions={suggestions}
                    showSuggestions={showSearchSuggestions}
                    suggestionsBusy={isPendingSearch || searchLoading}
                    onSuggestionClick={handleSearchSuggestionClick}
                    onFocus={() => setShowSearchSuggestions(true)}
                    placeholder="Buscar películas, directores, géneros…"
                    showSubmitButton={false}
                    className="w-full"
                    suggestionsClassName="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] mt-0"
                />
            </div>

            <div className="hidden flex-1 md:block" />
            <div className="flex-1 md:hidden" />

            <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => {
                        closeMobileSearch();
                        closeDesktopSearch();
                        setShowNotifs((s) => !s);
                        setShowUser(false);
                    }}
                    style={{
                        position: 'relative',
                        background: showNotifs ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: '1px solid',
                        borderColor: showNotifs ? 'var(--color-border-strong)' : 'transparent',
                        color: 'var(--color-txt-dim)',
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Bell size={17} />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E66B5C] px-1 text-[10px] font-semibold leading-none text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    ) : null}
                </button>

                {showNotifs ? (
                    <NotificationDropdown
                        notifications={notifications}
                        loading={notificationsLoading}
                        busy={notificationsBusy}
                        onMarkAllRead={markAllRead}
                        onOpen={handleNotificationOpen}
                        onDelete={handleDeleteNotification}
                    />
                ) : null}
            </div>

            <div ref={userRef} style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => {
                        closeMobileSearch();
                        closeDesktopSearch();
                        setShowUser((s) => !s);
                        setShowNotifs(false);
                    }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: showUser ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: '1px solid',
                        borderColor: showUser ? 'var(--color-border-strong)' : 'transparent',
                        padding: '3px 10px 3px 3px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        color: 'var(--color-txt)',
                    }}
                >
                    <Avatar user={user} size={28} />
                    <ChevronDown size={13} color="var(--color-txt-faint)" />
                </button>
                {showUser && (
                    <UserDropdown
                        user={user}
                        onNavigate={(path) => {
                            navigate(path);
                            setShowUser(false);
                        }}
                        onLogout={handleLogout}
                    />
                )}
            </div>
        </header>

        <MobileSearchModal
            open={showMobileSearch}
            onClose={closeMobileSearch}
        />

        <ReviewMovieSearchModal
            open={showReviewSearch}
            onClose={() => setShowReviewSearch(false)}
            onSelectMovie={handleReviewMovieSelect}
        />

        <ReviewFormModal
            open={showReviewModal}
            onClose={handleCloseReviewModal}
            onSubmit={handlePublishReview}
            loading={reviewBusy}
            movieTitle={reviewMovie?.title ?? ''}
        />
        </>
    );
}
