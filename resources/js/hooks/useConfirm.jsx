import { useCallback, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_OPTIONS = {
    title: '¿Confirmar?',
    message: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    variant: 'default',
};

export function useConfirm() {
    const resolveRef = useRef(null);
    const [options, setOptions] = useState(null);

    const confirm = useCallback((overrides = {}) => new Promise((resolve) => {
        resolveRef.current = resolve;
        setOptions({ ...DEFAULT_OPTIONS, ...overrides });
    }), []);

    const close = useCallback((result) => {
        resolveRef.current?.(result);
        resolveRef.current = null;
        setOptions(null);
    }, []);

    const ConfirmDialog = useCallback(() => (
        <ConfirmModal
            open={options != null}
            title={options?.title ?? DEFAULT_OPTIONS.title}
            message={options?.message ?? DEFAULT_OPTIONS.message}
            confirmLabel={options?.confirmLabel ?? DEFAULT_OPTIONS.confirmLabel}
            cancelLabel={options?.cancelLabel ?? DEFAULT_OPTIONS.cancelLabel}
            variant={options?.variant ?? DEFAULT_OPTIONS.variant}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
        />
    ), [close, options]);

    return { confirm, ConfirmDialog };
}
