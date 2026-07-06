import { Link } from "@tanstack/react-router";
import type { Deal } from "../../lib/types.js";
import { formatCurrency, formatDate, initials } from "../../lib/format.js";

interface Props {
  deal: Deal;
  contactName?: string;
  dragging: boolean;
  saving: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function DealCard({ deal, contactName, dragging, saving, onDragStart, onDragEnd }: Props) {
  return (
    <div
      className={`deal-card${dragging ? " dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", deal.id);
        onDragStart(deal.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="title">{deal.title}</div>
      <div className="amount">{formatCurrency(deal.amount)}</div>
      <div className="row">
        {contactName ? (
          <>
            <span className="avatar sm">{initials(contactName)}</span>
            <span className="contact">{contactName}</span>
          </>
        ) : (
          <span className="contact muted">No contact</span>
        )}
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>{deal.close_date ? `Closes ${formatDate(deal.close_date)}` : "No close date"}</span>
        <Link to="/deals/$id" params={{ id: deal.id }} className="link" style={{ fontSize: 12 }}>
          Open →
        </Link>
      </div>
      {saving ? (
        <div className="row muted" style={{ gap: 6 }}>
          <span className="spinner dark" /> Saving…
        </div>
      ) : null}
    </div>
  );
}
