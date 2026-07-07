import { useState } from "react";
import { getBrowserClient } from "../lib/browser-client.js";
import type { Base44Config, Contact } from "../lib/types.js";

interface Props {
  base44: Base44Config;
  ownerEmail: string;
  existing: Contact | null;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}

export function ContactFormModal({ base44, ownerEmail, existing, onClose, onSaved }: Props) {
  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [company, setCompany] = useState(existing?.company ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      title: title.trim(),
      phone: phone.trim(),
    };
    try {
      const client = getBrowserClient(base44);
      const saved = (
        existing
          ? await client.entities.Contact.update(existing.id, payload)
          : await client.entities.Contact.create({ ...payload, owner_email: ownerEmail })
      ) as Contact;
      onSaved(saved);
      onClose();
    } catch {
      setError("Couldn't save the contact. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{existing ? "Edit contact" : "New contact"}</h2>
        <p className="modal-sub">
          {existing ? "Update this contact's details." : "Add someone to your book of business."}
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="c-name">Name</label>
            <input
              id="c-name"
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee"
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="c-company">Company</label>
              <input
                id="c-company"
                className="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="field">
              <label htmlFor="c-title">Title</label>
              <input
                id="c-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VP of Operations"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input
                id="c-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@acme.com"
              />
            </div>
            <div className="field">
              <label htmlFor="c-phone">Phone</label>
              <input
                id="c-phone"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 010 0100"
              />
            </div>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
              {busy ? <span className="spinner" /> : existing ? "Save changes" : "Create contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
