import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovieSearch } from '../hooks/useMovieSearch';
import MovieSearchField from './MovieSearchField';

export default function MobileSearchModal({ open, onClose }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const {
        input,
        loading,
        error,
        trimmedInput,
        isPendingSearch,
        suggestions,
        handleInputChange,
        commitSearch,
        reset,
    } = useMovieSearch('');

    useEffect(() => {
        if (!open) {
            reset();
            return undefined;
        }

        setShowSuggestions(true);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                onClose();
            }
        };

        const desktopQuery = window.matchMedia('(min-width: 768px)');
        const onDesktop = (event) => {
            if (event.matches) {
                onClose();
            }
        };

        const onPointerDown = (event) => {
            if (panelRef.current?.contains(event.target)) {
                return;
            }

            onClose();
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('pointerdown', onPointerDown, true);
        desktopQuery.addEventListener('change', onDesktop);

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('pointerdown', onPointerDown, true);
            desktopQuery.removeEventListener('change', onDesktop);
        };
    }, [open, onClose, reset]);

    if (!open) {
        return null;
    }

    const handleSubmit = () => {
        if (!commitSearch()) {
            setShowSuggestions(true);
            return;
        }

        navigate(`/filmdex?q=${encodeURIComponent(trimmedInput)}`);
        onClose();
    };

    const handleSuggestionClick = () => {
        onClose();
    };

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar películas"
            className="fixed inset-0 z-[9999] md:hidden"
        >
            <div
                className="absolute inset-0 bg-[#0a0c14]/88 backdrop-blur-md"
                aria-hidden="true"
            />

            <div className="relative flex min-h-full items-start justify-center px-4 pb-8 pt-[14vh]">
                <div
                    ref={panelRef}
                    className="w-full max-w-lg rounded-xl border border-border-strong bg-bg-elev p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-5"
                >
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="font-serif text-lg text-txt">Buscar películas</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-md p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt"
                            aria-label="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <MovieSearchField
                        inputRef={inputRef}
                        input={input}
                        onInputChange={(value) => {
                            handleInputChange(value);
                            setShowSuggestions(true);
                        }}
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                        suggestions={suggestions}
                        showSuggestions={showSuggestions}
                        suggestionsBusy={isPendingSearch || loading}
                        onSuggestionClick={handleSuggestionClick}
                        onFocus={() => setShowSuggestions(true)}
                        autoFocus
                        placeholder="Buscar películas, directores, géneros…"
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}
