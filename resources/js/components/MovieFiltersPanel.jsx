import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { SORT_OPTIONS } from '../utils/movieFilters';

const inputClassName = 'w-full rounded-lg border border-border-soft bg-white/2.5 px-3 py-2.5 text-sm text-txt outline-none transition-colors focus:border-gold/35 focus:bg-white/[0.04]';

export default function MovieFiltersPanel({
    open,
    onClose,
    draftFilters,
    onDraftChange,
    genres = [],
    genresLoading = false,
    onApply,
    onClear,
}) {
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
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
        document.addEventListener('pointerdown', onPointerDown, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown, true);
        };
    }, [open, onClose]);

    const toggleGenre = (genreId) => {
        const current = draftFilters.genreIds ?? [];
        const next = current.includes(genreId)
            ? current.filter((id) => id !== genreId)
            : [...current, genreId];

        onDraftChange({ ...draftFilters, genreIds: next });
    };

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de búsqueda"
            className="fixed inset-0 z-[9998]"
        >
            <div
                className="absolute inset-0 bg-[#0a0c14]/75 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div className="relative flex h-full md:justify-end">
                <div
                    ref={panelRef}
                    className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl border border-border-strong border-b-0 bg-bg-elev shadow-[0_-16px_60px_rgba(0,0,0,0.55)] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-2xl md:border-b md:border-l md:border-r-0 md:shadow-[-16px_0_60px_rgba(0,0,0,0.45)]"
                >
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-soft px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-gold" />
                            <h2 className="font-serif text-lg text-txt">Filtros</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-md p-1.5 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt"
                            aria-label="Cerrar filtros"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                        <div className="space-y-6">
                            <section>
                                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-txt-faint">
                                    Género
                                </h3>
                                {genresLoading && (
                                    <p className="text-sm text-txt-dim">Cargando géneros…</p>
                                )}
                                {!genresLoading && genres.length === 0 && (
                                    <p className="text-sm text-txt-dim">No se pudieron cargar los géneros.</p>
                                )}
                                {!genresLoading && genres.length > 0 && (
                                    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                                        {genres.map((genre) => {
                                            const selected = draftFilters.genreIds?.includes(genre.id);

                                            return (
                                                <button
                                                    key={genre.id}
                                                    type="button"
                                                    onClick={() => toggleGenre(genre.id)}
                                                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                                        selected
                                                            ? 'border-gold/45 bg-gold/12 text-gold'
                                                            : 'border-border-soft bg-white/2 text-txt-dim hover:border-border-strong hover:bg-white/4 hover:text-txt'
                                                    }`}
                                                >
                                                    {genre.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section>
                                <label htmlFor="filter-year" className="mb-2 block text-xs font-medium uppercase tracking-wide text-txt-faint">
                                    Año
                                </label>
                                <input
                                    id="filter-year"
                                    type="number"
                                    min="1870"
                                    max="2100"
                                    step="1"
                                    inputMode="numeric"
                                    placeholder="Ej. 2023"
                                    value={draftFilters.year}
                                    onChange={(event) => onDraftChange({
                                        ...draftFilters,
                                        year: event.target.value.replace(/\D/g, '').slice(0, 4),
                                    })}
                                    className={inputClassName}
                                />
                            </section>

                            <section>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <label htmlFor="filter-rating" className="text-xs font-medium uppercase tracking-wide text-txt-faint">
                                        Valoración mínima
                                    </label>
                                    <span className="text-sm tabular-nums text-gold">
                                        {draftFilters.minRating != null
                                            ? `${draftFilters.minRating}/10`
                                            : 'Cualquiera'}
                                    </span>
                                </div>
                                <input
                                    id="filter-rating"
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={draftFilters.minRating ?? 1}
                                    onChange={(event) => onDraftChange({
                                        ...draftFilters,
                                        minRating: Number.parseFloat(event.target.value),
                                    })}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-gold"
                                />
                                <div className="mt-2 flex justify-between text-[11px] text-txt-faint">
                                    <span>1</span>
                                    <span>10</span>
                                </div>
                                {draftFilters.minRating != null && (
                                    <button
                                        type="button"
                                        onClick={() => onDraftChange({ ...draftFilters, minRating: null })}
                                        className="mt-2 cursor-pointer text-xs text-txt-dim underline-offset-2 hover:text-txt hover:underline"
                                    >
                                        Quitar valoración mínima
                                    </button>
                                )}
                            </section>

                            <section>
                                <label htmlFor="filter-sort" className="mb-2 block text-xs font-medium uppercase tracking-wide text-txt-faint">
                                    Ordenar por
                                </label>
                                <select
                                    id="filter-sort"
                                    value={draftFilters.sortBy}
                                    onChange={(event) => onDraftChange({
                                        ...draftFilters,
                                        sortBy: event.target.value,
                                    })}
                                    className={`${inputClassName} cursor-pointer`}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value} className="bg-bg-elev text-txt">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </section>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-3 border-t border-border-soft px-4 py-4 sm:px-5">
                        <button
                            type="button"
                            onClick={onClear}
                            className="flex-1 cursor-pointer rounded-lg border border-border-strong bg-white/2 px-4 py-2.5 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt"
                        >
                            Limpiar filtros
                        </button>
                        <button
                            type="button"
                            onClick={onApply}
                            className="flex-1 cursor-pointer rounded-lg border border-white/10 bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
