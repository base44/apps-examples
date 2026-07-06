import type { Route } from "./+types/property";
import { Link } from "react-router";
import { getCatalogReader, getServerClient } from "../lib/base44.server";
import { SEED_PROPERTIES, seedById } from "../lib/seed-data";
import type { Property } from "../lib/types";
import {
  coverImage,
  formatPrice,
  formatSqft,
  statusLabel,
  typeLabel,
} from "../lib/format";
import { PropertyGrid } from "../components/PropertyGrid";
import { InquiryForm } from "../components/InquiryForm";
import { SaveFavoriteButton } from "../components/SaveFavoriteButton";
import { AreaIcon, BathIcon, BedIcon, PinIcon } from "../components/icons";

async function loadProperty(
  reader: ReturnType<typeof getCatalogReader>,
  id: string,
): Promise<Property | null> {
  const live = await reader.entities.Property.get(id).catch(() => null);
  if (live) return live as Property;
  return seedById(id) ?? null;
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  if (!params.id) throw new Response("Not found", { status: 404 });
  const reader = getCatalogReader(request, context);
  const property = await loadProperty(reader, params.id);
  if (!property) {
    throw new Response("Not found", { status: 404 });
  }

  let similar = (await reader.entities.Property.filter(
    { city: property.city, status: "for_sale" },
    "-created_date",
    4,
  ).catch(() => [] as Property[])) as Property[];
  if (similar.length === 0) {
    similar = SEED_PROPERTIES.filter(
      (p) => p.city === property.city && p.status === "for_sale",
    );
  }
  similar = similar.filter((p) => p.id !== property.id).slice(0, 3);

  return { property, similar };
}

// Public detail pages are edge-cacheable. The inquiry POST below is a separate
// data request and is never cached.
export function headers() {
  return { "Cache-Control": "public, max-age=60, s-maxage=60" };
}

export const meta: Route.MetaFunction = ({ data }) => {
  const p = data?.property;
  return [
    { title: p ? `${p.title} — Base44 Estates` : "Base44 Estates" },
    {
      name: "description",
      content: p ? `${p.title} in ${p.city}. ${formatPrice(p.price)}.` : "",
    },
  ];
};

// Creates an Inquiry. The agent + title are re-read from the Property on the
// server, so a visitor cannot spoof which agent receives the lead. `create` is
// public in the Inquiry RLS, so this works for anonymous visitors too.
export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") !== "inquiry") {
    return { error: "Unknown action" };
  }

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and a message." };
  }

  const reader = getCatalogReader(request, context);
  const property = params.id ? await loadProperty(reader, params.id) : null;
  if (!property) {
    return { error: "This listing is no longer available." };
  }

  const base44 = getServerClient(request, context);
  try {
    await base44.entities.Inquiry.create({
      property_id: property.id,
      property_title: property.title,
      name,
      email,
      phone: phone || undefined,
      message,
      status: "new",
      // Server-derived — the true listing agent, ignoring any client value.
      agent_email: property.agent_email,
    });
    return { ok: true };
  } catch {
    return { error: "We couldn't send your message. Please try again." };
  }
}

export default function PropertyDetail({ loaderData }: Route.ComponentProps) {
  const { property, similar } = loaderData;
  const images = property.images?.length
    ? property.images
    : [{ url: coverImage(property.images) }];
  const isLand = property.property_type === "land";

  return (
    <main>
      <div className="container">
        <div style={{ padding: "24px 0 12px" }}>
          <Link to="/listings" className="link-more">
            ← Back to listings
          </Link>
        </div>

        <div className="detail-gallery">
          <div className="main">
            <img src={images[0].url} alt={property.title} />
          </div>
          <div className="side">
            <img
              src={(images[1] ?? images[0]).url}
              alt={`${property.title} — view 2`}
            />
            <img
              src={(images[2] ?? images[0]).url}
              alt={`${property.title} — view 3`}
            />
          </div>
        </div>

        <div className="detail-layout">
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {property.featured && (
                <span className="badge badge-featured">Featured</span>
              )}
              <span className={`badge badge-${property.status}`}>
                {statusLabel(property.status)}
              </span>
              <span className="badge badge-type">
                {typeLabel(property.property_type)}
              </span>
            </div>

            <h1 style={{ fontSize: 34 }}>{property.title}</h1>
            <p
              className="muted"
              style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}
            >
              <PinIcon /> {property.address}, {property.city}
            </p>

            {!isLand && (
              <div className="stat-row">
                <div className="stat">
                  <div className="k">{property.bedrooms}</div>
                  <div className="l">
                    <BedIcon /> Bedrooms
                  </div>
                </div>
                <div className="stat">
                  <div className="k">{property.bathrooms}</div>
                  <div className="l">
                    <BathIcon /> Bathrooms
                  </div>
                </div>
                {property.sqft > 0 && (
                  <div className="stat">
                    <div className="k">{formatSqft(property.sqft).replace(" sqft", "")}</div>
                    <div className="l">
                      <AreaIcon /> Sq ft
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="prose stack-lg" style={{ marginTop: 20 }}>
              {(property.description ?? "").split("\n").filter(Boolean).map(
                (para, i) => (
                  <p key={i}>{para}</p>
                ),
              )}
              {!property.description && (
                <p>Contact the listing agent for full details on this home.</p>
              )}
            </div>
          </div>

          <aside>
            <div className="aside-card stack-lg">
              <div>
                <div className="price">{formatPrice(property.price)}</div>
                <div className="muted">{statusLabel(property.status)}</div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <SaveFavoriteButton propertyId={property.id} />
                <span className="muted" style={{ fontSize: 14 }}>
                  Save this home to your favorites
                </span>
              </div>
              <div>
                <p
                  className="eyebrow"
                  style={{ color: "var(--gold-strong)", marginBottom: 10 }}
                >
                  Contact the listing agent
                </p>
                <InquiryForm
                  propertyId={property.id}
                  agentEmail={property.agent_email}
                />
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="section">
            <div className="section-head">
              <div>
                <p className="eyebrow">Nearby</p>
                <h2>More homes in {property.city}</h2>
              </div>
            </div>
            <PropertyGrid properties={similar} columns={3} />
          </section>
        )}
      </div>
    </main>
  );
}
