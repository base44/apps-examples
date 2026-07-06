import { useEffect, useRef, useState } from "react";
import { useCopilot } from "./copilot/useCopilot.js";

const SUGGESTIONS = [
  "Summarize my pipeline",
  "Which deals are closing soon?",
  "Draft a follow-up for my top deal",
];

export function Copilot({ appId }: { appId: string }) {
  const { open, setOpen, openPanel, items, send, sending, starting, error } = useCopilot(appId);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [items, starting]);

  function submit(text: string) {
    void send(text);
    setInput("");
  }

  if (!open) {
    return (
      <button className="copilot-fab" onClick={openPanel} aria-label="Open Sales Copilot">
        <span aria-hidden>✨</span> Sales Copilot
      </button>
    );
  }

  return (
    <div className="copilot-panel" role="dialog" aria-label="Sales Copilot">
      <div className="copilot-head">
        <span className="avatar sm" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
          ✨
        </span>
        <span className="stack" style={{ gap: 0 }}>
          <span className="t">Sales Copilot</span>
          <span className="s">Reads your pipeline · drafts follow-ups</span>
        </span>
        <button className="btn btn-ghost btn-sm spacer" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="copilot-body" ref={bodyRef}>
        {items.length === 0 && !starting ? (
          <div className="msg assistant">
            Hi! I'm your Sales Copilot. Ask me to summarize your pipeline, flag deals closing soon,
            or draft a follow-up email — I only see the deals and contacts you own.
          </div>
        ) : null}
        {items.map((it) => (
          <div key={it.key} className={`msg ${it.role}`}>
            {it.text}
          </div>
        ))}
        {starting ? <div className="msg tool">Connecting…</div> : null}
        {sending ? <div className="msg tool">Thinking…</div> : null}
        {error ? <div className="msg tool">{error}</div> : null}
      </div>

      {items.length === 0 ? (
        <div className="copilot-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => submit(s)} disabled={sending || starting}>
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="copilot-foot"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) submit(input);
        }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Copilot…"
          disabled={starting}
        />
        <button className="btn btn-primary" type="submit" disabled={sending || starting || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
