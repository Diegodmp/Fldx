import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Heart,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import ButtonLoader from '../components/ButtonLoader';
import ProposeToGroupModal from '../components/ProposeToGroupModal';
import ReviewFormModal from '../components/ReviewFormModal';
import StarRating from '../components/StarRating';
import WatchButton from '../components/WatchButton';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { useConfirm } from '../hooks/useConfirm';
import { getCurrentUser } from '../utils/currentUser';
import { setPageTitle } from '../utils/pageTitle';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';
const CAST_SCROLL_AMOUNT = 360;
const MAX_REVIEW_LENGTH = 280;
const SIDEBAR_CAST_LIMIT = 8;

function formatYear(releaseDate) {
    if (!releaseDate) {
        return '—';
    }

    return releaseDate.slice(0, 4) || '—';
}

function formatRuntime(minutes) {
    if (!minutes || minutes <= 0) {
        return '—';
    }

    return `${minutes} min`;
}

function formatGenres(genres = []) {
    if (!genres.length) {
        return 'Sin género';
    }

    return genres.map((genre) => genre.name).join(', ');
}

function formatReviewDate(value) {
    if (!value) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(value));
    } catch {
        return '—';
    }
}

function getDirector(crew = []) {
    return crew.find((member) => member.job === 'Director')?.name ?? 'Desconocido';
}

function getTrailer(videos = []) {
    return videos.find(
        (video) => video.type === 'Trailer' && video.site === 'YouTube',
    ) ?? null;
}

function getCommunityRating(voteAverage) {
    if (!voteAverage || voteAverage <= 0) {
        return null;
    }

    return Math.min(5, voteAverage / 2);
}

function isMovieNotFound(data) {
    return !data
        || data.success === false
        || data.status_code === 34
        || !data.title;
}

function GenrePill({ label }) {
    return (
        <span className="rounded-full border border-border-soft bg-white/3 px-3 py-1 text-xs text-txt-dim">
            {label}
        </span>
    );
}

function SectionEmpty({ title, description }) {
    return (
        <div className="rounded-xl border border-dashed border-border-strong bg-white/1.5 px-5 py-10 text-center">
            <p className="font-serif text-lg text-txt">{title}</p>
            {description && (
                <p className="mx-auto mt-2 max-w-md text-sm text-txt-dim">{description}</p>
            )}
        </div>
    );
}

function TechSheetRow({ label, value }) {
    return (
        <div className="flex justify-between gap-3 border-b border-border-soft py-2 text-sm sm:gap-4">
            <dt className="shrink-0 text-txt-faint">{label}</dt>
            <dd className="m-0 max-w-[58%] text-right break-words text-txt sm:max-w-[65%]">{value}</dd>
        </div>
    );
}

