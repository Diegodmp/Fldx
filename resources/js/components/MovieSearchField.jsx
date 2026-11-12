import { Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTER_THUMB = 'https://image.tmdb.org/t/p/w92';

function formatYear(releaseDate) {
    if (!releaseDate) {
        return '—';
    }

    return releaseDate.slice(0, 4) || '—';
}

function SuggestionItem({ movie, onMovieSelect, onSuggestionClick }) {
    const content = (
        <>
            {movie.poster_path ? (
                <img
                    src={`${POSTER_THUMB}${movie.poster_path}`}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-zinc-700/80 text-[10px] text-txt-faint">
                    —
                </div>
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-txt">
                    {movie.title}
                </span>
                <span className="block text-xs text-txt-faint">
                    {formatYear(movie.release_date)}
                </span>
            </span>
        </>
    );

    if (onMovieSelect) {
        return (
            <button
                type="button"
                onClick={() => {
                    onMovieSelect(movie);
                    onSuggestionClick?.(movie);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-inherit transition-colors hover:bg-white/5"
            >
                {content}
            </button>
        );
    }

    return (
        <Link
            to={`/movies/${movie.id}`}
            onClick={() => onSuggestionClick?.(movie)}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left no-underline text-inherit transition-colors hover:bg-white/5"
        >
            {content}
        </Link>
    );
}

export default function MovieSearchField({
    inputRef,
    input,
    onInputChange,
    onSubmit,
    loading = false,
    error = '',
    suggestions = [],
    showSuggestions = false,
    suggestionsBusy = false,
    onSuggestionClick,
    onMovieSelect,
    onFocus,
    autoFocus = false,
    placeholder = 'Título, director, actor…',
    submitLabel = 'Buscar',
    showSubmitButton = true,
    className = '',
    suggestionsClassName = '',
}) {
    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.();
    };

    const showDropdown = showSuggestions && input.trim().length >= 2;

    return (
        <div className={className}>
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative min-w-0 flex-1">
                    <SearchIcon
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-txt-faint"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onFocus={onFocus}
                        placeholder={placeholder}
                        autoComplete="off"
                        autoFocus={autoFocus}
                        className="w-full rounded-lg border border-border-soft bg-white/2.5 py-2.5 pl-10 pr-4 text-sm text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 focus:bg-white/[0.04]"
                    />
                </div>
                {showSubmitButton && (
                    <button
                        type="submit"
                        disabled={loading}
                        className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                    >
                        {submitLabel}
                    </button>
                )}
            </form>

            {showDropdown && (
                <div
                    className={`mt-2 overflow-hidden rounded-xl border border-border-strong bg-bg-elev shadow-[0_14px_40px_rgba(0,0,0,0.4)] ${suggestionsClassName}`}
                >
                    {suggestionsBusy && (
                        <div className="px-4 py-3 text-sm text-txt-dim">
                            Buscando sugerencias…
                        </div>
                    )}

                    {!suggestionsBusy && suggestions.length === 0 && !error && (
                        <div className="px-4 py-3 text-sm text-txt-dim">
                            No hay sugerencias para este término.
                        </div>
                    )}

                    {!suggestionsBusy && error && (
                        <div className="px-4 py-3 text-sm text-[#E66B5C]">
                            {error}
                        </div>
                    )}

                    {!suggestionsBusy && suggestions.length > 0 && (
                        <ul className="max-h-64 overflow-y-auto py-1 sm:max-h-80">
                            {suggestions.map((movie) => (
                                <li key={movie.id}>
                                    <SuggestionItem
                                        movie={movie}
                                        onMovieSelect={onMovieSelect}
                                        onSuggestionClick={onSuggestionClick}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
