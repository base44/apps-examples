import { useMemo } from "react";
import { Transcript } from "@/components/Transcript";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toTurns } from "@/lib/transcript";
import { useRuns } from "@/lib/useRuns";

export function App() {
  const { runs, run, runId, setRunId, events } = useRuns();
  const turns = useMemo(() => toTurns(events), [events]);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 gap-1 overflow-x-auto border-b p-3 md:w-64 md:flex-col md:overflow-y-auto md:border-r md:border-b-0">
        <h1 className="hidden px-2 pb-2 font-semibold text-sm md:block">Directive Agent</h1>
        {runs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRunId(r.id)}
            className={cn(
              "min-w-44 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent",
              r.id === runId && "bg-accent",
            )}
          >
            <div className="truncate font-medium">{r.directive}</div>
            <div className="text-muted-foreground">
              {r.status} · {new Date(r.created_date).toLocaleString()}
            </div>
          </button>
        ))}
      </aside>
      <main className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <span className="truncate font-mono text-sm">{run ? `system: ${run.directive}` : "No run selected"}</span>
          <span className="ml-auto hidden truncate text-muted-foreground text-xs sm:block">
            {[run?.model, run?.host].filter(Boolean).join(" · ")}
          </span>
          {run && <Badge variant={run.status === "running" ? "default" : "secondary"}>{run.status}</Badge>}
        </header>
        <div className="min-h-0 flex-1">
          <Transcript turns={turns} />
        </div>
      </main>
    </div>
  );
}
