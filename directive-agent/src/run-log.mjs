import { hostname } from "node:os";

const MAX_CONTENT_CHARS = 20_000;

/** Mirrors a run into the AgentRun/AgentEvent entities so the viewer page can follow it. */
export function createRunLog(base44, { system, model }) {
  const { AgentRun, AgentEvent } = base44.entities;
  let runId;
  let seq = 0;
  // Writes go out one at a time so events land in order without blocking the agent.
  let queue = Promise.resolve();

  function enqueue(write) {
    queue = queue.then(write).catch((error) => process.stderr.write(`[run log] ${error.message}\n`));
  }

  return {
    async start() {
      const run = await AgentRun.create({
        directive: system,
        status: "running",
        model,
        host: `${hostname()} · Node.js ${process.version}`,
      });
      runId = run.id;
      return runId;
    },
    emit(kind, content = "", callId) {
      const event = { run_id: runId, seq: ++seq, kind, content: String(content).slice(0, MAX_CONTENT_CHARS) };
      if (callId) event.call_id = callId;
      enqueue(() => AgentEvent.create(event));
    },
    setStatus(status) {
      enqueue(() => AgentRun.update(runId, { status }));
    },
    flush: () => queue,
  };
}
