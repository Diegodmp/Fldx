import { Link } from 'react-router-dom';
import WatchButton from './WatchButton';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

export default function MovieCardMini({
    entry,
    watchState,
    busy = false,
    onToggleWatch,
}) {
    const movie = entry.movie;

    if (!movie) {
        return null;
    }

    return (
        <article className="flex items-center gap-3 rounded-xl border border-border-soft bg-white/2 px-3 py-2.5">
            <Link
                to={`/movies/${movie.tmdb_id}`}
                className="shrink-0 no-underline"
            >
                {movie.poster_path ? (
                    <img
                        src={`${POSTER_BASE}${movie.poster_path}`}
                        alt={movie.title}
                        className="h-16 w-11 rounded-md object-cover transition-opacity hover:opacity-90"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-16 w-11 items-center justify-center rounded-md bg-white/4 text-[10px] text-txt-faint">
                        —
                    </div>
                )}
            </Link>

            <div className="min-w-0 flex-1">
                <Link
                    to={`/movies/${movie.tmdb_id}`}
                    className="no-underline hover:opacity-90"
                >
                    <h3 className="truncate font-serif text-sm leading-tight text-txt">
                        {movie.title}
                    </h3>
                </Link>
                <p className="watchlist-card-meta mt-0.5 text-xs text-txt-faint">
                    {movie.release_year ?? '—'}
                </p>
            </div>

            <WatchButton
                watchState={watchState}
                onChange={() => onToggleWatch(entry)}
                loading={busy}
                compact
            />
        </article>
    );
}
