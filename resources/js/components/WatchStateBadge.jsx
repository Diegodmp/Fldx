import { getWatchConfig } from '../utils/watchState';

export default function WatchStateBadge({ watchState = 'none', className = '' }) {
    if (watchState === 'none') {
        return null;
    }

    const cfg = getWatchConfig(watchState);
    const Icon = cfg.Icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${className}`}
            style={{
                background: cfg.bg,
                borderColor: cfg.border,
                color: cfg.color,
            }}
        >
            <Icon size={10} />
            {cfg.label}
        </span>
    );
}
