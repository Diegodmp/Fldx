import { Trash2 } from 'lucide-react';
import ButtonLoader from './ButtonLoader';
import StarRating from './StarRating';

export default function WatchlistControls({
    status,
    rating,
    onStatusChange,
    onRatingChange,
    onRemove,
    loading = false,
    compact = false,
    showRating = true,
    fullWidth = false,
}) {
    return (
        <div className={`flex flex-wrap items-center gap-3 ${fullWidth ? 'w-full' : ''}`}>
            <label className="flex items-center gap-2 text-sm text-txt-dim">
                <span className="text-txt-faint">Estado:</span>
                <select
                    value={status}
                    disabled={loading}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="cursor-pointer rounded-lg border border-border-soft bg-white/2.5 px-3 py-1.5 text-sm text-txt outline-none transition-colors focus:border-gold/35 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="pending">Pendiente</option>
                    <option value="watched">Vista</option>
                </select>
            </label>

            {showRating && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-txt-faint">Rating:</span>
                    <StarRating
                        value={rating}
                        onChange={onRatingChange}
                        disabled={loading}
                        size={compact ? 14 : 16}
                    />
                </div>
            )}

            <button
                type="button"
                disabled={loading}
                onClick={onRemove}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[rgba(230,107,92,0.25)] bg-[rgba(230,107,92,0.08)] px-3 py-1.5 text-sm text-[#E66B5C] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? (
                    <ButtonLoader size={14} className="text-[#E66B5C]" />
                ) : (
                    <Trash2 size={14} />
                )}
                Quitar de watchlist
            </button>
        </div>
    );
}
