import { useEffect, useRef, useState } from "react";
import { type AgentEvent, type AgentRun, base44 } from "./base44";

const POLL_MS = 2_000;

export function useRuns() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [runId, setRunId] = useState(() => new URLSearchParams(location.search).get("run"));
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const lastSeq = useRef(0);

  useEffect(() => {
    lastSeq.current = 0;
    setEvents([]);
    if (runId) history.replaceState(null, "", `?run=${runId}`);
  }, [runId]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const list = (await base44.entities.AgentRun.list("-created_date", 30)) as AgentRun[];
        if (stopped) return;
        setRuns(list);
        const id = runId ?? list[0]?.id;
        if (!runId && id) return setRunId(id);
        if (id) {
          const fresh = (await base44.entities.AgentEvent.filter(
            { run_id: id, seq: { $gt: lastSeq.current } },
            "seq",
            500,
          )) as AgentEvent[];
          if (!stopped && fresh.length) {
            lastSeq.current = fresh.at(-1)!.seq;
            setEvents((prev) => [...prev, ...fresh]);
          }
        }
      } catch (error) {
        console.error(error);
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [runId]);

  return { runs, run: runs.find((r) => r.id === runId), runId, setRunId, events };
}
