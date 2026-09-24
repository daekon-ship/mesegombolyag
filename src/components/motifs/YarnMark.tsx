interface YarnMarkProps {
  className?: string;
}

/** Small hand-drawn yarn-ball mark used beside the wordmark. */
export function YarnMark({ className }: YarnMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 8c-9.4 0-17 6.8-17 16.2 0 6.8 4.7 11.6 10 11.6 4.3 0 7.8-3.3 7.8-7.6 0-3.2-2.3-5.6-5.3-5.6-2.2 0-3.7 1.4-3.7 3.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M24 8c6.5 1.7 11 7.4 11 14.6 0 5.9-3.6 10.4-8.4 11.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M15.5 15.5c5-3.6 11.4-4 16 .4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="17.2" cy="27.4" r="1.4" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
