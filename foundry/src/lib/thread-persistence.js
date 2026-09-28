import { base44 } from "@/api/base44Client";

// A TanStack AI chat persistence adapter backed by a Base44 entity: the
// conversation for a project survives reloads and follows the user across
// devices. It stores the resume snapshot too, so a run paused on an approval
// can still be approved after a reload. Writes are debounced — the client calls
// setItem on every message change, which during a stream is every few ms.
export function threadPersistence(projectId, { debounceMs = 1200, onLoad } = {}) {
  let recordId = null;
  let pending = null;
  let timer = null;
  let chain = Promise.resolve();

  const flush = () => {
    const state = pending;
    pending = null;
    if (!state) return chain;
    const data = { messages: state.messages, resume: state.resume ?? null };
    chain = chain.then(async () => {
      if (recordId) await base44.entities.Thread.update(recordId, data);
      else recordId = (await base44.entities.Thread.create({ project_id: projectId, ...data })).id;
    }).catch((error) => console.warn("Foundry: saving the conversation failed", error));
    return chain;
  };

  return {
    async getItem() {
      const [thread] = await base44.entities.Thread.filter({ project_id: projectId }, "-updated_date", 1);
      recordId = thread?.id ?? null;
      onLoad?.(thread?.messages?.length ?? 0);
      if (!thread) return null;
      return thread.resume ? { messages: thread.messages ?? [], resume: thread.resume } : { messages: thread.messages ?? [] };
    },
    setItem(_id, state) {
      pending = state;
      clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
    },
    async removeItem() {
      clearTimeout(timer);
      pending = null;
      await chain;
      if (recordId) await base44.entities.Thread.delete(recordId);
      recordId = null;
    },
  };
}
