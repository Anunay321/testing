import { Star } from "lucide-react";

export default function StarRating({ value, onChange, readOnly = false, size = 26 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={n <= value ? "fill-amber text-amber" : "text-line"}
          />
        </button>
      ))}
    </div>
  );
}
