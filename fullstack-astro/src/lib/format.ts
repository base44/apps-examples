// Presentation helpers shared by server frontmatter and client scripts.

/** Format a price in major units (e.g. 22 -> "$22.00") using Intl. */
export function formatPrice(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to a plain number.
    return `${currency} ${amount.toFixed(2)}`;
  }
}

const ROAST_LABELS: Record<string, string> = {
  light: "Light roast",
  medium: "Medium roast",
  "medium-dark": "Medium-dark roast",
  dark: "Dark roast",
};

export function roastLabel(roast?: string): string | null {
  if (!roast) return null;
  return ROAST_LABELS[roast] ?? roast;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Deterministic warm accent colour derived from a string (for live products
 *  that don't carry an explicit `accent`). Keeps generated tiles on-brand. */
export function accentFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffff;
  }
  const palette = [
    "#c26b3f",
    "#a8552b",
    "#5b4632",
    "#d08b3c",
    "#3f5f52",
    "#6d8a7a",
    "#b06a34",
    "#7a5c3e",
  ];
  return palette[Math.abs(hash) % palette.length];
}
