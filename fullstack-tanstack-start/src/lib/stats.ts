// Pure pipeline math. No I/O — the dashboard server function feeds it the
// user's deals (already RLS-scoped) and renders the result.

import { STAGES, OPEN_STAGES, type Deal, type DashboardStats } from "./types.js";

const PROBABILITY = new Map(STAGES.map((s) => [s.id, s.probability]));

export function computeStats(deals: Deal[]): DashboardStats {
  const open = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");

  const sum = (list: Deal[]) => list.reduce((total, d) => total + (d.amount ?? 0), 0);

  const openValue = sum(open);
  const wonValue = sum(won);
  const weightedValue = open.reduce(
    (total, d) => total + (d.amount ?? 0) * (PROBABILITY.get(d.stage) ?? 0),
    0,
  );

  const decided = won.length + lost.length;
  const winRate = decided > 0 ? won.length / decided : null;

  const byStage = STAGES.map((s) => {
    const stageDeals = deals.filter((d) => d.stage === s.id);
    return { stage: s.id, label: s.label, count: stageDeals.length, value: sum(stageDeals) };
  });

  const horizon = Date.now() + 30 * 86_400_000;
  const closingSoon = open
    .filter((d) => {
      if (!d.close_date) return false;
      const t = new Date(d.close_date).getTime();
      return !Number.isNaN(t) && t <= horizon;
    })
    .sort(
      (a, b) =>
        new Date(a.close_date as string).getTime() -
        new Date(b.close_date as string).getTime(),
    )
    .slice(0, 5);

  return {
    openValue,
    weightedValue,
    wonValue,
    openCount: open.length,
    wonCount: won.length,
    lostCount: lost.length,
    winRate,
    byStage,
    closingSoon,
  };
}
