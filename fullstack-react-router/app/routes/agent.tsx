import type { Route } from "./+types/agent";
import { Link, redirect } from "react-router";
import { getCurrentUser, getServerClient, loginUrl } from "../lib/base44.server";
import type { Inquiry, Property } from "../lib/types";
import { formatPrice, statusLabel } from "../lib/format";
import { InquiryStatusControl } from "../components/InquiryStatusControl";

// Private agent workspace. Everything runs under the agent's own token, so:
//  - Property.filter({ agent_email }) returns their listings, and
//  - Inquiry.list() returns ONLY inquiries whose agent_email matches them
//    (RLS scoping) — an agent can never see another agent's leads.
export async function loader({ request, context }: Route.LoaderArgs) {
  const base44 = getServerClient(request, context);
  const user = await getCurrentUser(base44);
  if (!user) {
    throw redirect(loginUrl(context, "/agent"));
  }

  const [listings, inquiries] = await Promise.all([
    base44.entities.Property.filter(
      { agent_email: user.email },
      "-created_date",
      100,
    ).catch(() => [] as Property[]),
    base44.entities.Inquiry.list("-created_date", 200).catch(
      () => [] as Inquiry[],
    ),
  ]);

  return {
    user: { email: user.email, name: user.full_name || user.email },
    listings: listings as Property[],
    inquiries: inquiries as Inquiry[],
  };
}

export function headers() {
  return { "Cache-Control": "no-store" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Agent dashboard — Base44 Estates" },
];

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") !== "update_inquiry") {
    return { error: "Unknown action" };
  }
  const base44 = getServerClient(request, context);
  const user = await getCurrentUser(base44);
  if (!user) {
    throw redirect(loginUrl(context, "/agent"));
  }
  const id = String(form.get("inquiry_id") ?? "");
  const status = String(form.get("status") ?? "new");
  // RLS permits this only when the inquiry's agent_email matches the agent.
  await base44.entities.Inquiry.update(id, { status }).catch(() => null);
  return { ok: true };
}

export default function AgentDashboard({ loaderData }: Route.ComponentProps) {
  const { user, listings, inquiries } = loaderData;
  const newCount = inquiries.filter((i) => i.status === "new").length;
  const portfolio = listings
    .filter((l) => l.status !== "sold")
    .reduce((sum, l) => sum + (l.price ?? 0), 0);

  return (
    <main>
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Agent workspace</p>
          <h1>Welcome back, {user.name}</h1>
          <p>
            Your listings and inbound inquiries. Inquiries are scoped to you by
            row-level security — you only ever see your own leads.
          </p>
        </div>

        <div className="metric-row">
          <div className="metric">
            <div className="v">{listings.length}</div>
            <div className="l">Active listings</div>
          </div>
          <div className="metric">
            <div className="v">{newCount}</div>
            <div className="l">New inquiries</div>
          </div>
          <div className="metric">
            <div className="v">{formatPrice(portfolio)}</div>
            <div className="l">Portfolio value</div>
          </div>
        </div>

        <div className="stack-lg" style={{ paddingBottom: 48 }}>
          <div className="panel">
            <div className="panel-head">
              <h3>Your listings</h3>
              <Link to="/seed" className="link-more">
                Add sample data →
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>City</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => (
                      <tr key={l.id}>
                        <td>{l.title}</td>
                        <td>{l.city}</td>
                        <td>{formatPrice(l.price)}</td>
                        <td>
                          <span className={`badge badge-${l.status}`}>
                            {statusLabel(l.status)}
                          </span>
                        </td>
                        <td>
                          <Link to={`/property/${l.id}`} className="tag-inline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 24 }} className="muted">
                You have no listings yet. Visit{" "}
                <Link to="/seed" className="tag-inline">
                  /seed
                </Link>{" "}
                to add sample homes (admin only), or create them via the Base44
                dashboard.
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Inbound inquiries</h3>
              <span className="muted" style={{ fontSize: 14 }}>
                {inquiries.length} total
              </span>
            </div>
            {inquiries.length > 0 ? (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>From</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((iq) => (
                      <tr key={iq.id}>
                        <td>{iq.property_title || iq.property_id}</td>
                        <td>
                          <div>{iq.name}</div>
                          <div className="muted" style={{ fontSize: 13 }}>
                            <a href={`mailto:${iq.email}`}>{iq.email}</a>
                            {iq.phone ? ` · ${iq.phone}` : ""}
                          </div>
                        </td>
                        <td style={{ maxWidth: 320 }}>{iq.message}</td>
                        <td>
                          <InquiryStatusControl
                            inquiryId={iq.id}
                            status={iq.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 24 }} className="muted">
                No inquiries yet. When a visitor sends a message from one of your
                listings, it appears here.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
