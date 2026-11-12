import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    ThumbsDown,
    ThumbsUp,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import StarRating from '../../components/StarRating';
import { useDashboardData } from '../../hooks/useDashboardData';
import { getCurrentUser } from '../../utils/currentUser';
import { formatRelativeTime } from '../../utils/notifications';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

function formatTodayLabel() {
    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(new Date());
}

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Buenos días';
    }

    if (hour < 20) {
        return 'Buenas tardes';
    }

    return 'Buenas noches';
}

function buildHeroSubtitle(pendingCount, votesCount) {
    const parts = [];

    if (pendingCount > 0) {
        parts.push(
            pendingCount === 1
                ? 'Tienes 1 película pendiente'
                : `Tienes ${pendingCount} películas pendientes`,
        );
    }

    if (votesCount > 0) {
        parts.push(
            votesCount === 1
                ? '1 votación activa en tus grupos'
                : `${votesCount} votaciones activas en tus grupos`,
        );
    }

    if (parts.length === 0) {
        return 'Descubre qué ver esta semana.';
    }

    return parts.join(' y ');
}

function getActivityAction(item) {
    if (item.type === 'watched') {
        return 'ha visto';
    }

    if (item.rating) {
        return 'ha valorado';
    }

    return 'ha reseñado';
}

function SectionHeading({ eyebrow, title, action, actionLabel }) {
    return (
        <div className="mb-[18px] flex items-end justify-between">
            <div>
                <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-gold uppercase">
                    {eyebrow}
                </div>
                <h2 className="m-0 font-serif text-2xl font-normal">{title}</h2>
            </div>
            {action && actionLabel && (
                <button
                    type="button"
                    onClick={action}
                    className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-gold"
                >
                    {actionLabel} →
                </button>
            )}
        </div>
    );
}

function RatingBadge({ rating }) {
    if (rating == null || rating <= 0) {
        return null;
    }

    return (
        <div
            className="absolute top-1.5 right-1.5 z-10 flex min-w-[22px] items-center justify-center rounded px-2 py-1 text-[14px] font-semibold leading-none text-gold"
            style={{ background: 'var(--color-bg-base)' }}
        >
            {rating}
        </div>
    );
}

function MovieCardPoster({ movie, onClick }) {
    const src = movie?.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="poster-hover relative block w-full cursor-pointer overflow-hidden rounded-md border-0 bg-white/3 p-0"
            style={{ aspectRatio: '2 / 3' }}
        >
            {src ? (
                <img
                    src={src}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/4 px-2 text-center text-xs text-txt-faint">
                    {movie?.title ?? 'Sin póster'}
                </div>
            )}
            <RatingBadge rating={movie?.rating} />
            <div className="ph-overlay absolute inset-0 bg-black/35" />
        </button>
    );
}

function Poster({ movie, rounded = 4 }) {
    const src = movie?.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null;

    return (
        <div
            className="h-full w-full overflow-hidden bg-white/4"
            style={{ borderRadius: rounded }}
        >
            {src ? (
                <img
                    src={src}
                    alt={movie?.title ?? ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-txt-faint">
                    —
                </div>
            )}
        </div>
    );
}

function CarouselSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden pb-1">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="dashboard-carousel-card shrink-0">
                    <div className="shimmer aspect-2/3 w-full rounded-md" />
                    <div className="mt-2.5 shimmer h-4 w-4/5 rounded" />
                    <div className="mt-1 shimmer h-3 w-1/2 rounded" />
                </div>
            ))}
        </div>
    );
}

function MovieGridSkeleton({ count = 6 }) {
    return (
        <div className="movie-poster-grid">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    <div className="shimmer aspect-2/3 w-full rounded-md" />
                    <div className="mt-2.5 shimmer h-4 w-4/5 rounded" />
                    <div className="mt-1 shimmer h-3 w-1/3 rounded" />
                </div>
            ))}
        </div>
    );
}

function VotesSkeleton() {
    return (
        <div className="dashboard-votes-grid grid gap-3.5">
            {Array.from({ length: 2 }).map((_, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-3 rounded-[10px] border border-border-soft bg-white/2.5 p-4"
                >
                    <div className="flex gap-3">
                        <div className="shimmer h-[78px] w-[52px] shrink-0 rounded" />
                        <div className="flex flex-1 flex-col gap-2 py-1">
                            <div className="shimmer h-3 w-1/3 rounded" />
                            <div className="shimmer h-4 w-4/5 rounded" />
                            <div className="shimmer h-3 w-1/2 rounded" />
                        </div>
                    </div>
                    <div className="shimmer h-2 w-full rounded" />
                </div>
            ))}
        </div>
    );
}

