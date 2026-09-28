import confetti from "canvas-confetti";
import { boardStore } from "@/lib/board-store";
import { celebrateDef, filterBoardDef, focusFeatureDef } from "@/lib/tool-defs";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

// The browser half of the client tools: the model calls them, the page runs them.
export const clientTools = [
  focusFeatureDef.client(async ({ id }) => {
    boardStore.set({ focusId: id, tag: "" });
    await nextFrame();
    const el = document.querySelector(`[data-feature-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    setTimeout(() => boardStore.get().focusId === id && boardStore.set({ focusId: null }), 4000);
    return { focused: !!el };
  }),
  filterBoardDef.client(async ({ tag }) => {
    boardStore.set({ tag: tag.trim().toLowerCase() });
    await nextFrame();
    return { visible: boardStore.get().visibleCount };
  }),
  celebrateDef.client(async () => {
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors: ["#f97316", "#fbbf24", "#fde68a", "#ffffff"] });
    return { ok: true };
  }),
];
