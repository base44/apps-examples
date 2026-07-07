// Kanban state + client-side persistence. Seeds from the SSR loader data, then
// owns the board locally: dragging a card between columns optimistically moves
// it and writes the new stage straight to Base44 with the BROWSER SDK
// (base44.entities.Deal.update) — the client-side write the showcase calls for.
// The write runs as the logged-in rep, so RLS still applies.

import { useCallback, useState } from "react";
import { getBrowserClient } from "../../lib/browser-client.js";
import {
  STAGES,
  type Base44Config,
  type Deal,
  type DealStage,
} from "../../lib/types.js";

interface Column {
  id: DealStage;
  label: string;
  deals: Deal[];
  total: number;
}

export function useKanban(base44: Base44Config, initialDeals: Deal[]) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DealStage | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns: Column[] = STAGES.map((s) => {
    const colDeals = deals.filter((d) => d.stage === s.id);
    return {
      id: s.id,
      label: s.label,
      deals: colDeals,
      total: colDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    };
  });

  const moveTo = useCallback(
    async (dealId: string, stage: DealStage) => {
      const current = deals.find((d) => d.id === dealId);
      if (!current || current.stage === stage) return;

      const previous = current.stage;
      setDeals((list) => list.map((d) => (d.id === dealId ? { ...d, stage } : d)));
      setSavingId(dealId);
      setError(null);

      try {
        await getBrowserClient(base44).entities.Deal.update(dealId, { stage });
      } catch {
        // Roll back the optimistic move on failure.
        setDeals((list) => list.map((d) => (d.id === dealId ? { ...d, stage: previous } : d)));
        setError("Couldn't save that move. Please try again.");
      } finally {
        setSavingId(null);
      }
    },
    [base44, deals],
  );

  const addDeal = useCallback((deal: Deal) => {
    setDeals((list) => [deal, ...list]);
  }, []);

  const onDragStart = useCallback((id: string) => setDraggingId(id), []);
  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const onDrop = useCallback(
    (stage: DealStage) => {
      if (draggingId) void moveTo(draggingId, stage);
      setDraggingId(null);
      setDropTarget(null);
    },
    [draggingId, moveTo],
  );

  return {
    columns,
    draggingId,
    dropTarget,
    savingId,
    error,
    setDropTarget,
    onDragStart,
    onDragEnd,
    onDrop,
    addDeal,
  };
}
