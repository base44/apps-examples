const TICK_COLORS = {
  text: "bg-stone-300",
  tool: "bg-orange-400",
  thinking: "bg-violet-400",
  run: "bg-sky-400",
  other: "bg-stone-600",
};

const ms = (v) => (v == null ? "—" : v < 1000 ? `${Math.round(v)} ms` : `${(v / 1000).toFixed(2)} s`);

// Live numbers for every streamed request: what the gateway stream actually
// looks like from the browser, one run per agent-loop request.
export function StreamInspector({ runs, totals }) {
  if (runs.length === 0) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div className="max-w-xs space-y-2">
          <p className="font-medium">No streams yet</p>
          <p className="text-sm text-muted-foreground">
            Send the copilot a message. Each request it makes (the first answer, and each continuation after a browser tool
            or an approval) shows up here with its timing, token usage and a timeline of every SSE event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="requests" value={totals.runs} />
        <Stat label="tokens in" value={totals.input.toLocaleString()} />
        <Stat label="tokens out" value={totals.output.toLocaleString()} />
        <Stat label="tool calls" value={totals.tools} />
      </div>
      {runs.map((run, i) => (
        <RunCard key={run.id} run={run} index={runs.length - i} />
      ))}
      <Legend />
    </div>
  );
}

function RunCard({ run, index }) {
  const live = run.endAt == null && !run.error;
  const duration = (run.endAt ?? performance.now()) - run.requestAt;
  const ttfb = run.headersAt && run.headersAt - run.requestAt;
  const ttft = run.firstTokenAt && run.firstTokenAt - run.requestAt;
  const genMs = run.firstTokenAt && run.endAt ? run.endAt - run.firstTokenAt : null;
  const tps = run.usage?.output && genMs ? (run.usage.output / genMs) * 1000 : null;
  const span = Math.max(duration, 1);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono text-muted-foreground">#{index}</span>
        <span className="font-mono">POST /api/copilot</span>
        {live ? (
          <span className="ml-auto flex items-center gap-1.5 text-orange-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" /> streaming
          </span>
        ) : run.error ? (
          <span className="ml-auto text-destructive">{run.error}</span>
        ) : (
          <span className="ml-auto font-mono text-muted-foreground">{run.finishReason ?? "done"}</span>
        )}
      </div>

      <div className="relative h-8 overflow-hidden rounded-md bg-black/40" aria-label="Event timeline">
        {ttfb && <span className="absolute inset-y-0 left-0 bg-sky-500/10" style={{ width: `${(ttfb / span) * 100}%` }} />}
        {run.ticks.map((tick, i) => (
          <span
            key={i}
            className={`absolute bottom-1 top-1 w-px ${TICK_COLORS[tick.kind]}`}
            style={{ left: `${Math.min((tick.t / span) * 100, 99.7)}%` }}
          />
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
        <Metric label="headers" value={ms(ttfb)} hint="Time until the app's route answered" />
        <Metric label="first token" value={ms(ttft)} hint="Time until the first text delta" />
        <Metric label="total" value={ms(duration)} />
        <Metric label="events" value={run.chunks} />
        <Metric label="tokens" value={run.usage ? `${run.usage.input} → ${run.usage.output}` : "—"} hint="Input → output, from RUN_FINISHED" />
        <Metric label="tok/s" value={tps ? tps.toFixed(0) : "—"} hint="Output tokens over generation time" />
      </dl>

      {(run.tools.length > 0 || run.model) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {run.model && <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">model: {run.model}</span>}
          {run.tools.map((tool, i) => (
            <span key={i} className="rounded bg-orange-500/15 px-1.5 py-0.5 font-mono text-[10px] text-orange-200">
              {tool}
            </span>
          ))}
        </div>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Event types</summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
          {Object.entries(run.types).map(([type, count]) => (
            <li key={type} className="flex justify-between gap-2">
              <span className="truncate">{type}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 px-2.5 py-2">
      <p className="font-mono text-base font-medium">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div title={hint}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
      {Object.entries(TICK_COLORS).map(([kind, color]) => (
        <span key={kind} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-sm ${color}`} /> {kind}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-sm bg-sky-500/30" /> waiting for headers
      </span>
    </div>
  );
}
