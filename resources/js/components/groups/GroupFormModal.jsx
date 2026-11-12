import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ButtonLoader from '../ButtonLoader';

const EMPTY_FORM = {
    name: '',
    description: '',
};

export default function GroupFormModal({
    open,
    onClose,
    onSubmit,
    loading = false,
    title,
    submitLabel,
    initialValues = EMPTY_FORM,
    error = '',
}) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm({
            name: initialValues.name ?? '',
            description: initialValues.description ?? '',
        });
    }, [open, initialValues]);

    if (!open) {
        return null;
    }

    const canSubmit = form.name.trim().length > 0;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!canSubmit || loading) {
            return;
        }

        onSubmit({
            name: form.name.trim(),
            description: form.description.trim() || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                disabled={loading}
                className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
            />

            <div className="relative z-10 w-full max-w-lg rounded-xl border border-border-strong bg-bg-elev p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h3 className="font-serif text-xl text-txt">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="cursor-pointer rounded-md p-1 text-txt-faint transition-colors hover:bg-white/5 hover:text-txt disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-2 text-sm text-[#E66B5C]">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="group-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint">
                            Nombre
                        </label>
                        <input
                            id="group-name"
                            type="text"
                            value={form.name}
                            disabled={loading}
                            onChange={(event) => setForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                            }))}
                            placeholder="Nombre del grupo"
                            className="w-full rounded-lg border border-border-soft bg-white/2.5 px-3 py-2.5 text-sm text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label htmlFor="group-description" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint">
                            Descripción
                        </label>
                        <textarea
                            id="group-description"
                            rows={4}
                            value={form.description}
                            disabled={loading}
                            onChange={(event) => setForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                            }))}
                            placeholder="Describe de qué trata el grupo…"
                            className="w-full resize-none rounded-lg border border-border-soft bg-white/2.5 px-3 py-2.5 text-sm leading-relaxed text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 disabled:opacity-50"
                        />
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
                            {loading ? <ButtonLoader size={16} className="text-white" /> : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
