import { useSyncExternalStore } from "react";

// The little bit of page state the copilot's client tools drive: which card is
// highlighted and which tag filters the board. Outside React so a tool's
// execute() can set it without a component in scope.
let state = { focusId: null, tag: "", visibleCount: 0 };
const listeners = new Set();

export const boardStore = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useBoardState = () => useSyncExternalStore(boardStore.subscribe, boardStore.get, boardStore.get);
