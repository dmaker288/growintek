export default function Stars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="star"
          >
            <defs>
              <linearGradient id={`half-${i}-${size}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.47 5.34 5.53.62-4.13 3.86 1.18 5.58L10 14.1l-5.05 2.9 1.18-5.58L2 7.56l5.53-.62z"
              fill={
                fill === 1
                  ? "currentColor"
                  : fill === 0.5
                    ? `url(#half-${i}-${size})`
                    : "transparent"
              }
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
      <style>{`
        .stars { display: inline-flex; gap: 2px; color: #8a6a12; align-items: center; }
      `}</style>
    </span>
  );
}
