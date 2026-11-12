import ButtonLoader from './ButtonLoader';
import { getWatchConfig } from '../utils/watchState';

export default function WatchButton({
    watchState = 'none',
    onChange,
    loading = false,
    disabled = false,
    compact = false,
    className = '',
}) {
    const cfg = getWatchConfig(watchState);
    const Icon = cfg.Icon;

    return (
        <button
            type="button"
            disabled={disabled || loading}
            onClick={onChange}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-[13px]'} ${className}`}
            style={{
                background: cfg.bg,
                borderColor: cfg.border,
                color: cfg.color,
                boxShadow: watchState !== 'none' ? '0 4px 24px rgba(201,168,76,0.15)' : 'none',
            }}
        >
            {loading ? (
                <ButtonLoader size={compact ? 12 : 14} style={{ color: cfg.color }} />
            ) : (
                <Icon size={compact ? 12 : 14} />
            )}
            {cfg.label}
        </button>
    );
}
