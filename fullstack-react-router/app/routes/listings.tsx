import type { Route } from "./+types/listings";
import { Form, Link, useSearchParams } from "react-router";
import { getCatalogReader } from "../lib/base44.server";
import {
  CITIES,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from "../lib/types";
import { PropertyGrid } from "../components/PropertyGrid";
import { SearchIcon } from "../components/icons";

interface Filters {
  city: string;
  type: string;
  status: string;
  maxPrice: number | null;
  minBeds: number | null;
}

function readFilters(url: URL): Filters {
  const p = url.searchParams;
  const num = (v: string | null) => (v ? Number(v) : null);
  return {
    city: p.get("city") ?? "",
    type: p.get("type") ?? "",
    status: p.get("status") ?? "for_sale",
    maxPrice: num(p.get("maxPrice")),
    minBeds: num(p.get("bedrooms")),
  };
}

// Real entity data only: zero matches render the honest empty state below,
// and a failed read surfaces through the error boundary instead of being
// masked by demo content.
export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters = readFilters(url);
  const reader = getCatalogReader(request, context);

  const query: Record<string, unknown> = {};
  if (filters.city) query.city = filters.city;
  if (filters.type) query.property_type = filters.type as PropertyType;
  if (filters.status !== "any") query.status = filters.status as PropertyStatus;
  if (filters.maxPrice != null) query.price = { $lte: filters.maxPrice };
  if (filters.minBeds != null) query.bedrooms = { $gte: filters.minBeds };

  const results = (await reader.entities.Property.filter(
    query,
    "-created_date",
    60,
  )) as Property[];

  return { results, filters, cities: CITIES };
}

export function headers() {
  return { "Cache-Control": "public, max-age=60, s-maxage=60" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Listings — Base44 Estates" },
];

export default function Listings({ loaderData }: Route.ComponentProps) {
  const { results, filters, cities } = loaderData;
  const [params] = useSearchParams();
  const cityOptions = filters.city && !cities.includes(filters.city)
    ? [...cities, filters.city]
    : cities;

  return (
    <main>
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Browse</p>
          <h1>Every home, filtered your way</h1>
          <p>
            Results are rendered on the server from the Property entity, then
            edge-cached per query — instant to load, always shareable by URL.
          </p>
        </div>

        <Form method="get" className="filter-bar" role="search">
          <div className="filter-grid">
            <div className="field">
              <label htmlFor="f-city">City</label>
              <select id="f-city" name="city" className="select" defaultValue={filters.city}>
                <option value="">Anywhere</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-type">Type</label>
              <select id="f-type" name="type" className="select" defaultValue={filters.type}>
                <option value="">Any</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-beds">Bedrooms</label>
              <select
                id="f-beds"
                name="bedrooms"
                className="select"
                defaultValue={filters.minBeds?.toString() ?? ""}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-max">Max price</label>
              <select
                id="f-max"
                name="maxPrice"
                className="select"
                defaultValue={filters.maxPrice?.toString() ?? ""}
              >
                <option value="">No max</option>
                <option value="500000">$500k</option>
                <option value="1000000">$1M</option>
                <option value="2000000">$2M</option>
                <option value="5000000">$5M</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-status">Status</label>
              <select
                id="f-status"
                name="status"
                className="select"
                defaultValue={filters.status}
              >
                <option value="for_sale">For sale</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="any">Any</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              <SearchIcon /> Apply
            </button>
          </div>
        </Form>

        <p className="result-count">
          {`${results.length} home${results.length === 1 ? "" : "s"} found`}
          {params.toString() ? (
            <>
              {" · "}
              <Link to="/listings" className="tag-inline">
                Clear filters
              </Link>
            </>
          ) : null}
        </p>

        {results.length > 0 ? (
          <PropertyGrid properties={results} />
        ) : (
          <div className="empty">
            <h3>No homes match those filters</h3>
            <p>Try widening your price range, or exploring another city.</p>
            <Link to="/listings" className="btn btn-ghost">
              Reset filters
            </Link>
          </div>
        )}
      </div>
      <div style={{ paddingBottom: 40 }} />
    </main>
  );
}
