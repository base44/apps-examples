// Pure formatting + derivation helpers. No I/O, no framework — trivially
// testable and safe on both server and client.

import type { DealStage } from "./types.js";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$12,500" — compact, no cents. */
export function formatCurrency(amount: number | undefined | null): string {
  return currencyFormatter.format(amount ?? 0);
}

/** "$1.2M" / "$45k" — for tight KPI tiles. */
export function formatCompactCurrency(amount: number | undefined | null): string {
  const n = amount ?? 0;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

/** "Jul 6, 2026" or "" when absent. */
export function formatDate(value: string | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "3 days ago" / "in 2 days" / "today" — relative to now. */
export function formatRelative(value: string | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days < 0) return `${-days} days ago`;
  return `in ${days} days`;
}

/** Two-letter initials for an avatar chip. */
export function initials(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const STAGE_ACCENTS: Record<DealStage, string> = {
  lead: "#64748b",
  qualified: "#0ea5e9",
  proposal: "#6366f1",
  negotiation: "#f97316",
  won: "#16a34a",
  lost: "#94a3b8",
};

/** Accent color for a stage — shared by the board and dashboard. */
export function stageAccent(stage: DealStage): string {
  return STAGE_ACCENTS[stage] ?? "#64748b";
}
