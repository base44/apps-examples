import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPipeline } from "../lib/crm.js";
import { requireUser } from "../lib/guard.js";
import { useKanban } from "../components/kanban/useKanban.js";
import { DealCard } from "../components/kanban/DealCard.js";
import { DealFormModal } from "../components/DealFormModal.js";
import { EmptyState } from "../components/EmptyState.js";
import { formatCompactCurrency, stageAccent } from "../lib/format.js";

export const Route = createFileRoute("/deals/")({
  beforeLoad: ({ context, location }) => requireUser(context.session, location.href),
  loader: () => getPipeline(),
  component: DealsBoard,
});

function DealsBoard() {
  const { deals, contacts } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const base44 = session.base44!; // guaranteed: requireUser only passes with a live session
  const ownerEmail = session.user?.email ?? "";

  const board = useKanban(base44, deals);
  const [showForm, setShowForm] = useState(false);

  const contactName = (id?: string) =>
    id ? contacts.find((c) => c.id === id)?.name : undefined;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1>Deals</h1>
          <p className="sub">Drag a card between columns to update its stage — saved instantly.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New deal
        </button>
      </div>

      {board.error ? <div className="form-error">{board.error}</div> : null}

      {deals.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="🗂️"
            title="Your board is empty"
            message="Create your first deal, or run the seed snippet in the README to populate a realistic pipeline."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + New deal
              </button>
            }
          />
        </div>
      ) : (
        <div className="board">
          {board.columns.map((col) => (
            <div
              key={col.id}
              className={`column${board.dropTarget === col.id ? " drop-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (board.dropTarget !== col.id) board.setDropTarget(col.id);
              }}
              onDrop={() => board.onDrop(col.id)}
            >
              <div className="column-head">
                <span className="dot" style={{ background: stageAccent(col.id) }} />
                <span className="title">{col.label}</span>
                <span className="col-count">{col.deals.length}</span>
                <span className="col-sum">{formatCompactCurrency(col.total)}</span>
              </div>
              {col.deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  contactName={contactName(deal.contact_id)}
                  dragging={board.draggingId === deal.id}
                  saving={board.savingId === deal.id}
                  onDragStart={board.onDragStart}
                  onDragEnd={board.onDragEnd}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <DealFormModal
          base44={base44}
          ownerEmail={ownerEmail}
          contacts={contacts}
          onClose={() => setShowForm(false)}
          onCreated={board.addDeal}
        />
      ) : null}
    </main>
  );
}
