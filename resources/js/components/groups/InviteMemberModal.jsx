import { useEffect, useState } from 'react';
import { Mail, User, X } from 'lucide-react';
import ButtonLoader from '../ButtonLoader';

export default function InviteMemberModal({
    open,
    onClose,
    onSubmit,
    loading = false,
}) {
    const [mode, setMode] = useState('email');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }

        setMode('email');
        setEmail('');
        setUserId('');
    }, [open]);

    if (!open) {
        return null;
    }

    const canSubmit = mode === 'email'
        ? email.trim().length > 0
        : userId.trim().length > 0;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!canSubmit || loading) {
            return;
        }

        if (mode === 'email') {
            onSubmit({ email: email.trim() });
            return;
        }

        onSubmit({ user_id: Number.parseInt(userId, 10) });
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
                    <div>
                        <h3 className="font-serif text-xl text-txt">Invitar miembro</h3>
                        <p className="mt-1 text-sm text-txt-dim">
                            Invita por email o con el ID de usuario.
                        </p>
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

                <div className="mb-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('email')}
                        className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            mode === 'email'
                                ? 'border-gold/35 bg-gold/10 text-gold'
                                : 'border-border-soft bg-white/2 text-txt-dim hover:text-txt'
                        }`}
                    >
                        <Mail size={14} />
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('user')}
                        className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            mode === 'user'
                                ? 'border-gold/35 bg-gold/10 text-gold'
                                : 'border-border-soft bg-white/2 text-txt-dim hover:text-txt'
                        }`}
                    >
                        <User size={14} />
                        ID usuario
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'email' ? (
                        <div>
                            <label htmlFor="invite-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint">
                                Email
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                value={email}
                                disabled={loading}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="usuario@ejemplo.com"
                                className="w-full rounded-lg border border-border-soft bg-white/2.5 px-3 py-2.5 text-sm text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 disabled:opacity-50"
                            />
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="invite-user-id" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-txt-faint">
                                ID de usuario
                            </label>
                            <input
                                id="invite-user-id"
                                type="number"
                                min="1"
                                value={userId}
                                disabled={loading}
                                onChange={(event) => setUserId(event.target.value)}
                                placeholder="Ej. 42"
                                className="w-full rounded-lg border border-border-soft bg-white/2.5 px-3 py-2.5 text-sm text-txt outline-none transition-colors placeholder:text-txt-faint focus:border-gold/35 disabled:opacity-50"
                            />
                        </div>
                    )}

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
                            {loading ? <ButtonLoader size={16} className="text-white" /> : 'Enviar invitación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
