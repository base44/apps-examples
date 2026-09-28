import { useCallback, useMemo, useRef, useState } from "react";

const MAX_TICKS = 600;
const MAX_RUNS = 12;

// Measures every streamed request the chat makes. One user turn can span
// several requests: each client-tool result or approval resumes the agent loop
// with a fresh POST, and each shows up here as its own run.
//
// `wrapFetch` timestamps the request and the response headers; `onChunk` sees
// every AG-UI event the SSE stream delivers.
export function useStreamStats() {
  const [runs, setRuns] = useState([]);
  const current = useRef(null);
  const frame = useRef(0);

  const publish = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const run = current.current;
      if (!run) return;
      setRuns((prev) => [{ ...run, ticks: run.ticks.slice() }, ...prev.filter((r) => r.id !== run.id)].slice(0, MAX_RUNS));
    });
  }, []);

  const wrapFetch = useCallback(
    (fetchImpl) => async (input, init) => {
      const run = {
        id: crypto.randomUUID(),
        requestAt: performance.now(),
        headersAt: null,
        firstTokenAt: null,
        endAt: null,
        chunks: 0,
        chars: 0,
        types: {},
        tools: [],
        usage: null,
        model: null,
        finishReason: null,
        error: null,
        ticks: [],
      };
      current.current = run;
      publish();
      try {
        const response = await fetchImpl(input, init);
        run.headersAt = performance.now();
        if (!response.ok) run.error = `HTTP ${response.status}`;
        publish();
        return response;
      } catch (error) {
        run.error = error?.name === "AbortError" ? "stopped" : error?.message ?? "network error";
        run.endAt = performance.now();
        publish();
        throw error;
      }
    },
    [publish],
  );

  const onChunk = useCallback(
    (chunk) => {
      const run = current.current;
      if (!run) return;
      const now = performance.now();
      run.chunks += 1;
      run.types[chunk.type] = (run.types[chunk.type] ?? 0) + 1;
      if (run.ticks.length < MAX_TICKS) run.ticks.push({ t: now - run.requestAt, kind: kindOf(chunk.type) });
      if (chunk.type === "TEXT_MESSAGE_CONTENT") {
        run.firstTokenAt ??= now;
        run.chars += chunk.delta?.length ?? 0;
      }
      if (chunk.type === "TOOL_CALL_START") run.tools.push(chunk.toolCallName ?? chunk.toolName ?? "tool");
      if (chunk.type === "RUN_FINISHED") {
        run.endAt = now;
        run.usage = sumUsage(chunk.usage);
        run.model = chunk.metadata?.tanstack?.model ?? null;
        run.finishReason = chunk.metadata?.tanstack?.finishReason ?? chunk.finishReason ?? null;
      }
      if (chunk.type === "RUN_ERROR") {
        run.endAt = now;
        run.error = chunk.message ?? chunk.error?.message ?? "run error";
      }
      publish();
    },
    [publish],
  );

  const totals = useMemo(
    () =>
      runs.reduce(
        (acc, r) => ({
          runs: acc.runs + 1,
          input: acc.input + (r.usage?.input ?? 0),
          output: acc.output + (r.usage?.output ?? 0),
          tools: acc.tools + r.tools.length,
        }),
        { runs: 0, input: 0, output: 0, tools: 0 },
      ),
    [runs],
  );

  return { runs, totals, wrapFetch, onChunk, reset: () => setRuns([]) };
}

function kindOf(type) {
  if (type.startsWith("TEXT_MESSAGE")) return "text";
  if (type.startsWith("TOOL_CALL")) return "tool";
  if (type.startsWith("REASONING") || type.startsWith("THINKING")) return "thinking";
  if (type.startsWith("RUN")) return "run";
  return "other";
}

function sumUsage(usage) {
  if (!usage) return null;
  const list = Array.isArray(usage) ? usage : [usage];
  return list.reduce(
    (acc, u) => ({
      input: acc.input + (u.inputTokens ?? u.promptTokens ?? 0),
      output: acc.output + (u.outputTokens ?? u.completionTokens ?? 0),
    }),
    { input: 0, output: 0 },
  );
}