function SimilarMoviesSkeleton() {
    return (
        <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="flex gap-2.5 rounded-lg border border-border-soft bg-white/2 p-2"
                >
                    <div className="shimmer h-[66px] w-[44px] shrink-0 rounded" />
                    <div className="flex flex-1 flex-col gap-2 py-0.5">
                        <div className="shimmer h-3.5 w-4/5 rounded" />
                        <div className="shimmer h-2.5 w-1/3 rounded" />
                        <div className="shimmer h-2.5 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SimilarMovieCard({ movie, onClick }) {
    const src = movie?.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="lift flex w-full cursor-pointer gap-2.5 rounded-lg border border-border-soft bg-white/2 p-2 text-left"
        >
            <div className="h-[66px] w-[44px] shrink-0 overflow-hidden rounded">
                {src ? (
                    <img
                        src={src}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/4 text-[10px] text-txt-faint">
                        —
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="font-serif text-sm leading-[1.15] text-txt">{movie.title}</div>
                <div className="mt-0.5 text-[10.5px] text-txt-faint">{movie.year ?? '—'}</div>
                {movie.rating != null && movie.rating > 0 ? (
                    <div className="mt-1">
                        <StarRating value={movie.rating} readOnly size={9} showNumber />
                    </div>
                ) : null}
            </div>
        </button>
    );
}

function CastSidebarList({ cast }) {
    if (!cast.length) {
        return (
            <SectionEmpty
                title="Sin datos de reparto"
                description="TMDB no ha devuelto actores para esta película."
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {cast.slice(0, SIDEBAR_CAST_LIMIT).map((actor) => (
                <div key={`${actor.id}-${actor.order}`} className="flex items-center gap-3">
                    {actor.profile_path ? (
                        <img
                            src={`${PROFILE_BASE}${actor.profile_path}`}
                            alt={actor.name}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-700/80 text-[10px] text-txt-faint">
                            —
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-sm text-txt">{actor.name}</p>
                        <p className="truncate text-xs text-txt-faint">{actor.character || '—'}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CastCarousel({ cast }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;

        if (!el) {
            return;
        }

        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        updateScrollState();
        window.addEventListener('resize', updateScrollState);

        return () => window.removeEventListener('resize', updateScrollState);
    }, [cast, updateScrollState]);

    const scroll = (direction) => {
        scrollRef.current?.scrollBy({
            left: direction * CAST_SCROLL_AMOUNT,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative -mx-1 sm:mx-0">
            <button
                type="button"
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                aria-label="Ver actores anteriores"
                className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-bg-elev/95 text-txt disabled:cursor-not-allowed disabled:opacity-30 md:flex"
            >
                <ChevronLeft size={18} />
            </button>

            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="no-scrollbar flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-1 py-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] sm:px-10 md:px-10"
                style={{ touchAction: 'pan-x pinch-zoom' }}
            >
                {cast.map((actor) => (
                    <div
                        key={`${actor.id}-${actor.cast_id ?? actor.order}`}
                        className="w-[92px] shrink-0 snap-start text-center sm:w-[108px]"
                    >
                        {actor.profile_path ? (
                            <img
                                src={`${PROFILE_BASE}${actor.profile_path}`}
                                alt={actor.name}
                                className="mx-auto h-20 w-20 rounded-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-700/80 text-xs text-txt-faint">
                                —
                            </div>
                        )}
                        <p className="mt-2 truncate text-xs font-medium text-txt">{actor.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-txt-faint">{actor.character || '—'}</p>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                aria-label="Ver más actores"
                className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-bg-elev/95 text-txt disabled:cursor-not-allowed disabled:opacity-30 md:flex"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

function getReviewDate(review) {
    return review.watched_at ?? review.created_at;
}

const REVIEWS_PER_PAGE = 5;

const REVIEW_PAGINATION_BUTTON_STYLE = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    color: 'var(--txt-dim)',
    borderRadius: 6,
};

function ReviewPaginationButton({ children, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="cursor-pointer px-3 py-1.5 text-xs transition-[background,opacity] duration-150 hover:enabled:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
            style={REVIEW_PAGINATION_BUTTON_STYLE}
        >
            {children}
        </button>
    );
}

function getReviewsRangeLabel({ currentPage, perPage, total }) {
    if (total <= 0) {
        return 'Mostrando 0 de 0 reseñas';
    }

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, total);

    return `Mostrando ${start}–${end} de ${total} reseñas`;
}

function ReviewReplyItem({ reply, currentUserId, onDelete, deleting }) {
    const isOwn = reply.user_id === currentUserId;

    return (
        <div className="rounded-lg border border-border-soft bg-white/2 p-2.5">
            <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-txt">
                        {reply.user?.name ?? 'Usuario'}
                    </p>
                    <p className="text-[11px] text-txt-faint">
                        {formatReviewDate(reply.created_at)}
                    </p>
                </div>
                {isOwn && (
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={() => onDelete(reply.id)}
                        className="cursor-pointer rounded p-1 text-txt-faint transition-colors hover:bg-white/5 hover:text-[#E66B5C] disabled:opacity-50"
                        aria-label="Eliminar respuesta"
                    >
                        {deleting ? <ButtonLoader size={12} /> : <Trash2 size={12} />}
                    </button>
                )}
            </div>
            <p className="text-[12.5px] leading-relaxed break-words text-txt-dim">{reply.body}</p>
        </div>
    );
}

function ReviewCard({
    review,
    isOwn,
    busy,
    currentUser,
    onEdit,
    onDelete,
    onInteractionChange,
}) {
    const [editing, setEditing] = useState(false);
    const [draftBody, setDraftBody] = useState(review.body);
    const [likedByMe, setLikedByMe] = useState(review.liked_by_me ?? false);
    const [likesCount, setLikesCount] = useState(review.likes_count ?? 0);
    const [repliesCount, setRepliesCount] = useState(review.replies_count ?? 0);
    const [repliesOpen, setRepliesOpen] = useState(false);
    const [replies, setReplies] = useState(review.replies ?? []);
    const [allRepliesLoaded, setAllRepliesLoaded] = useState((review.replies_count ?? 0) <= 2);
    const [replyDraft, setReplyDraft] = useState('');
    const [likeBusy, setLikeBusy] = useState(false);
    const [replyBusy, setReplyBusy] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [deletingReplyId, setDeletingReplyId] = useState(null);

    useEffect(() => {
        setLikedByMe(review.liked_by_me ?? false);
        setLikesCount(review.likes_count ?? 0);
        setRepliesCount(review.replies_count ?? 0);
        setReplies(review.replies ?? []);
        setAllRepliesLoaded((review.replies_count ?? 0) <= 2);
    }, [review]);

    const saveEdit = async () => {
        await onEdit(review.id, { body: draftBody.trim() });
        setEditing(false);
    };

    const cancelEdit = () => {
        setDraftBody(review.body);
        setEditing(false);
    };

    const handleDelete = () => {
        onDelete(review.id);
    };

    const handleLike = async () => {
        if (likeBusy) {
            return;
        }

        const previous = { liked: likedByMe, count: likesCount };
        const optimistic = {
            liked: !likedByMe,
            count: Math.max(0, likesCount + (likedByMe ? -1 : 1)),
        };

        setLikedByMe(optimistic.liked);
        setLikesCount(optimistic.count);
        setLikeBusy(true);

        try {
            const { data } = await axios.post(`/reviews/${review.id}/like`);
            setLikedByMe(data.liked);
            setLikesCount(data.likes_count);
            onInteractionChange?.(review.id, {
                liked_by_me: data.liked,
                likes_count: data.likes_count,
            });
        } catch {
            setLikedByMe(previous.liked);
            setLikesCount(previous.count);
        } finally {
            setLikeBusy(false);
        }
    };

    const loadAllReplies = async () => {
        if (loadingReplies || allRepliesLoaded) {
            return;
        }

        setLoadingReplies(true);

        try {
            const { data } = await axios.get(`/reviews/${review.id}/replies`);
            setReplies(data.replies ?? []);
            setAllRepliesLoaded(true);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleToggleReplies = () => {
        setRepliesOpen((open) => !open);
    };

    const handlePublishReply = async () => {
        const body = replyDraft.trim();

        if (!body || replyBusy) {
            return;
        }

        const optimisticId = `temp-${Date.now()}`;
        const optimisticReply = {
            id: optimisticId,
            user_id: currentUser?.id,
            user: {
                name: currentUser?.name,
                avatar: currentUser?.avatar,
            },
            body,
            created_at: new Date().toISOString(),
        };

        setReplies((current) => [...current, optimisticReply]);
        setRepliesCount((count) => count + 1);
        setReplyDraft('');
        setReplyBusy(true);

        try {
            const { data } = await axios.post(`/reviews/${review.id}/replies`, { body });
            setReplies((current) => {
                const next = current
                    .filter((item) => item.id !== optimisticId)
                    .concat(data);

                onInteractionChange?.(review.id, {
                    replies_count: next.length,
                    replies: next.slice(0, 2),
                });

                return next;
            });
        } catch {
            setReplies((current) => current.filter((item) => item.id !== optimisticId));
            setRepliesCount((count) => Math.max(0, count - 1));
            setReplyDraft(body);
        } finally {
            setReplyBusy(false);
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (deletingReplyId != null) {
            return;
        }

        const previousReplies = replies;
        const previousCount = repliesCount;

        setDeletingReplyId(replyId);
        setReplies((current) => current.filter((item) => item.id !== replyId));
        setRepliesCount((count) => Math.max(0, count - 1));

        try {
            await axios.delete(`/reviews/${review.id}/replies/${replyId}`);
            onInteractionChange?.(review.id, {
                replies_count: Math.max(0, previousCount - 1),
                replies: previousReplies.filter((item) => item.id !== replyId),
            });
        } catch {
            setReplies(previousReplies);
            setRepliesCount(previousCount);
        } finally {
            setDeletingReplyId(null);
        }
    };

    const replyLabel = repliesCount > 0 ? `Responder · ${repliesCount}` : 'Responder';
    const canPublishReply = replyDraft.trim().length > 0 && !replyBusy;

    return (
        <article className="rounded-xl border border-border-soft bg-white/2 p-3 sm:p-4">
            <div className="mb-3 flex items-start gap-2.5 sm:gap-3">
                <Avatar user={review.user} size={36} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-txt">{review.user?.name ?? 'Usuario'}</p>
                    <p className="text-xs text-txt-faint">{formatReviewDate(getReviewDate(review))}</p>
                </div>
                {isOwn && !editing && (
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                setDraftBody(review.body);
                                setEditing(true);
                            }}
                            className="cursor-pointer rounded p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                            aria-label="Editar reseña"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={handleDelete}
                            className="cursor-pointer rounded p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-[#E66B5C] disabled:opacity-50"
                            aria-label="Eliminar reseña"
                        >
                            {busy ? (
                                <ButtonLoader size={14} />
                            ) : (
                                <Trash2 size={14} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="space-y-3">
                    <textarea
                        rows={3}
                        value={draftBody}
                        disabled={busy}
                        onChange={(e) => setDraftBody(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
                        className="w-full resize-none rounded-lg border border-border-soft bg-white/2 px-3 py-2 text-sm text-txt outline-none focus:border-gold/35 disabled:opacity-50"
                    />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={cancelEdit}
                            className="cursor-pointer rounded-lg border border-border-soft px-3 py-2 text-xs text-txt-dim disabled:opacity-50 sm:py-1.5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={saveEdit}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-3 py-2 text-xs text-white disabled:opacity-50 sm:min-w-[88px] sm:w-auto sm:py-1.5"
                        >
                            {busy ? <ButtonLoader size={14} className="text-white" /> : 'Guardar'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {review.body?.trim() ? (
                        <p className="text-sm leading-relaxed break-words text-txt">{review.body}</p>
                    ) : null}

                    <div className="mt-3 flex items-center gap-4">
                        <button
                            type="button"
                            disabled={likeBusy}
                            onClick={handleLike}
                            className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-xs text-txt-dim transition-colors hover:text-txt disabled:opacity-50"
                            aria-label={likedByMe ? 'Quitar me gusta' : 'Dar me gusta'}
                            aria-pressed={likedByMe}
                        >
                            <Heart
                                size={14}
                                fill={likedByMe ? 'var(--color-gold)' : 'none'}
                                color={likedByMe ? 'var(--color-gold)' : 'currentColor'}
                            />
                            <span>{likesCount}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleReplies}
                            className="cursor-pointer border-none bg-transparent p-0 text-xs text-txt-dim transition-colors hover:text-txt"
                            aria-expanded={repliesOpen}
                        >
                            {replyLabel}
                        </button>
                    </div>

                    {repliesOpen && (
                        <div className="mt-3 space-y-2.5" style={{ marginLeft: 48 }}>
                            {replies.map((reply) => (
                                <ReviewReplyItem
                                    key={reply.id}
                                    reply={reply}
                                    currentUserId={currentUser?.id}
                                    onDelete={handleDeleteReply}
                                    deleting={deletingReplyId === reply.id}
                                />
                            ))}

                            {repliesCount > 2 && !allRepliesLoaded && (
                                <button
                                    type="button"
                                    disabled={loadingReplies}
                                    onClick={loadAllReplies}
                                    className="cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-gold transition-opacity hover:opacity-80 disabled:opacity-50"
                                >
                                    {loadingReplies ? 'Cargando…' : 'Ver más respuestas'}
                                </button>
                            )}

                            <div className="rounded-lg border border-border-soft bg-white/2 p-2.5">
                                <textarea
                                    rows={2}
                                    value={replyDraft}
                                    disabled={replyBusy}
                                    onChange={(e) => setReplyDraft(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
                                    placeholder="Escribe una respuesta…"
                                    className="w-full resize-none rounded-md border border-border-soft bg-white/2 px-2.5 py-2 text-[12.5px] text-txt outline-none focus:border-gold/35 disabled:opacity-50"
                                />
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-txt-faint">
                                        {replyDraft.length}/{MAX_REVIEW_LENGTH}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!canPublishReply}
                                        onClick={handlePublishReply}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-primary px-2.5 py-1.5 text-[12.5px] text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {replyBusy ? <ButtonLoader size={12} className="text-white" /> : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </article>
    );
}

function DetailSkeleton() {
    return (
        <div className="page-in pb-16">
            <div className="shimmer min-h-[360px] w-full md:min-h-[520px]" />
            <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-11">
                <div className="space-y-4">
                    <div className="shimmer h-8 w-48 rounded" />
                    <div className="shimmer aspect-video w-full rounded-xl" />
                    <div className="shimmer h-32 w-full rounded-xl" />
                </div>
                <div className="shimmer h-72 w-full rounded-xl" />
            </div>
        </div>
    );
}

export default function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [localMovieId, setLocalMovieId] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);

    const [reviews, setReviews] = useState([]);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsMeta, setReviewsMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: REVIEWS_PER_PAGE,
    });
    const [ownReview, setOwnReview] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const reviewsSectionRef = useRef(null);
    const [reviewBusy, setReviewBusy] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposeSuccess, setProposeSuccess] = useState('');
    const [similarMovies, setSimilarMovies] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const {
        loading: watchlistLoading,
        getEntry,
        getWatchState,
        isBusy,
        toggleWatch,
        fetchWatchlist,
    } = useWatchlistContext();
    const { confirm, ConfirmDialog } = useConfirm();

    useEffect(() => {
        if (movie?.title) {
            setPageTitle(movie.title);
        }
    }, [movie?.title]);

    useEffect(() => {
        if (!id) {
            setSimilarMovies([]);
            return undefined;
        }

        let cancelled = false;

        setSimilarLoading(true);
        setSimilarMovies([]);

        axios.get(`/movies/${id}/similar`)
            .then(({ data }) => {
                if (!cancelled) {
                    setSimilarMovies(data.movies ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSimilarMovies([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setSimilarLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleSimilarMovieClick = useCallback((similarMovie) => {
        if (similarMovie?.tmdb_id) {
            navigate(`/movies/${similarMovie.tmdb_id}`);
        }
    }, [navigate]);

    useEffect(() => {
        let cancelled = false;

        const fetchMovie = async () => {
            setLoading(true);
            setError('');
            setMovie(null);

            try {
                const { data } = await axios.get(`/movies/${id}`);

                if (cancelled) {
                    return;
                }

                if (isMovieNotFound(data)) {
                    setError('No se encontró la película solicitada.');
                    return;
                }

                setMovie(data);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                const message = err.response?.status === 404
                    ? 'No se encontró la película solicitada.'
                    : err.response?.data?.message
                        ?? 'No se pudo cargar la película.';

                setError(message);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchMovie();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        let cancelled = false;

        const fetchLocalId = async () => {
            setMetaLoading(true);
            setLocalMovieId(null);

            try {
                const { data } = await axios.get(`/movies/tmdb/${id}/local-id`);

                if (!cancelled) {
                    setLocalMovieId(data.movie_id ?? null);
                }
            } catch {
                if (!cancelled) {
                    setLocalMovieId(null);
                }
            } finally {
                if (!cancelled) {
                    setMetaLoading(false);
                }
            }
        };

        fetchLocalId();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        const entry = getEntry(id);

        if (entry?.movie_id) {
            setLocalMovieId(entry.movie_id);
        }
    }, [getEntry, id]);

    const fetchReviews = useCallback(async (movieId, page = 1, { scrollToSection = false } = {}) => {
        if (!movieId) {
            setReviews([]);
            setReviewsMeta({
                current_page: 1,
                last_page: 1,
                total: 0,
                per_page: REVIEWS_PER_PAGE,
            });
            setReviewsPage(1);
            return;
        }

        setReviewsLoading(true);

        try {
            const { data } = await axios.get(`/movies/${movieId}/reviews`, {
                params: { page, per_page: REVIEWS_PER_PAGE },
            });

            setReviews(data.data ?? []);
            setReviewsMeta({
                current_page: data.current_page ?? page,
                last_page: data.last_page ?? 1,
                total: data.total ?? 0,
                per_page: data.per_page ?? REVIEWS_PER_PAGE,
            });
            setReviewsPage(data.current_page ?? page);

            const own = (data.data ?? []).find(
                (review) => review.user_id === currentUser?.id,
            );

            if (own) {
                setOwnReview(own);
            }

            if (scrollToSection) {
                reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch {
            setReviews([]);
            setReviewsMeta({
                current_page: 1,
                last_page: 1,
                total: 0,
                per_page: REVIEWS_PER_PAGE,
            });
        } finally {
            setReviewsLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (!metaLoading) {
            setReviewsPage(1);
            setOwnReview(null);
            fetchReviews(localMovieId, 1);
        }
    }, [localMovieId, metaLoading, fetchReviews]);

    const handleReviewsPageChange = (nextPage) => {
        if (!localMovieId || reviewsLoading) {
            return;
        }

        if (nextPage < 1 || nextPage > reviewsMeta.last_page) {
            return;
        }

        fetchReviews(localMovieId, nextPage, { scrollToSection: true });
    };

    const watchlistEntry = getEntry(id);
    const watchState = getWatchState(id);
    const watchlistBusy = isBusy(`tmdb:${id}`) || isBusy(`movie:${watchlistEntry?.movie_id}`);

    const handleToggleWatch = () => {
        toggleWatch({ tmdbId: Number(id), movieId: watchlistEntry?.movie_id });
    };

    useEffect(() => {
        if (!proposeSuccess) {
            return undefined;
        }

        const timer = window.setTimeout(() => setProposeSuccess(''), 5000);

        return () => window.clearTimeout(timer);
    }, [proposeSuccess]);

    const ensureLocalMovieId = async () => {
        const existing = localMovieId;

        if (existing) {
            return existing;
        }

        const { data: localData } = await axios.get(`/movies/tmdb/${id}/local-id`);

        if (localData.movie_id) {
            setLocalMovieId(localData.movie_id);
            return localData.movie_id;
        }

        const { data: syncData } = await axios.post(`/movies/tmdb/${id}/sync`);
        setLocalMovieId(syncData.movie_id);

        return syncData.movie_id;
    };

    const handleAddReviewClick = () => {
        setShowReviewModal(true);
    };

    const handlePublishReview = async (payload) => {
        setReviewBusy(true);

        try {
            const movieId = await ensureLocalMovieId();
            const { data: createdReview } = await axios.post(`/movies/${movieId}/reviews`, payload);
            setShowReviewModal(false);
            setOwnReview(createdReview);
            setReviewsPage(1);
            await Promise.all([fetchReviews(movieId, 1), fetchWatchlist()]);
        } finally {
            setReviewBusy(false);
        }
    };

    const handleEditReview = async (reviewId, payload) => {
        const movieId = localMovieId;

        if (!movieId) {
            return;
        }

        setReviewBusy(true);

        try {
            const { data: updatedReview } = await axios.patch(
                `/movies/${movieId}/reviews/${reviewId}`,
                payload,
            );
            if (updatedReview.user_id === currentUser?.id) {
                setOwnReview(updatedReview);
            }
            await fetchReviews(movieId, reviewsPage);
        } finally {
            setReviewBusy(false);
        }
    };

    const handleReviewInteractionChange = useCallback((reviewId, updates) => {
        setReviews((current) => current.map((item) => (
            item.id === reviewId
                ? { ...item, ...updates }
                : item
        )));
    }, []);

    const handleDeleteReview = async (reviewId) => {
        const movieId = localMovieId;

        if (!movieId) {
            return;
        }

        const confirmed = await confirm({
            title: 'Eliminar reseña',
            message: 'Esta acción no se puede deshacer. ¿Seguro que quieres eliminar tu reseña?',
            confirmLabel: 'Eliminar',
            variant: 'danger',
        });

        if (!confirmed) {
            return;
        }

        setReviewBusy(true);

        try {
            await axios.delete(`/movies/${movieId}/reviews/${reviewId}`);
            if (ownReview?.id === reviewId) {
                setOwnReview(null);
            }

            const nextPage = reviews.length === 1 && reviewsPage > 1
                ? reviewsPage - 1
                : reviewsPage;

            await fetchReviews(movieId, nextPage);
        } finally {
            setReviewBusy(false);
        }
    };

    if (loading) {
        return <DetailSkeleton />;
    }

    if (error || !movie) {
        return (
            <div className="page-in mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center p-8 text-center">
                <p className="font-serif text-2xl text-txt">Película no encontrada</p>
                <p className="mt-2 max-w-md text-sm text-txt-dim">
                    {error || 'No se encontró la película solicitada.'}
                </p>
                <Link
                    to="/filmdex"
                    className="mt-6 rounded-lg border border-border-strong bg-white/2.5 px-4 py-2 text-sm text-txt no-underline transition-colors hover:bg-white/5"
                >
                    Volver a Buscar
                </Link>
            </div>
        );
    }

    const cast = movie.credits?.cast ?? [];
    const director = getDirector(movie.credits?.crew ?? []);
    const trailer = getTrailer(movie.videos?.results ?? []);
    const communityRating = getCommunityRating(movie.vote_average);
    const genres = movie.genres ?? [];
    const userRating = ownReview?.rating ?? watchlistEntry?.rating ?? null;
    const isInitialReviewsLoad = reviewsLoading && reviews.length === 0;
    const isReviewsPageLoading = reviewsLoading && reviews.length > 0;
    const heroImage = movie.backdrop_path
        ? `${BACKDROP_BASE}${movie.backdrop_path}`
        : movie.poster_path
            ? `${POSTER_BASE}${movie.poster_path}`
            : null;

    return (
        <div className="page-in pb-10 sm:pb-16">
            {/* Hero */}
            <section className="relative mb-6 overflow-hidden md:mb-9 md:min-h-[520px]">
                {heroImage && (
                    <img
                        src={heroImage}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-115 object-cover blur-[28px] saturate-[1.2] opacity-85"
                    />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-bg-base via-bg-base/65 to-bg-base/50" />
                <div className="grain absolute inset-0" />

                <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pb-8 pt-14 sm:gap-7 sm:px-6 md:flex-row md:gap-8 md:pb-9 md:pt-9 lg:gap-9 lg:px-11">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-4 inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-strong bg-black/40 px-3 py-1.5 text-xs text-txt-dim backdrop-blur-md transition-colors hover:text-txt sm:left-6 md:left-8 md:top-5 lg:left-11"
                    >
                        <ChevronLeft size={13} />
                        Volver
                    </button>

                    <div className="movie-detail-hero-poster mx-auto shrink-0 md:mx-0 md:mt-8">
                        {movie.poster_path ? (
                            <img
                                src={`${POSTER_BASE}${movie.poster_path}`}
                                alt={movie.title}
                                className="aspect-2/3 w-full rounded-[10px] border border-border-strong object-cover shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                            />
                        ) : (
                            <div className="flex aspect-2/3 w-full items-center justify-center rounded-[10px] border border-border-strong bg-zinc-700/80 text-sm text-txt-faint">
                                Sin póster
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1 md:pt-12">
                        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
                            {movie.original_title && movie.original_title !== movie.title && (
                                <span className="font-serif text-sm italic text-txt-dim sm:text-base">
                                    {movie.original_title}
                                </span>
                            )}
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                                Largometraje · {formatYear(movie.release_date)}
                            </span>
                        </div>

                        <h1 className="movie-detail-hero-title font-serif leading-tight tracking-tight text-txt drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                            {movie.title}
                        </h1>

                        <div className="mt-3 flex flex-col gap-1.5 text-sm text-txt-dim sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                            <span>
                                Dirigida por{' '}
                                <strong className="text-txt">{director}</strong>
                            </span>
                            <span className="hidden h-1 w-1 rounded-full bg-txt-faint sm:inline" />
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={12} />
                                {formatRuntime(movie.runtime)}
                            </span>
                            {movie.vote_count > 0 && (
                                <>
                                    <span className="hidden h-1 w-1 rounded-full bg-txt-faint sm:inline" />
                                    <span>{movie.vote_count.toLocaleString('es-ES')} votos</span>
                                </>
                            )}
                        </div>

                        {genres.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                                {genres.map((genre) => (
                                    <GenrePill key={genre.id} label={genre.name} />
                                ))}
                            </div>
                        )}

                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-txt sm:mt-5 sm:text-[15px]">
                            {movie.overview || 'Sin sinopsis disponible.'}
                        </p>

                        <div className="movie-detail-rating-block mt-5 flex w-full max-w-xl gap-5 rounded-[10px] border border-border-strong bg-bg-elev/60 px-4 py-4 backdrop-blur-md sm:mt-6 sm:gap-7 sm:px-5">
                            <div className="min-w-[120px]">
                                <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-txt-faint">
                                    Comunidad
                                </p>
                                {communityRating ? (
                                    <>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-serif text-3xl leading-none text-gold">
                                                {communityRating.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-txt-faint">/ 5</span>
                                        </div>
                                        <StarRating value={communityRating} readOnly size={11} />
                                    </>
                                ) : (
                                    <p className="text-sm text-txt-dim">Sin valoraciones aún</p>
                                )}
                            </div>

                            <div className="hidden h-px w-full bg-border-soft sm:block sm:h-14 sm:w-px" />

                            <div className="flex-1">
                                <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-txt-faint">
                                    Tu valoración
                                </p>
                                {userRating ? (
                                    <div className="flex items-center gap-2.5">
                                        <StarRating value={userRating} readOnly size={22} />
                                        <span className="text-xs text-gold">{userRating}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-txt-dim">
                                        Publica una reseña para valorar esta película
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="movie-detail-actions mt-5 flex w-full flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                disabled={reviewBusy}
                                onClick={handleAddReviewClick}
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[200px]"
                            >
                                {reviewBusy ? (
                                    <ButtonLoader size={16} className="text-white" />
                                ) : (
                                    <Plus size={18} />
                                )}
                                Añadir reseña
                            </button>

                            <div className="flex w-full items-center sm:w-auto">
                                <WatchButton
                                    watchState={watchlistLoading ? 'none' : watchState}
                                    onChange={handleToggleWatch}
                                    loading={watchlistLoading || watchlistBusy}
                                    className="w-full sm:min-w-[200px]"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowProposeModal(true)}
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-txt transition-opacity hover:opacity-90 sm:w-auto"
                            >
                                <Users size={14} />
                                Proponer a grupo
                            </button>
                        </div>

                        {proposeSuccess ? (
                            <p className="mt-3 text-sm text-emerald-300">
                                Propuesta enviada a {proposeSuccess}
                            </p>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* Main content */}
            <div className="mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9 lg:px-11">
                <div className="min-w-0">
                    {/* Trailer */}
                    <section className="mb-8 sm:mb-9">
                        <h2 className="mb-3 font-serif text-xl font-normal text-txt sm:mb-3.5 sm:text-[22px]">
                            Tráiler oficial
                        </h2>
                        {trailer ? (
                            <div className="w-full overflow-hidden rounded-[10px] border border-border-strong bg-black/40">
                                <div className="relative aspect-video w-full">
                                    <iframe
                                        title={trailer.name || `Tráiler de ${movie.title}`}
                                        src={`https://www.youtube.com/embed/${trailer.key}`}
                                        className="absolute inset-0 h-full w-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        ) : (
                            <SectionEmpty
                                title="Tráiler no disponible"
                                description="No hemos encontrado un tráiler oficial en YouTube para esta película."
                            />
                        )}
                    </section>

                    {/* Reviews */}
                    <section ref={reviewsSectionRef}>
                        <h2 className="mb-3 font-serif text-xl font-normal text-txt sm:mb-4 sm:text-2xl">
                            Reseñas
                        </h2>

                        {isInitialReviewsLoad ? (
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <div key={index} className="shimmer h-28 rounded-xl" />
                                ))}
                            </div>
                        ) : reviewsMeta.total > 0 ? (
                            <>
                                <div
                                    className="space-y-3.5 transition-opacity duration-200"
                                    style={{ opacity: isReviewsPageLoading ? 0.4 : 1 }}
                                >
                                    {reviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            isOwn={review.user_id === currentUser?.id}
                                            busy={reviewBusy}
                                            currentUser={currentUser}
                                            onEdit={handleEditReview}
                                            onDelete={handleDeleteReview}
                                            onInteractionChange={handleReviewInteractionChange}
                                        />
                                    ))}
                                </div>

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-txt-faint">
                                        {getReviewsRangeLabel({
                                            currentPage: reviewsMeta.current_page,
                                            perPage: reviewsMeta.per_page,
                                            total: reviewsMeta.total,
                                        })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <ReviewPaginationButton
                                            onClick={() => handleReviewsPageChange(reviewsPage - 1)}
                                            disabled={
                                                reviewsLoading
                                                || reviewsPage <= 1
                                            }
                                        >
                                            Anterior
                                        </ReviewPaginationButton>
                                        <ReviewPaginationButton
                                            onClick={() => handleReviewsPageChange(reviewsPage + 1)}
                                            disabled={
                                                reviewsLoading
                                                || reviewsPage >= reviewsMeta.last_page
                                            }
                                        >
                                            Siguiente
                                        </ReviewPaginationButton>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <SectionEmpty
                                title="Aún no hay reseñas"
                                description="Sé el primero en compartir tu opinión sobre esta película."
                            />
                        )}
                    </section>
                </div>

                <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
                    <div className="mb-8">
                        <h3 className="mb-3 font-serif text-lg font-normal text-txt">Ficha técnica</h3>
                        <dl>
                            <TechSheetRow label="Director" value={director} />
                            <TechSheetRow label="Año" value={formatYear(movie.release_date)} />
                            <TechSheetRow label="Duración" value={formatRuntime(movie.runtime)} />
                            <TechSheetRow label="Géneros" value={formatGenres(genres)} />
                            <TechSheetRow
                                label="Votos TMDB"
                                value={movie.vote_count?.toLocaleString('es-ES') ?? '—'}
                            />
                            <TechSheetRow label="Idioma original" value={movie.original_language?.toUpperCase() ?? '—'} />
                        </dl>
                    </div>

                    <div className="mb-8">
                        <h3 className="mb-3 font-serif text-lg font-normal text-txt">Reparto principal</h3>
                        {cast.length > SIDEBAR_CAST_LIMIT ? (
                            <CastCarousel cast={cast} />
                        ) : (
                            <CastSidebarList cast={cast} />
                        )}
                    </div>

                    {similarLoading ? (
                        <div>
                            <h3 className="mb-3 font-serif text-lg font-normal text-txt">Si te gusta esta</h3>
                            <SimilarMoviesSkeleton />
                        </div>
                    ) : similarMovies.length > 0 ? (
                        <div>
                            <h3 className="mb-3 font-serif text-lg font-normal text-txt">Si te gusta esta</h3>
                            <div className="flex flex-col gap-2.5">
                                {similarMovies.map((similarMovie) => (
                                    <SimilarMovieCard
                                        key={similarMovie.tmdb_id}
                                        movie={similarMovie}
                                        onClick={() => handleSimilarMovieClick(similarMovie)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}
                </aside>
            </div>

            <ReviewFormModal
                open={showReviewModal}
                onClose={() => !reviewBusy && setShowReviewModal(false)}
                onSubmit={handlePublishReview}
                loading={reviewBusy}
            />

            {showProposeModal && movie ? (
                <ProposeToGroupModal
                    movie={{
                        tmdb_id: Number(id),
                        title: movie.title,
                        poster_path: movie.poster_path ?? null,
                    }}
                    onClose={() => setShowProposeModal(false)}
                    onSuccess={(groupName) => setProposeSuccess(groupName)}
                />
            ) : null}

            <ConfirmDialog />
        </div>
    );
}
