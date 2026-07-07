// Tiny inline icon set (no icon-library dependency). Each returns an <svg>.
type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
};

export function BedIcon(p: P) {
  return (
    <svg {...base} {...p} aria-hidden="true">
      <path d="M3 7v11M3 12h18v6M21 12v6M3 12V8a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4" />
    </svg>
  );
}

export function BathIcon(p: P) {
  return (
    <svg {...base} {...p} aria-hidden="true">
      <path d="M4 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3ZM6 19l-1 2M18 19l1 2" />
    </svg>
  );
}

export function AreaIcon(p: P) {
  return (
    <svg {...base} {...p} aria-hidden="true">
      <path d="M4 4h16v16H4zM4 9h5M15 20v-5M20 15h-5M9 4v5" />
    </svg>
  );
}

export function PinIcon(p: P) {
  return (
    <svg {...base} {...p} aria-hidden="true">
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function SearchIcon(p: P) {
  return (
    <svg {...base} {...p} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function HeartIcon({ filled, ...p }: P & { filled?: boolean }) {
  return (
    <svg
      {...base}
      {...p}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.7-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10.5c0 5.3-7.5 10-7.5 10Z" />
    </svg>
  );
}
