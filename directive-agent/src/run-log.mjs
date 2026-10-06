import { hostname } from "node:os";

const MAX_CONTENT_CHARS = 20_000;
const REPLY_POLL_MS = 2_000;

/** Mirrors a run into the AgentRun/AgentEvent entities so the viewer page can follow it and reply. */
export function createRunLog(base44, model) {
  const { AgentRun, AgentEvent } = base44.entities;
  let runId;
  let seq = 0;
  // Writes go out one at a time so events land in order without blocking the agent.
  let queue = Promise.resolve();
  const seenReplies = new Set();

  function enqueue(write) {
    queue = queue.then(write).catch((error) => process.stderr.write(`[run log] ${error.message}\n`));
    return queue;
  }

  return {
    async start(directive) {
      const run = await AgentRun.create({
        directive,
        status: "running",
        model,
        host: `${hostname()} · Node.js ${process.version}`,
      });
      runId = run.id;
      return runId;
    },

    emit(kind, content = "") {
      const event = { run_id: runId, seq: ++seq, kind, content: String(content).slice(0, MAX_CONTENT_CHARS) };
      enqueue(() => AgentEvent.create(event));
    },

    setStatus(status) {
      enqueue(() => AgentRun.update(runId, { status }));
    },

    /** Resolves with the oldest reply from the viewer page not yet consumed, or null once `signal` aborts. */
    async waitForReply(signal) {
      await queue;
      while (!signal?.aborted) {
        const replies = await AgentEvent.filter({ run_id: runId, kind: "reply" }, "created_date", 50).catch(() => []);
        const reply = replies.find((r) => !seenReplies.has(r.id));
        if (reply) {
          seenReplies.add(reply.id);
          return reply.content;
        }
        await new Promise((resolve) => setTimeout(resolve, REPLY_POLL_MS));
      }
      return null;
    },

    flush: () => queue,
  };
}
