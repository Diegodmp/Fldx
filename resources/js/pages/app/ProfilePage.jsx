import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Clock, Edit, Eye, Film, Flame, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StarRating from '../../components/StarRating';
import {
    clearSession,
    getCurrentUser,
    getHue,
    getInitials,
} from '../../utils/currentUser';
import {
    fetchGroups,
    formatGroupRole,
    getApiErrorMessage,
    getMemberRole,
    isGroupOwner,
} from '../../utils/groups';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';
const POSTER_THUMB = 'https://image.tmdb.org/t/p/w92';

const STAT_CARD_CONFIG = [
    { key: 'peliculas_vistas', Icon: Film, label: 'Películas vistas', accent: 'var(--color-gold)' },
    { key: 'horas_totales', Icon: Clock, label: 'Horas totales', accent: '#6B8FE0' },
    { key: 'racha_actual', Icon: Flame, label: 'Racha actual', accent: '#E66B5C' },
    { key: 'resenas', Icon: Edit, label: 'Reseñas', accent: '#5CB2A8' },
];

function formatJoined(createdAt) {
    if (!createdAt) {
        return null;
    }

    try {
        const label = new Intl.DateTimeFormat('es', {
            month: 'long',
            year: 'numeric',
        }).format(new Date(createdAt));

        return `Desde ${label}`;
    } catch {
        return null;
    }
}

function formatStreak(weeks) {
    if (!weeks) {
        return '0 semanas';
    }

    if (weeks === 1) {
        return '1 semana';
    }

    return `${weeks} semanas`;
}

function formatActivityDate(isoDate) {
    try {
        return new Intl.DateTimeFormat('es', {
            day: 'numeric',
            month: 'short',
        }).format(new Date(isoDate));
    } catch {
        return '';
    }
}

function formatStatValue(key, stats) {
    if (!stats) {
        return '—';
    }

    switch (key) {
        case 'horas_totales':
            return `${stats.horas_totales}h`;
        case 'racha_actual':
            return formatStreak(stats.racha_actual);
        default:
            return stats[key] ?? 0;
    }
}

function Stat({ label, value }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    color: 'var(--color-txt)',
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: 10.5,
                    color: 'var(--color-txt-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.1,
                    marginTop: 4,
                }}
            >
                {label}
            </div>
        </div>
    );
}