function ActivitySkeleton() {
    return (
        <div className="relative w-full pl-[18px]">
            <div className="absolute top-1 bottom-1 left-[7px] w-px bg-border-soft" />
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="relative pb-4">
                    <div className="shimmer absolute top-3.5 -left-[18px] h-[13px] w-[13px] rounded-full" />
                    <div className="w-full rounded-lg border border-border-soft bg-white/[0.025] p-3">
                        <div className="flex items-start gap-2.5">
                            <div className="shimmer h-[26px] w-[26px] shrink-0 rounded-full" />
                            <div className="flex flex-1 flex-col gap-2">
                                <div className="shimmer h-3 w-full rounded" />
                                <div className="shimmer h-2.5 w-1/3 rounded" />
                            </div>
                            <div className="shimmer h-[66px] w-[44px] shrink-0 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ActivityPoster({ movie }) {
    return (
        <div className="relative h-[66px] w-[44px] shrink-0 overflow-hidden rounded">
            <Poster movie={movie} rounded={4} />
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const carouselRef = useRef(null);
    const user = getCurrentUser();
    const { recommended, trending, votes, activity, pendingCount } = useDashboardData();

    const scrollCarousel = (dir) => {
        if (!carouselRef.current) {
            return;
        }

        const width = carouselRef.current.clientWidth * 0.7;
        carouselRef.current.scrollBy({ left: dir * width, behavior: 'smooth' });
    };

    const handleMovieClick = (movie) => {
        if (movie?.tmdb_id) {
            navigate(`/movies/${movie.tmdb_id}`);
        }
    };

    const firstName = user?.name?.split(/\s+/)[0] ?? 'Usuario';
    const heroSubtitle = buildHeroSubtitle(pendingCount, votes.data.length);

    return (
        <div className="dashboard-page page-in mx-auto max-w-[1500px] px-4 py-7 pb-[60px] sm:px-9">
            <div className="dashboard-layout grid gap-8">
                <div className="min-w-0">
                    <div className="mb-8">
                        <div className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">
                            {formatTodayLabel()}
                        </div>
                        <h1 className="hero-greeting-title m-0 max-w-[720px] font-serif leading-[1.05] font-normal tracking-[-0.01em]">
                            {getGreeting()}, <em className="text-gold not-italic">{firstName}</em>.
                            <br />
                            <span className="hero-greeting-subtitle text-txt-dim">{heroSubtitle}</span>
                        </h1>
                    </div>

                    <section className="mb-11">
                        <div className="mb-[18px] flex items-end justify-between gap-4">
                            <div className="min-w-0">
                                <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-gold uppercase">
                                    Recomendado para ti
                                </div>
                                <h2 className="m-0 font-serif text-2xl font-normal">Por tu historial reciente</h2>
                                <button
                                    type="button"
                                    onClick={() => navigate('/recomendaciones')}
                                    className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-gold transition-opacity hover:opacity-80"
                                >
                                    Ver todas las recomendaciones →
                                </button>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => scrollCarousel(-1)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-soft bg-white/[0.03] text-txt-dim transition-colors hover:bg-white/[0.06]"
                                    aria-label="Anterior"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollCarousel(1)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border-soft bg-white/[0.03] text-txt-dim transition-colors hover:bg-white/[0.06]"
                                    aria-label="Siguiente"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>

                        {recommended.loading ? (
                            <CarouselSkeleton />
                        ) : recommended.data.length === 0 ? (
                            <p className="text-sm text-txt-dim">Aún no hay recomendaciones para mostrar.</p>
                        ) : (
                            <div
                                ref={carouselRef}
                                className="snap-x-carousel flex gap-4 overflow-x-auto pb-1"
                            >
                                {recommended.data.map((movie) => (
                                    <div
                                        key={movie.tmdb_id}
                                        className="dashboard-carousel-card shrink-0 scroll-snap-start"
                                    >
                                        <MovieCardPoster
                                            movie={movie}
                                            onClick={() => handleMovieClick(movie)}
                                        />
                                        <div className="mt-2.5 font-serif text-[15px] leading-[1.15]">
                                            {movie.title}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-txt-faint">
                                            {movie.year ?? '—'}
                                            {movie.runtime ? ` · ${movie.runtime} min` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mb-11">
                        <SectionHeading
                            eyebrow="Tendencia"
                            title="Populares esta semana"
                            action={() => navigate('/filmdex')}
                            actionLabel="Buscar"
                        />

                        {trending.loading ? (
                            <MovieGridSkeleton />
                        ) : trending.data.length === 0 ? (
                            <p className="text-sm text-txt-dim">No hay películas populares disponibles.</p>
                        ) : (
                            <div className="movie-poster-grid">
                                {trending.data.map((movie) => (
                                    <div key={movie.tmdb_id}>
                                        <MovieCardPoster
                                            movie={movie}
                                            onClick={() => handleMovieClick(movie)}
                                        />
                                        <div className="mt-2.5 font-serif text-[15px] leading-[1.15]">
                                            {movie.title}
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <div className="text-[11px] text-txt-faint">
                                                {movie.year ?? '—'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <SectionHeading
                            eyebrow="Tus grupos"
                            title="Votaciones activas"
                            action={() => navigate('/grupos')}
                            actionLabel="Ir a grupos"
                        />

                        {votes.loading ? (
                            <VotesSkeleton />
                        ) : votes.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border-strong bg-white/[0.015] px-4 py-8 text-center text-sm text-txt-dim">
                                No tienes votaciones activas pendientes.
                            </p>
                        ) : (
                            <div className="dashboard-votes-grid grid gap-3.5">
                                {votes.data.map((vote, index) => {
                                    const totalVotes = vote.votes_up + vote.votes_down;
                                    const yesPct = totalVotes > 0
                                        ? Math.round((vote.votes_up / totalVotes) * 100)
                                        : 0;
                                    const noPct = totalVotes > 0
                                        ? Math.round((vote.votes_down / totalVotes) * 100)
                                        : 0;
                                    const pending = Math.max(
                                        vote.total_members - totalVotes,
                                        0,
                                    );

                                    return (
                                        <div
                                            key={`${vote.poll_id}-${vote.movie?.tmdb_id}`}
                                            className="flex flex-col gap-3 rounded-[10px] border border-border-soft bg-white/[0.025] p-4"
                                        >
                                            <div className="flex gap-3">
                                                <div className="h-[78px] w-[52px] shrink-0">
                                                    <Poster movie={vote.movie} rounded={4} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[10.5px] font-medium tracking-[0.1em] text-txt-faint uppercase">
                                                        {vote.group_name}
                                                    </div>
                                                    <div className="mt-1 font-serif text-base leading-[1.15]">
                                                        {vote.movie?.title}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-txt-dim">
                                                        {pending} votos pendientes · {vote.total_members} miembros
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/grupos/${vote.group_id}`)}
                                                        className="cursor-pointer border-none bg-transparent p-0 text-[11.5px] font-medium text-gold"
                                                    >
                                                        Votar →
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex h-2 overflow-hidden rounded bg-white/[0.04]">
                                                <div
                                                    className="fill-anim h-full bg-[#5CB2A8]"
                                                    style={{
                                                        width: `${yesPct}%`,
                                                        animationDelay: `${index * 0.1}s`,
                                                    }}
                                                />
                                                <div
                                                    className="fill-anim h-full bg-[#C0392B]"
                                                    style={{
                                                        width: `${noPct}%`,
                                                        animationDelay: `${index * 0.1 + 0.1}s`,
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-[11.5px]">
                                                <span className="inline-flex items-center gap-1 text-[#5CB2A8]">
                                                    <ThumbsUp size={11} />
                                                    {vote.votes_up}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[#C0392B]">
                                                    <ThumbsDown size={11} />
                                                    {vote.votes_down}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="min-w-0 w-full">
                    <div className="dashboard-rail w-full lg:sticky lg:top-[92px]">
                        <div className="mb-3.5 flex items-baseline justify-between">
                            <div>
                                <div className="mb-1 text-[10.5px] font-semibold tracking-[0.14em] text-gold uppercase">
                                    Tus amigos
                                </div>
                                <h2 className="m-0 font-serif text-xl font-normal">Actividad reciente</h2>
                            </div>
                        </div>

                        {activity.loading ? (
                            <ActivitySkeleton />
                        ) : activity.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border-strong bg-white/[0.015] px-4 py-8 text-center text-sm text-txt-dim">
                                Aún no hay actividad de tus amigos.
                            </p>
                        ) : (
                            <div className="relative w-full pl-[18px]">
                                <div className="absolute top-1 bottom-1 left-[7px] w-px bg-border-soft" />

                                {activity.data.map((item) => (
                                    <div key={item.id} className="relative pb-4">
                                        <div
                                            className="absolute top-3.5 -left-[18px] flex h-[13px] w-[13px] items-center justify-center rounded-full border-2 border-gold bg-bg-base"
                                            style={{ boxShadow: '0 0 0 3px var(--color-bg-base)' }}
                                        >
                                            <div className="h-[5px] w-[5px] rounded-full bg-gold" />
                                        </div>

                                        <div className="w-full rounded-lg border border-border-soft bg-white/[0.025] p-3">
                                            <div className="mb-2 flex w-full items-start gap-2.5">
                                                <Avatar user={item.user} size={26} />
                                                <div className="min-w-0 flex-1 text-sm leading-[1.45]">
                                                    <strong className="font-semibold">{item.user.name}</strong>
                                                    <span className="text-txt-dim"> {getActivityAction(item)} </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMovieClick(item.movie)}
                                                        className="cursor-pointer border-none bg-transparent p-0 font-serif text-[15px] text-txt italic"
                                                    >
                                                        {item.movie.title}
                                                    </button>
                                                    <div className="mt-0.5 text-xs text-txt-faint">
                                                        {formatRelativeTime(item.date)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMovieClick(item.movie)}
                                                    className="cursor-pointer border-none bg-transparent p-0"
                                                    aria-label={`Ver ${item.movie.title}`}
                                                >
                                                    <ActivityPoster movie={item.movie} />
                                                </button>
                                            </div>

                                            {item.comment && (
                                                <div
                                                    className="ml-[35px] border-l-2 border-gold/30 pl-3 text-[13px] leading-[1.5] text-txt-dim italic"
                                                >
                                                    {item.comment}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
