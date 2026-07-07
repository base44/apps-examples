import type { Route } from "./+types/seed";
import { Link, redirect, useNavigation } from "react-router";
import { getCurrentUser, getServerClient, loginUrl } from "../lib/base44.server";
import { SEED_INPUTS } from "../lib/seed-data";
import type { Property } from "../lib/types";

// Admin-only convenience route to populate the app with sample listings fast.
export async function loader({ request, context }: Route.LoaderArgs) {
  const base44 = getServerClient(request, context);
  const user = await getCurrentUser(base44);
  if (!user) {
    throw redirect(loginUrl("/seed"));
  }
  if (user.role !== "admin") {
    return { authorized: false as const, email: user.email, existing: 0 };
  }
  const mine = (await base44.entities.Property.filter(
    { agent_email: user.email },
    "-created_date",
    500,
  )) as Property[];
  return { authorized: true as const, email: user.email, existing: mine.length };
}

export function headers() {
  return { "Cache-Control": "no-store" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Seed data — Base44 Estates" },
];

export async function action({ request, context }: Route.ActionArgs) {
  const base44 = getServerClient(request, context);
  const user = await getCurrentUser(base44);
  if (!user) {
    throw redirect(loginUrl("/seed"));
  }
  if (user.role !== "admin") {
    return { error: "Only admins can seed sample data." };
  }
  // Listings are created under the admin as the listing agent, so they show up
  // on /agent and receive inquiries.
  const payload = SEED_INPUTS.map((input) => ({
    ...input,
    agent_email: user.email,
  }));
  const created = (await base44.entities.Property.bulkCreate(
    payload,
  )) as Property[];
  return { created: created.length };
}

export default function Seed({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const seeding = nav.state !== "idle";

  if (!loaderData.authorized) {
    return (
      <main className="container">
        <div className="page-head">
          <p className="eyebrow">Seed data</p>
          <h1>Admin access required</h1>
          <p>
            You're signed in as {loaderData.email}, which isn't an admin. Set
            your role to <span className="tag-inline">admin</span> in the Base44
            dashboard (Users) to seed sample listings.
          </p>
        </div>
        <p style={{ paddingBottom: 48 }}>
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <p className="eyebrow">Admin tools</p>
        <h1>Seed sample listings</h1>
        <p>
          Create {SEED_INPUTS.length} demo properties owned by {loaderData.email}
          . You currently have {loaderData.existing} listing
          {loaderData.existing === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="aside-card" style={{ maxWidth: 520, marginBottom: 48 }}>
        {actionData?.created != null ? (
          <div className="stack-lg">
            <div className="notice notice-ok">
              Created {actionData.created} sample listings.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/" className="btn btn-primary">
                View the site
              </Link>
              <Link to="/agent" className="btn btn-ghost">
                Go to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form method="post" className="stack-lg">
            {actionData?.error && (
              <div className="notice notice-info">{actionData.error}</div>
            )}
            <p className="muted mt-0">
              This bulk-creates realistic homes across five cities so you can
              explore the site immediately. Safe to run more than once (it adds
              another batch each time).
            </p>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={seeding}
            >
              {seeding ? "Seeding…" : `Seed ${SEED_INPUTS.length} listings`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
