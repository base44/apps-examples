import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getDealDetail } from "../lib/crm.js";
import { requireUser } from "../lib/guard.js";
import { StageBadge } from "../components/StageBadge.js";
import { Timeline } from "../components/activity/Timeline.js";
import { AddActivityForm } from "../components/activity/AddActivityForm.js";
import { EmptyState } from "../components/EmptyState.js";
import type { Activity } from "../lib/types.js";
import { formatCurrency, formatDate, initials } from "../lib/format.js";

export const Route = createFileRoute("/deals/$id")({
  beforeLoad: ({ context, location }) => requireUser(context.session, location.href),
  loader: ({ params }) => getDealDetail({ data: params.id }),
  component: DealDetail,
});

function DealDetail() {
  const { deal, contact, activities: initial } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const base44 = session.base44!; // guaranteed: requireUser only passes with a live session

  const [activities, setActivities] = useState<Activity[]>(initial);
  const addActivity = (a: Activity) => setActivities((list) => [a, ...list]);

  if (!deal) {
    return (
      <main className="main">
        <Link to="/deals" className="back-link">
          ← Back to board
        </Link>
        <div className="card">
          <EmptyState
            emoji="🔍"
            title="Deal not found"
            message="It may have been deleted, or it belongs to another rep and row-level security is hiding it from you."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <Link to="/deals" className="back-link">
        ← Back to board
      </Link>

      <div className="page-head">
        <div>
          <h1>{deal.title}</h1>
          <p className="sub">
            <StageBadge stage={deal.stage} /> &nbsp; {formatCurrency(deal.amount)}
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack" style={{ gap: 20 }}>
          <div className="card card-pad">
            <div className="section-title">Deal</div>
            <div className="kv">
              <span className="k">Amount</span>
              <span className="v">{formatCurrency(deal.amount)}</span>
            </div>
            <div className="kv">
              <span className="k">Stage</span>
              <span className="v">
                <StageBadge stage={deal.stage} />
              </span>
            </div>
            <div className="kv">
              <span className="k">Close date</span>
              <span className="v">{formatDate(deal.close_date) || "—"}</span>
            </div>
            <div className="kv">
              <span className="k">Owner</span>
              <span className="v">{deal.owner_email}</span>
            </div>
            {deal.notes ? (
              <div className="kv" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <span className="k" style={{ marginBottom: 4 }}>
                  Notes
                </span>
                <span style={{ fontSize: 14 }}>{deal.notes}</span>
              </div>
            ) : null}
          </div>

          <div className="card card-pad">
            <div className="section-title">Activity timeline</div>
            <Timeline activities={activities} />
          </div>
        </div>

        <div className="stack" style={{ gap: 20 }}>
          <div className="card card-pad">
            <div className="section-title">Contact</div>
            {contact ? (
              <div className="stack" style={{ gap: 12 }}>
                <div className="user-chip">
                  <span className="avatar">{initials(contact.name)}</span>
                  <span className="meta">
                    <span className="name" style={{ fontSize: 15 }}>
                      {contact.name}
                    </span>
                    <span className="role">{contact.title ?? "—"}</span>
                  </span>
                </div>
                <div>
                  {contact.company ? (
                    <div className="kv">
                      <span className="k">Company</span>
                      <span className="v">{contact.company}</span>
                    </div>
                  ) : null}
                  {contact.email ? (
                    <div className="kv">
                      <span className="k">Email</span>
                      <span className="v">{contact.email}</span>
                    </div>
                  ) : null}
                  {contact.phone ? (
                    <div className="kv">
                      <span className="k">Phone</span>
                      <span className="v">{contact.phone}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>
                No contact linked to this deal.
              </p>
            )}
          </div>

          <div className="card card-pad">
            <div className="section-title">Log an activity</div>
            <AddActivityForm
              base44={base44}
              dealId={deal.id}
              contactId={deal.contact_id}
              onAdded={addActivity}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
