import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ButtonLoader from './ButtonLoader';
import StarRating from './StarRating';

const MAX_REVIEW_LENGTH = 280;

const EMPTY_FORM = {
    rating: null,
    watched_at: '',
    body: '',
};

export default function ReviewFormModal({
    open,
    onClose,
    onSubmit,
    loading = false,
    initialValues = null,
    title = 'Añadir reseña',
    movieTitle = '',
}) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(initialValues ?? EMPTY_FORM);
    }, [open, initialValues]);

    if (!open) {
        return null;
    }

    const canSubmit = Boolean(form.rating);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!canSubmit || loading) {
            return;
        }

        onSubmit({
            rating: form.rating,
            watched_at: form.watched_at || null,
            body: form.body.trim(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm"
            />

            <div className="relative z-10 w-full max-w-lg rounded-xl border border-border-strong bg-bg-elev p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="font-serif text-xl text-txt">{title}</h3>
                        {movieTitle && (
                            <p className="mt-1 truncate text-sm text-txt-dim">{movieTitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="cursor-pointer rounded-md p-1 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint">
                            Tu puntuación
                        </p>
                        <div className="flex items-center gap-3">
                            <StarRating
                                value={form.rating}
                                onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
                                disabled={loading}
                                size={24}
                            />
                            {form.rating ? (
                                <span className="text-sm text-gold">{form.rating} / 5</span>
                            ) : (
                                <span className="text-sm text-txt-faint">Selecciona de 1 a 5</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="review-watched-at"
                            className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint"
                        >
                            ¿Cuándo la viste?
                        </label>
                        <input
                            id="review-watched-at"
                            type="date"
                            value={form.watched_at}
                            max={new Date().toISOString().slice(0, 10)}
                            disabled={loading}
                            onChange={(e) => setForm((prev) => ({ ...prev, watched_at: e.target.value }))}
                            className="w-full rounded-lg border border-border-soft bg-white/2.5 px-3 py-2 text-sm text-txt outline-none transition-colors focus:border-gold/35 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="review-body"
                            className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint"
                        >
                            Comentario <span className="font-normal normal-case tracking-normal text-txt-faint">(opcional)</span>
                        </label>
                        <textarea
                            id="review-body"
                            rows={4}
                            value={form.body}
                            disabled={loading}
                            onChange={(e) => setForm((prev) => ({
                                ...prev,
                                body: e.target.value.slice(0, MAX_REVIEW_LENGTH),
                            }))}
                            placeholder="Comparte qué te ha parecido la película…"
                            className="w-full resize-none rounded-lg border border-border-soft bg-white/2.5 px-3 py-2 text-sm leading-relaxed text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 disabled:opacity-50"
                        />
                        <p className={`mt-1.5 text-[11px] ${form.body.length > MAX_REVIEW_LENGTH - 20 ? 'text-[#E66B5C]' : 'text-txt-faint'}`}>
                            {form.body.length} / {MAX_REVIEW_LENGTH}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="cursor-pointer rounded-lg border border-border-soft px-4 py-2 text-sm text-txt-dim disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !canSubmit}
                            className="inline-flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? <ButtonLoader size={16} className="text-white" /> : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
