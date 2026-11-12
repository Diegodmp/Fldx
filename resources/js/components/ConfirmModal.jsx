import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import ButtonLoader from './ButtonLoader';

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    loading = false,
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) {
                onCancel();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, loading, onCancel]);

    if (!open) {
        return null;
    }

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onCancel}
                disabled={loading}
                className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
            />

            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-message"
                className="relative z-10 w-full max-w-md rounded-xl border border-border-strong bg-bg-elev p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            >
                <div className="mb-4 flex items-start gap-3">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            isDanger
                                ? 'bg-[rgba(230,107,92,0.12)] text-[#E66B5C]'
                                : 'bg-gold/10 text-gold'
                        }`}
                    >
                        <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                        <h3 id="confirm-modal-title" className="font-serif text-xl text-txt">
                            {title}
                        </h3>
                        {message && (
                            <p id="confirm-modal-message" className="mt-2 text-sm leading-relaxed text-txt-dim">
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="cursor-pointer rounded-lg border border-border-soft px-4 py-2 text-sm text-txt-dim transition-colors hover:bg-white/5 hover:text-txt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`inline-flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isDanger
                                ? 'border-[rgba(230,107,92,0.35)] bg-[rgba(230,107,92,0.15)] text-[#E66B5C]'
                                : 'border-white/10 bg-primary text-white'
                        }`}
                    >
                        {loading ? <ButtonLoader size={16} className={isDanger ? 'text-[#E66B5C]' : 'text-white'} /> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
