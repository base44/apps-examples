import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getContactsData } from "../lib/crm.js";
import { requireUser } from "../lib/guard.js";
import { ContactFormModal } from "../components/ContactFormModal.js";
import { EmptyState } from "../components/EmptyState.js";
import type { Contact } from "../lib/types.js";
import { initials } from "../lib/format.js";

export const Route = createFileRoute("/contacts")({
  beforeLoad: ({ context, location }) => requireUser(context.session, location.href),
  loader: () => getContactsData(),
  component: Contacts,
});

function Contacts() {
  const { contacts: initial, dealsByContact } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const base44 = session.base44!; // guaranteed: requireUser only passes with a live session
  const ownerEmail = session.user?.email ?? "";

  const [contacts, setContacts] = useState<Contact[]>(initial);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(c: Contact) {
    setEditing(c);
    setShowForm(true);
  }
  function onSaved(saved: Contact) {
    setContacts((list) => {
      const exists = list.some((c) => c.id === saved.id);
      return exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...list];
    });
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1>Contacts</h1>
          <p className="sub">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"} in your book of
            business.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + New contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="👥"
            title="No contacts yet"
            message="Add your first contact, or run the seed snippet in the README to populate sample data."
            action={
              <button className="btn btn-primary" onClick={openNew}>
                + New contact
              </button>
            }
          />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Deals</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="user-chip">
                      <span className="avatar sm">{initials(c.name)}</span>
                      <span className="cell-strong">{c.name}</span>
                    </div>
                  </td>
                  <td>{c.company || <span className="cell-muted">—</span>}</td>
                  <td>{c.title || <span className="cell-muted">—</span>}</td>
                  <td>{c.email || <span className="cell-muted">—</span>}</td>
                  <td>{c.phone || <span className="cell-muted">—</span>}</td>
                  <td>{dealsByContact[c.id] ?? 0}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <ContactFormModal
          base44={base44}
          ownerEmail={ownerEmail}
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={onSaved}
        />
      ) : null}
    </main>
  );
}
