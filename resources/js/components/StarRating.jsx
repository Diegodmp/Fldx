import { Star } from 'lucide-react';

export default function StarRating({
    value = null,
    onChange,
    disabled = false,
    readOnly = false,
    size = 16,
    showNumber = false,
}) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                    const filled = value !== null && star <= value;
                    const interactive = !readOnly && onChange && !disabled;

                    if (interactive) {
                        return (
                            <button
                                key={star}
                                type="button"
                                disabled={disabled}
                                onClick={() => onChange(star)}
                                aria-label={`Valorar con ${star} estrellas`}
                                className="cursor-pointer rounded p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Star
                                    size={size}
                                    className={filled
                                        ? 'fill-gold text-gold'
                                        : 'text-txt-faint hover:text-gold/70'}
                                />
                            </button>
                        );
                    }

                    return (
                        <Star
                            key={star}
                            size={size}
                            className={filled ? 'fill-gold text-gold' : 'text-txt-faint'}
                        />
                    );
                })}
            </div>
            {showNumber && value !== null && (
                <span className="text-xs text-gold">{value}</span>
            )}
        </div>
    );
}
