import type { AgentEvent } from "./base44";

export type Part =
  | { type: "reasoning"; id: string; text: string }
  | { type: "text"; id: string; text: string }
  | { type: "tool"; id: string; code: string; output?: string; error?: string };

export type Turn =
  | { role: "user"; id: string; text: string }
  | { role: "assistant"; id: string; parts: Part[] }
  | { role: "error"; id: string; text: string };

/** Folds the flat event log into chat turns: each tick is a user turn, the model's parts follow it. */
export function toTurns(events: AgentEvent[]): Turn[] {
  const turns: Turn[] = [];
  const tools = new Map<string, Extract<Part, { type: "tool" }>>();
  const assistant = () => {
    const last = turns.at(-1);
    if (last?.role === "assistant") return last;
    const turn: Turn = { role: "assistant", id: `a-${turns.length}`, parts: [] };
    turns.push(turn);
    return turn;
  };
  for (const e of events) {
    const content = e.content ?? "";
    if (e.kind === "tick") turns.push({ role: "user", id: e.id, text: content });
    else if (e.kind === "error") turns.push({ role: "error", id: e.id, text: content });
    else if (e.kind === "reasoning" || e.kind === "text") assistant().parts.push({ type: e.kind, id: e.id, text: content });
    else if (e.kind === "tool-call") {
      const part = { type: "tool" as const, id: e.id, code: content };
      if (e.call_id) tools.set(e.call_id, part);
      assistant().parts.push(part);
    } else if (e.kind === "tool-result" || e.kind === "tool-error") {
      const part = e.call_id && tools.get(e.call_id);
      if (part) part[e.kind === "tool-result" ? "output" : "error"] = content;
    }
  }
  return turns;
}
