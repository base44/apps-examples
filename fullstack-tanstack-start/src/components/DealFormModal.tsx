import { useState } from "react";
import { getBrowserClient } from "../lib/browser-client.js";
import {
  STAGES,
  type Base44Config,
  type Contact,
  type Deal,
  type DealStage,
} from "../lib/types.js";

interface Props {
  base44: Base44Config;
  ownerEmail: string;
  contacts: Contact[];
  onClose: () => void;
  onCreated: (deal: Deal) => void;
}

export function DealFormModal({ base44, ownerEmail, contacts, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<DealStage>("lead");
  const [closeDate, setCloseDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Client-side create with the browser SDK. owner_email is stamped with
      // the logged-in rep so the new row is scoped to them by RLS.
      const created = (await getBrowserClient(base44).entities.Deal.create({
        title: title.trim(),
        stage,
        amount: amount ? Number(amount) : 0,
        owner_email: ownerEmail,
        ...(contactId ? { contact_id: contactId } : {}),
        ...(closeDate ? { close_date: closeDate } : {}),
      })) as Deal;
      onCreated(created);
      onClose();
    } catch {
      setError("Couldn't create the deal. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New deal</h2>
        <p className="modal-sub">Add an opportunity to your pipeline.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="d-title">Title</label>
            <input
              id="d-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Acme Corp — Enterprise plan"
            />
          </div>
          <div className="field">
            <label htmlFor="d-contact">Contact</label>
            <select
              id="d-contact"
              className="select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              <option value="">— None —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="d-amount">Amount (USD)</label>
              <input
                id="d-amount"
                className="input"
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25000"
              />
            </div>
            <div className="field">
              <label htmlFor="d-stage">Stage</label>
              <select
                id="d-stage"
                className="select"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="d-close">Expected close date</label>
            <input
              id="d-close"
              className="input"
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>
              {busy ? <span className="spinner" /> : "Create deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