function StatCard({ Icon, label, value, accent, loading = false }) {
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
            }}
        >
            <div
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    background: `${accent}1A`,
                    border: `1px solid ${accent}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon size={18} color={accent} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                {loading ? (
                    <>
                        <div className="shimmer" style={{ height: 28, width: 72, borderRadius: 4, marginBottom: 8 }} />
                        <div className="shimmer" style={{ height: 10, width: 96, borderRadius: 4 }} />
                    </>
                ) : (
                    <>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1 }}>
                            {value}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--color-txt-faint)',
                                marginTop: 4,
                                textTransform: 'uppercase',
                                letterSpacing: 0.06,
                            }}
                        >
                            {label}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function RadarPlaceholder({ size = 320, message = 'Aún sin datos suficientes' }) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.36;
    const levels = [0.25, 0.5, 0.75, 1];

    return (
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto' }}>
            {levels.map((level) => (
                <circle
                    key={level}
                    cx={cx}
                    cy={cy}
                    r={radius * level}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                />
            ))}
            <text
                x={cx}
                y={cy}
                fill="var(--color-txt-faint)"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
            >
                {message}
            </text>
        </svg>
    );
}

function GenreRadar({ genres, size = 320 }) {
    if (!genres?.length) {
        return <RadarPlaceholder size={size} />;
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.36;
    const labelRadius = radius + 28;
    const levels = [0.25, 0.5, 0.75, 1];
    const maxCount = Math.max(...genres.map((genre) => genre.count), 1);
    const count = genres.length;

    const pointAt = (index, value) => {
        const angle = ((Math.PI * 2 * index) / count) - (Math.PI / 2);
        const distance = radius * (value / maxCount);

        return {
            x: cx + distance * Math.cos(angle),
            y: cy + distance * Math.sin(angle),
        };
    };

    const dataPoints = genres.map((genre, index) => pointAt(index, genre.count));
    const polygon = dataPoints.map((point) => `${point.x},${point.y}`).join(' ');

    return (
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto' }}>
            {levels.map((level) => (
                <circle
                    key={level}
                    cx={cx}
                    cy={cy}
                    r={radius * level}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                />
            ))}

            {genres.map((genre, index) => {
                const angle = ((Math.PI * 2 * index) / count) - (Math.PI / 2);
                const axisX = cx + radius * Math.cos(angle);
                const axisY = cy + radius * Math.sin(angle);
                const labelX = cx + labelRadius * Math.cos(angle);
                const labelY = cy + labelRadius * Math.sin(angle);

                return (
                    <g key={genre.genre_id}>
                        <line
                            x1={cx}
                            y1={cy}
                            x2={axisX}
                            y2={axisY}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                        />
                        <text
                            x={labelX}
                            y={labelY}
                            fill="var(--color-txt-dim)"
                            fontSize="10"
                            fontFamily="Inter, sans-serif"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {(genre.name ?? 'Género').slice(0, 10)}
                        </text>
                        <text
                            x={labelX}
                            y={labelY + 12}
                            fill="var(--color-gold)"
                            fontSize="9"
                            fontFamily="Inter, sans-serif"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {genre.count}
                        </text>
                    </g>
                );
            })}

            <polygon
                points={polygon}
                fill="rgba(201,168,76,0.18)"
                stroke="var(--color-gold)"
                strokeWidth="1.5"
            />

            {dataPoints.map((point, index) => (
                <circle
                    key={genres[index].genre_id}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill="var(--color-gold)"
                />
            ))}
        </svg>
    );
}

function DecadesBarChart({ decades }) {
    if (!decades?.length) {
        return (
            <div className="profile-decades-chart__empty">
                Aún no hay películas vistas con año de estreno registrado
            </div>
        );
    }

    const maxCount = Math.max(...decades.map((item) => item.count), 1);

    return (
        <div className="profile-decades-chart">
            {decades.map((item) => (
                <div key={item.decade} className="profile-decades-chart__row">
                    <span className="profile-decades-chart__label">
                        {item.decade}
                    </span>
                    <div className="profile-decades-chart__track">
                        <div
                            className={`profile-decades-chart__bar${item.count > 0 ? ' profile-decades-chart__bar--filled' : ''}`}
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                    </div>
                    <span className="profile-decades-chart__count">
                        {item.count}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ProfileGroupCard({ group, currentUserId }) {
    const memberCount = group.users?.length ?? 0;
    const role = getMemberRole(group, currentUserId);
    const owner = isGroupOwner(group, currentUserId);

    return (
        <Link
            to={`/grupos/${group.id}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--color-border-soft)',
                background: 'rgba(255,255,255,0.02)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = 'var(--color-border-strong)';
                event.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = 'var(--color-border-soft)';
                event.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Users size={18} color="var(--color-gold)" />
                </div>
                <span
                    style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.06,
                        color: 'var(--color-txt-dim)',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 999,
                        padding: '4px 10px',
                        background: 'rgba(255,255,255,0.03)',
                    }}
                >
                    {formatGroupRole(role, owner)}
                </span>
            </div>

            <h4
                style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: 20,
                    lineHeight: 1.2,
                    color: 'var(--color-txt)',
                }}
            >
                {group.name}
            </h4>

            <p
                style={{
                    margin: '10px 0 0',
                    flex: 1,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: group.description ? 'var(--color-txt-dim)' : 'var(--color-txt-faint)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {group.description || 'Sin descripción'}
            </p>

            <p style={{ margin: '16px 0 0', fontSize: 11.5, color: 'var(--color-txt-faint)' }}>
                {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
        </Link>
    );
}

function ActivityItem({ item }) {
    const isReview = item.type === 'review';
    const Icon = isReview ? Edit : Eye;
    const accent = isReview ? '#5CB2A8' : 'var(--color-gold)';
    const actionLabel = isReview ? 'Reseña publicada' : 'Marcada como vista';
    const moviePath = item.tmdb_id ? `/movies/${item.tmdb_id}` : null;

    const content = (
        <>
            <div
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${accent}14`,
                    border: `1px solid ${accent}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon size={15} color={accent} />
            </div>

            {item.poster_path ? (
                <img
                    src={`${POSTER_THUMB}${item.poster_path}`}
                    alt=""
                    style={{
                        width: 32,
                        height: 48,
                        borderRadius: 4,
                        objectFit: 'cover',
                        flexShrink: 0,
                    }}
                    loading="lazy"
                />
            ) : (
                <div
                    style={{
                        width: 32,
                        height: 48,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)',
                        flexShrink: 0,
                    }}
                />
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
                <div
                    style={{
                        fontSize: 13.5,
                        color: 'var(--color-txt)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {item.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-txt-faint)', marginTop: 2 }}>
                    {actionLabel}
                </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--color-txt-faint)', flexShrink: 0 }}>
                {formatActivityDate(item.date)}
            </div>
        </>
    );

    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border-soft)',
        textDecoration: 'none',
        color: 'inherit',
    };

    if (moviePath) {
        return (
            <Link to={moviePath} style={rowStyle}>
                {content}
            </Link>
        );
    }

    return <div style={rowStyle}>{content}</div>;
}

