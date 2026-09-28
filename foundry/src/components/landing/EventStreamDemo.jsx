import { useEffect, useState } from "react";

// A scripted replay of one copilot turn, in the AG-UI events the real stream
// carries. Purely decorative: the live numbers are in the studio's inspector.
const SCRIPT = [
  { type: "RUN_STARTED", text: "model: automatic" },
  { type: "TEXT_MESSAGE_CONTENT", text: "Three features for launch:" },
  { type: "TOOL_CALL_START", text: "addFeatures" },
  { type: "TOOL_CALL_ARGS", text: '{"features":[{"title":"Magic-link onboarding"…' },
  { type: "TOOL_CALL_END", text: "3 cards created · as you" },
  { type: "TOOL_CALL_START", text: "focusFeature  ← client tool" },
  { type: "TOOL_CALL_END", text: "browser scrolled to card" },
  { type: "TEXT_MESSAGE_CONTENT", text: "Onboarding is the biggest lever — impact 5, effort S." },
  { type: "RUN_FINISHED", text: "in 412 · out 186 tokens" },
];

const COLORS = {
  RUN: "text-sky-300",
  TEXT: "text-stone-200",
  TOOL: "text-orange-300",
};
const colorOf = (type) => COLORS[type.split("_")[0]] ?? "text-stone-300";

export function EventStreamDemo() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCount((c) => (c >= SCRIPT.length + 4 ? 0 : c + 1)), 650);
    return () => clearInterval(timer);
  }, []);

  const shown = SCRIPT.slice(0, Math.min(count, SCRIPT.length));
  return (
    <div className="relative min-w-0">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-orange-500/20 via-transparent to-amber-300/10 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-black/60 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">POST /api/copilot · text/event-stream</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
          </span>
        </div>
        <ol className="h-[21rem] space-y-1.5 p-4 font-mono text-[12px] leading-relaxed">
          {shown.map((event, i) => (
            <li key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <span className="w-8 shrink-0 text-right text-stone-600">{String(i + 1).padStart(2, "0")}</span>
              <span className={`w-36 shrink-0 truncate sm:w-48 ${colorOf(event.type)}`}>{event.type}</span>
              <span className="truncate text-stone-400">{event.text}</span>
            </li>
          ))}
          {count < SCRIPT.length && <li className="caret pl-11 text-stone-500" />}
        </ol>
      </div>
    </div>
  );
}
