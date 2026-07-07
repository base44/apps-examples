import type { Route } from "./+types/root";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteLoaderData,
} from "react-router";
import "./lib/load-context";
import appCss from "./app.css?url";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FavoritesProvider } from "./lib/favorites-context";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://images.unsplash.com" },
  { rel: "stylesheet", href: appCss },
];

// Non–user-specific config only (safe to appear in edge-cached HTML). The
// browser SDK reads the app ID from the <meta> tag that Layout renders on
// EVERY route (see below); all its calls are same-origin (serverUrl: "").
export function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  return { appId: env.BASE44_APP_ID ?? "" };
}

export const meta: Route.MetaFunction = () => [
  { title: "Base44 Estates — Homes for sale" },
  {
    name: "description",
    content:
      "Browse curated homes for sale across San Francisco, Los Angeles, New York, Miami, and Austin. Server-rendered on Base44.",
  },
];

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2314181f'/%3E%3Cpath d='M16 7l8 7h-2v10h-4v-6h-4v6H10V14H8z' fill='%23b3852f'/%3E%3C/svg%3E";

export function Layout({ children }: { children: React.ReactNode }) {
  // The Base44 config <meta> tags are rendered HERE, not from the `meta`
  // export: in React Router 7 a leaf route's `meta` REPLACES the root's, so
  // tags emitted by the root `meta()` silently vanish on every route that sets
  // its own title — and the browser SDK then threw during hydration. Layout
  // wraps every route (and the error boundary), so rendering them here
  // guarantees they appear on every document. CSP-safe: plain <meta> tags,
  // no inline script.
  const config = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={FAVICON} />
        {config?.appId ? (
          <meta name="base44:app-id" content={config.appId} />
        ) : null}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <Header />
      <Outlet />
      <Footer />
    </FavoritesProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="container" style={{ padding: "96px 0", maxWidth: 640 }}>
      <p className="eyebrow">{is404 ? "404" : "Something went wrong"}</p>
      <h1 style={{ fontSize: 40, marginTop: 8 }}>
        {is404 ? "We couldn't find that page" : "An unexpected error occurred"}
      </h1>
      <p className="muted" style={{ marginTop: 12 }}>
        {is404
          ? "The listing may have sold or the link may be out of date."
          : "Please try again in a moment."}
      </p>
      <p style={{ marginTop: 24 }}>
        <a className="btn btn-primary" href="/">
          Back to home
        </a>
      </p>
    </main>
  );
}