function LatestMovieCard({ movie }) {
    const moviePath = movie.tmdb_id ? `/movies/${movie.tmdb_id}` : null;

    const card = (
        <article
            style={{
                width: 132,
                flexShrink: 0,
            }}
        >
            {movie.poster_path ? (
                <img
                    src={`${POSTER_BASE}${movie.poster_path}`}
                    alt={movie.title}
                    style={{
                        width: '100%',
                        aspectRatio: '2 / 3',
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid var(--color-border-soft)',
                    }}
                    loading="lazy"
                />
            ) : (
                <div
                    style={{
                        width: '100%',
                        aspectRatio: '2 / 3',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--color-border-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: 'var(--color-txt-faint)',
                    }}
                >
                    Sin póster
                </div>
            )}
            <h4
                style={{
                    margin: '10px 0 0',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    lineHeight: 1.25,
                    color: 'var(--color-txt)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {movie.title}
            </h4>
            <div style={{ marginTop: 8 }}>
                <StarRating value={movie.rating} readOnly size={13} />
            </div>
        </article>
    );

    if (moviePath) {
        return (
            <Link to={moviePath} style={{ textDecoration: 'none', color: 'inherit' }}>
                {card}
            </Link>
        );
    }

    return card;
}

function ProfileSkeleton() {
    return (
        <div className="page-in profile-page">
            <div className="shimmer" style={{ height: 200, borderRadius: 12, marginBottom: 80 }} />
            <div style={{ display: 'flex', gap: 24, marginBottom: 36, paddingLeft: 168 }}>
                <div className="shimmer" style={{ width: 280, height: 36, borderRadius: 6 }} />
                <div className="shimmer" style={{ width: 180, height: 14, borderRadius: 4, marginTop: 12 }} />
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                    marginBottom: 36,
                }}
            >
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="shimmer" style={{ height: 80, borderRadius: 10 }} />
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 28 }}>
                <div className="shimmer" style={{ height: 380, borderRadius: 12 }} />
                <div className="shimmer" style={{ height: 380, borderRadius: 12 }} />
            </div>
        </div>
    );
}

