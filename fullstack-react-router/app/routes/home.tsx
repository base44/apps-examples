import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getCatalogReader } from "../lib/base44.server";
import { CITIES, type Property } from "../lib/types";
import { PropertyGrid } from "../components/PropertyGrid";
import { SearchIcon } from "../components/icons";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80";

// All catalog reads happen HERE, on the server, before any HTML is sent. The
// `headers()` export below marks the rendered HTML publicly cacheable, so the
// Base44 dispatcher serves repeat visitors from the edge in milliseconds.
// Real entity data only: an unseeded app renders honest empty states, and a
// failed read surfaces through the error boundary instead of being masked.
export async function loader({ request, context }: Route.LoaderArgs) {
  const reader = getCatalogReader(request, context);

  const [featuredRaw, latestRaw] = await Promise.all([
    reader.entities.Property.filter(
      { featured: true, status: "for_sale" },
      "-created_date",
      6,
    ),
    reader.entities.Property.filter({ status: "for_sale" }, "-created_date", 6),
  ]);

  const latest = latestRaw as Property[];
  const featured = (featuredRaw as Property[]).length
    ? (featuredRaw as Property[])
    : latest.filter((p) => p.featured).slice(0, 6);

  return { featured, latest, cities: CITIES };
}

// Public, edge-cacheable HTML. React Router does NOT copy loader Response
// headers onto the document — this export is what enables edge caching.
export function headers() {
  return { "Cache-Control": "public, max-age=60, s-maxage=60" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { featured, latest, cities } = loaderData;

  return (
    <main>
      <section className="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="hero-overlay" />
        <div className="container">
          <div className="hero-inner">
            <p className="eyebrow">Base44 Estates</p>
            <h1>Find a home worth coming home to.</h1>
            <p>
              A boutique agency with a modern search experience. Explore
              hand-picked houses, condos, and land across five of the country's
              most-loved cities.
            </p>

            <form className="hero-search" method="get" action="/listings">
              <div className="field">
                <label htmlFor="h-city">City</label>
                <select id="h-city" name="city" className="select" defaultValue="">
                  <option value="">Anywhere</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="h-type">Type</label>
                <select id="h-type" name="type" className="select" defaultValue="">
                  <option value="">Any</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="h-max">Max price</label>
                <select id="h-max" name="maxPrice" className="select" defaultValue="">
                  <option value="">No max</option>
                  <option value="500000">$500k</option>
                  <option value="1000000">$1M</option>
                  <option value="2000000">$2M</option>
                  <option value="5000000">$5M</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                <SearchIcon /> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Curated</p>
              <h2>Featured homes</h2>
              <p>Standout listings our agents are especially proud of.</p>
            </div>
            <Link to="/listings" className="link-more">
              View all listings →
            </Link>
          </div>
          {featured.length > 0 ? (
            <PropertyGrid properties={featured} />
          ) : (
            <div className="empty">
              <h3>No listings yet</h3>
              <p>
                An admin can populate sample inventory at{" "}
                <Link to="/seed" className="tag-inline">
                  /seed
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="metric-row">
            <div className="metric">
              <div className="v">5 cities</div>
              <div className="l">San Francisco to Austin, curated locally</div>
            </div>
            <div className="metric">
              <div className="v">Server-first</div>
              <div className="l">
                Every page rendered on the edge for instant loads
              </div>
            </div>
            <div className="metric">
              <div className="v">AI concierge</div>
              <div className="l">
                Our Estate Assistant helps match you and books tours
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fresh to market</p>
              <h2>Latest listings</h2>
              <p>The newest homes added by our agents.</p>
            </div>
            <Link to="/listings" className="link-more">
              Browse all →
            </Link>
          </div>
          {latest.length > 0 ? (
            <PropertyGrid properties={latest} />
          ) : (
            <div className="empty">
              <h3>Nothing on the market yet</h3>
              <p>New listings will appear here as soon as agents add them.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
