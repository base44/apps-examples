import type { Route } from "./+types/favorites";
import { Link, redirect } from "react-router";
import {
  getCatalogReader,
  getCurrentUser,
  getServerClient,
  loginUrl,
} from "../lib/base44.server";
import { seedById } from "../lib/seed-data";
import type { Favorite, Property } from "../lib/types";
import { PropertyGrid } from "../components/PropertyGrid";

// Private, per-user page. The loader runs the user-scoped server client, so
// Favorite.list() returns ONLY this user's saved homes (enforced by RLS).
export async function loader({ request, context }: Route.LoaderArgs) {
  const base44 = getServerClient(request, context);
  const user = await getCurrentUser(base44);
  if (!user) {
    throw redirect(loginUrl("/favorites"));
  }

  const favorites = (await base44.entities.Favorite.list(
    "-created_date",
    200,
  ).catch(() => [] as Favorite[])) as Favorite[];

  const reader = getCatalogReader(request, context);
  const properties = (
    await Promise.all(
      favorites.map(async (fav) => {
        const live = await reader.entities.Property.get(fav.property_id).catch(
          () => null,
        );
        return (live as Property | null) ?? seedById(fav.property_id) ?? null;
      }),
    )
  ).filter((p): p is Property => p !== null);

  return { properties, name: user.full_name || user.email };
}

// Never edge-cache a personal page.
export function headers() {
  return { "Cache-Control": "no-store" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Saved homes — Base44 Estates" },
];

export default function Favorites({ loaderData }: Route.ComponentProps) {
  const { properties, name } = loaderData;
  return (
    <main>
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Your account</p>
          <h1>Saved homes</h1>
          <p>
            Signed in as {name}. These favorites are private to you — row-level
            security ensures no one else can read them.
          </p>
        </div>

        {properties.length > 0 ? (
          <div style={{ paddingBottom: 48 }}>
            <PropertyGrid properties={properties} />
          </div>
        ) : (
          <div className="empty" style={{ marginBottom: 48 }}>
            <h3>No saved homes yet</h3>
            <p>
              Tap the heart on any listing to save it here for later. Your list
              stays private to your account.
            </p>
            <Link to="/listings" className="btn btn-primary">
              Browse listings
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