function PanelSkeleton({ height = 380 }) {
    return <div className="shimmer" style={{ height, borderRadius: 8 }} />;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getCurrentUser);
    const [userLoading, setUserLoading] = useState(!user);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState('');
    const [groups, setGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [groupsError, setGroupsError] = useState('');

    useEffect(() => {
        let cancelled = false;

        axios
            .get('/me')
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            })
            .catch((error) => {
                if (error.response?.status === 401) {
                    clearSession();
                    navigate('/login');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setUserLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    useEffect(() => {
        let cancelled = false;

        setStatsLoading(true);
        setGroupsLoading(true);
        setStatsError('');
        setGroupsError('');

        Promise.allSettled([
            axios.get('/profile/stats'),
            fetchGroups(),
        ])
            .then(([statsResult, groupsResult]) => {
                if (cancelled) {
                    return;
                }

                if (statsResult.status === 'fulfilled') {
                    setStats(statsResult.value.data);
                } else {
                    const error = statsResult.reason;

                    if (error.response?.status === 401) {
                        clearSession();
                        navigate('/login');
                        return;
                    }

                    setStatsError(
                        error.response?.data?.message ?? 'No se pudieron cargar las estadísticas.',
                    );
                }

                if (groupsResult.status === 'fulfilled') {
                    setGroups(groupsResult.value);
                } else {
                    const error = groupsResult.reason;

                    if (error.response?.status === 401) {
                        clearSession();
                        navigate('/login');
                        return;
                    }

                    setGroupsError(getApiErrorMessage(error, 'No se pudieron cargar los grupos.'));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setStatsLoading(false);
                    setGroupsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const statCards = useMemo(
        () => STAT_CARD_CONFIG.map((card) => ({
            ...card,
            value: formatStatValue(card.key, stats),
        })),
        [stats],
    );

    if (userLoading && !user) {
        return <ProfileSkeleton />;
    }

    const handle = user?.email?.split('@')[0];
    const joinedLabel = formatJoined(user?.created_at);
    const hue = getHue(user?.email || user?.name || '');
    const initials = getInitials(user?.name);
    const genres = stats?.generos ?? [];
    const decades = stats?.decadas ?? [];
    const activity = stats?.actividad_reciente ?? [];
    const latestMovies = stats?.ultimas_peliculas ?? [];
    const currentUserId = user?.id;

    return (
        <div className="page-in profile-page">
            <div
                style={{
                    position: 'relative',
                    height: 200,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #2a1717 0%, #1a1f30 60%, #0d0f1a 100%)',
                    border: '1px solid var(--color-border-soft)',
                    marginBottom: 80,
                }}
            >
                <div className="poster-stripe" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
                <div className="grain" style={{ position: 'absolute', inset: 0 }} />

                <div
                    style={{
                        position: 'absolute',
                        bottom: -52,
                        left: 32,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            width: 112,
                            height: 112,
                            borderRadius: '50%',
                            border: '4px solid var(--color-bg-base)',
                            background: `linear-gradient(135deg, hsl(${hue} 35% 30%), hsl(${hue} 28% 18%))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-serif)',
                            fontSize: 44,
                            color: 'var(--color-txt)',
                            fontWeight: 400,
                            lineHeight: 1,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        }}
                    >
                        {initials}
                    </div>
                </div>

                <button
                    type="button"
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(13,15,26,0.65)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--color-border-strong)',
                        color: 'var(--color-txt)',
                        padding: '7px 12px',
                        borderRadius: 7,
                        fontSize: 12,
                        cursor: 'pointer',
                    }}
                >
                    <Edit size={12} />
                    Editar perfil
                </button>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginBottom: 36,
                    gap: 24,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: 'var(--font-serif)',
                            fontSize: 36,
                            fontWeight: 400,
                            lineHeight: 1,
                            letterSpacing: -0.01,
                        }}
                    >
                        {user?.name}
                    </h1>
                    <div
                        style={{
                            display: 'flex',
                            gap: 14,
                            fontSize: 12.5,
                            color: 'var(--color-txt-dim)',
                            marginTop: 8,
                            flexWrap: 'wrap',
                        }}
                    >
                        {handle && <span>@{handle}</span>}
                        {handle && joinedLabel && (
                            <>
                                <span>·</span>
                                <span>{joinedLabel}</span>
                            </>
                        )}
                        {!handle && joinedLabel && <span>{joinedLabel}</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                    <Stat
                        label="Amigos"
                        value={statsLoading ? '—' : (stats?.amigos ?? 0)}
                    />
                    <Stat
                        label="Seguidores"
                        value={statsLoading ? '—' : (stats?.seguidores ?? 0)}
                    />
                    <Stat
                        label="Siguiendo"
                        value={statsLoading ? '—' : (stats?.siguiendo ?? 0)}
                    />
                </div>
            </div>

            {statsError && (
                <div
                    style={{
                        marginBottom: 24,
                        borderRadius: 8,
                        border: '1px solid rgba(230,107,92,0.25)',
                        background: 'rgba(230,107,92,0.08)',
                        padding: '12px 16px',
                        fontSize: 13,
                        color: '#E66B5C',
                    }}
                >
                    {statsError}
                </div>
            )}

            <div className="profile-stats-grid">
                {statCards.map((card) => (
                    <StatCard
                        key={card.label}
                        Icon={card.Icon}
                        label={card.label}
                        value={card.value}
                        accent={card.accent}
                        loading={statsLoading}
                    />
                ))}
            </div>

            <div className="profile-charts-grid">
                <section
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 12,
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            marginBottom: 18,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 10.5,
                                    color: 'var(--color-gold)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.14,
                                    fontWeight: 600,
                                    marginBottom: 4,
                                }}
                            >
                                Tu mapa de géneros
                            </div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: 22,
                                    fontWeight: 400,
                                }}
                            >
                                Qué tipo de cinéfilo eres
                            </h3>
                        </div>
                    </div>

                    {statsLoading ? (
                        <PanelSkeleton height={320} />
                    ) : (
                        <>
                            <div className="profile-chart-wrap--svg">
                                <GenreRadar genres={genres} />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: 8,
                                    paddingTop: 18,
                                    borderTop: '1px solid var(--color-border-soft)',
                                }}
                            >
                                {genres.length > 0 ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {genres.map((genre) => (
                                            <span
                                                key={genre.genre_id}
                                                style={{
                                                    fontSize: 11.5,
                                                    color: 'var(--color-txt-dim)',
                                                    border: '1px solid var(--color-border-soft)',
                                                    borderRadius: 999,
                                                    padding: '4px 10px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                }}
                                            >
                                                {genre.name ?? 'Género'} · {genre.count}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 12, color: 'var(--color-txt-dim)', textAlign: 'center' }}>
                                        Sigue puntuando películas para ver tus géneros favoritos
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>

                <section
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 12,
                        padding: 24,
                    }}
                >
                    <div style={{ marginBottom: 18 }}>
                        <div
                            style={{
                                fontSize: 10.5,
                                color: 'var(--color-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.14,
                                fontWeight: 600,
                                marginBottom: 4,
                            }}
                        >
                            Tu línea temporal
                        </div>
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: 'var(--font-serif)',
                                fontSize: 22,
                                fontWeight: 400,
                            }}
                        >
                            Películas por década
                        </h3>
                    </div>

                    {statsLoading ? (
                        <PanelSkeleton height={280} />
                    ) : (
                        <DecadesBarChart decades={decades} />
                    )}
                </section>
            </div>

            <section
                style={{
                    marginTop: 28,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border-soft)',
                    borderRadius: 12,
                    padding: 24,
                }}
            >
                <div style={{ marginBottom: 18 }}>
                    <div
                        style={{
                            fontSize: 10.5,
                            color: 'var(--color-gold)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.14,
                            fontWeight: 600,
                            marginBottom: 4,
                        }}
                    >
                        Historial
                    </div>
                    <h3
                        style={{
                            margin: 0,
                            fontFamily: 'var(--font-serif)',
                            fontSize: 22,
                            fontWeight: 400,
                        }}
                    >
                        Actividad reciente
                    </h3>
                </div>

                {statsLoading ? (
                    <PanelSkeleton height={280} />
                ) : activity.length > 0 ? (
                    <div>
                        {activity.map((item, index) => (
                            <ActivityItem
                                key={`${item.type}-${item.movie_id}-${item.date}-${index}`}
                                item={item}
                            />
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 16px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'rgba(201,168,76,0.06)',
                                border: '1px solid rgba(201,168,76,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 14,
                            }}
                        >
                            <Film size={20} color="var(--color-gold)" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-txt)' }}>
                            Aún no hay actividad
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--color-txt-dim)', marginTop: 6, maxWidth: 260 }}>
                            Cuando veas o puntúes películas, aparecerán aquí.
                        </div>
                    </div>
                )}
            </section>

            <section style={{ marginTop: 36 }}>
                <h3
                    style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 22,
                        fontWeight: 400,
                        margin: '0 0 16px',
                    }}
                >
                    Últimas películas que has visto
                </h3>

                {statsLoading ? (
                    <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="shimmer" style={{ width: 132, height: 220, borderRadius: 8, flexShrink: 0 }} />
                        ))}
                    </div>
                ) : latestMovies.length > 0 ? (
                    <div
                        className="no-scrollbar"
                        style={{
                            display: 'flex',
                            gap: 16,
                            overflowX: 'auto',
                            paddingBottom: 4,
                        }}
                    >
                        {latestMovies.map((movie) => (
                            <LatestMovieCard key={`${movie.movie_id}-${movie.date}`} movie={movie} />
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '48px 32px',
                            textAlign: 'center',
                            border: '1px dashed var(--color-border-strong)',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.015)',
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(201,168,76,0.06)',
                                border: '1px solid rgba(201,168,76,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                            }}
                        >
                            <Film size={22} color="var(--color-gold)" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 6 }}>
                            Aún no has visto películas
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-txt-dim)', maxWidth: 360 }}>
                            Empieza a registrar lo que ves para construir tu historial cinematográfico.
                        </div>
                    </div>
                )}
            </section>

            <section style={{ marginTop: 48 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 16,
                        marginBottom: 20,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 10.5,
                                color: 'var(--color-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.14,
                                fontWeight: 600,
                                marginBottom: 4,
                            }}
                        >
                            Comunidad
                        </div>
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: 'var(--font-serif)',
                                fontSize: 22,
                                fontWeight: 400,
                            }}
                        >
                            Mis grupos
                        </h3>
                    </div>
                    {groups.length > 0 ? (
                        <Link
                            to="/grupos"
                            style={{
                                fontSize: 12.5,
                                color: 'var(--color-gold)',
                                textDecoration: 'none',
                            }}
                        >
                            Ver todos
                        </Link>
                    ) : null}
                </div>

                {groupsError ? (
                    <div
                        style={{
                            marginBottom: 16,
                            borderRadius: 8,
                            border: '1px solid rgba(230,107,92,0.25)',
                            background: 'rgba(230,107,92,0.08)',
                            padding: '12px 16px',
                            fontSize: 13,
                            color: '#E66B5C',
                        }}
                    >
                        {groupsError}
                    </div>
                ) : null}

                {groupsLoading ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 16,
                        }}
                    >
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="shimmer" style={{ height: 180, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : groups.length > 0 ? (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 16,
                        }}
                    >
                        {groups.map((group) => (
                            <ProfileGroupCard
                                key={group.id}
                                group={group}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '48px 32px',
                            textAlign: 'center',
                            border: '1px dashed var(--color-border-strong)',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.015)',
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(201,168,76,0.06)',
                                border: '1px solid rgba(201,168,76,0.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                            }}
                        >
                            <Users size={22} color="var(--color-gold)" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 6 }}>
                            Aún no perteneces a ningún grupo
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-txt-dim)', maxWidth: 360, marginBottom: 18 }}>
                            Únete o crea un grupo para compartir watchlists y votaciones con otros cinéfilos.
                        </div>
                        <Link
                            to="/grupos"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '1px solid rgba(201,168,76,0.25)',
                                background: 'rgba(201,168,76,0.08)',
                                color: 'var(--color-gold)',
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: 'none',
                            }}
                        >
                            Explorar grupos
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
