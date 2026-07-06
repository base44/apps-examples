import { useState } from "react";
import { getBrowserClient } from "../../lib/browser-client.js";
import { ACTIVITY_TYPES, type Activity, type ActivityType } from "../../lib/types.js";

interface Props {
  appId: string;
  dealId: string;
  contactId?: string;
  onAdded: (activity: Activity) => void;
}

export function AddActivityForm({ appId, dealId, contactId, onAdded }: Props) {
  const [type, setType] = useState<ActivityType>("note");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // Client-side create. created_by is stamped by Base44 from the caller's
      // token, and RLS keys off it so reps only ever see their own activities.
      const created = (await getBrowserClient(appId).entities.Activity.create({
        type,
        summary: summary.trim(),
        deal_id: dealId,
        ...(contactId ? { contact_id: contactId } : {}),
      })) as Activity;
      onAdded(created);
      setSummary("");
      setType("note");
    } catch {
      setError("Couldn't log that activity. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="a-type">Type</label>
        <select
          id="a-type"
          className="select"
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType)}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="a-summary">Summary</label>
        <textarea
          id="a-summary"
          className="textarea"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Left a voicemail; following up Thursday."
        />
      </div>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="btn btn-primary block" type="submit" disabled={busy || !summary.trim()}>
        {busy ? <span className="spinner" /> : "Log activity"}
      </button>
    </form>
  );
}
