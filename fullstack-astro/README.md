# Meridian — a full-stack storefront on Base44

**Meridian** is a small-batch coffee-roaster storefront, built with
**Astro 7** and deployed to **Base44 full-stack hosting** (Cloudflare Workers).
It's a real example app: a product catalog, dynamic product and category
pages, a client-side cart, an authenticated checkout that writes real orders,
per-user order history, and an AI shopping concierge.

Its headline feature is **hybrid rendering with SSR edge caching**: the
catalog is server-rendered so prices and stock are always fresh (and the
public pages opt into Base44's shared edge cache), while pure-content pages
(`/about`, `/brewing`, the 404) are **prerendered to static HTML at build
time** and served by the asset layer before any Worker code runs. Everything
personalised is explicitly kept out of every cache.

## What's in the box

### Data model (`base44/entities/*.jsonc`)

| Entity | Purpose | Row-Level Security |
| --- | --- | --- |
| **Product** | Coffees & gear (price, images, stock, roast, origin, tags, `active`/`draft`) | Public **read**; **create/update/delete** admin-only |
| **Category** | Catalog sections (single-origin, blends, decaf, gear) | Public **read**; writes admin-only |
| **Order** | Checkout line items, total, status, shipping address | **Owner-scoped**: a shopper reads/updates only their own orders (`created_by == {{user.email}}`); delete admin-only |
| **Review** | Star ratings + text on a product | Public **read**; **update/delete** owner-scoped (owner or admin) |

RLS uses Base44's documented `"rls"` schema syntax
(`{ "created_by": "{{user.email}}" }`, `{ "user_condition": { "role": "admin" } }`,
`true`/`false`, and `$or`). Public read on Product/Category is precisely what
makes the catalog pages safe to edge-cache.

### AI agent (`base44/agents/concierge.jsonc`)

**Bean**, a warm shopping concierge that can **read** Product/Category/Review to
recommend coffees by taste and brew method, and **create/read** Order to help a
shopper check out — scoped via `tool_configs`.

### Pages (`src/pages/`)

| Route | What it is | Rendering |
| --- | --- | --- |
| `/` | Homepage: hero, featured rail, category nav, full catalog | SSR, **edge-cached** (public) |
| `/products/[slug]` | Dynamic product detail + reviews + review form | SSR, **edge-cached** (public) |
| `/category/[slug]` | Category listing | SSR, **edge-cached** (public) |
| `/about` | Brand story: values, numbers, how we roast | **Static (prerendered)** |
| `/brewing` | Brew guides: five tested recipes + cheat-sheet table | **Static (prerendered)** |
| `404` | Not-found page | **Static (prerendered)** `404.html` |
| `/cart` | Cart (client-side, localStorage) | SSR, `private, no-store` |
| `/checkout` | Auth-gated checkout; writes an Order | SSR, `private, no-store` |
| `/account/orders` | The signed-in shopper's order history | SSR, `private, no-store` |
| `/login` | **App-owned auth page** — email/password sign-in and sign-up (OTP verification) + Google OAuth | SSR, `private, no-store` |
| `/api/me`, `/api/reviews`, `/api/orders`, `/api/auth/*` | JSON endpoints (server SDK) | SSR, `private, no-store` |

## Hybrid rendering (SSG + SSR on one deploy)

Astro's `output: "server"` renders every page on demand by default; a page
opts out with `export const prerender = true`. Meridian uses all three speeds
deliberately, and each page carries a visible badge so you can tell them
apart:

| Mode | Pages | Why | Badge |
| --- | --- | --- | --- |
| **Static (SSG)** | `/about`, `/brewing`, `404` | Pure editorial content — changes per deploy, not per request. Astro bakes them to plain HTML in `dist/client/` at build time, and Base44's asset layer serves them **before any Worker code runs**: no render, no database, no cache to warm. | `Prerendered · built at <build time>` — frozen until the next deploy |
| **SSR + edge cache** | `/`, `/products/*`, `/category/*` | Live catalog data (prices, stock, reviews) that is identical for every visitor — rendered by the Worker, then cached at the edge for 5 minutes. | `Edge-cached · server-rendered at <time>` — freezes on cache HITs |
| **SSR, never cached** | `/cart`, `/checkout`, `/account/orders`, `/login`, `/api/*` | Personalised — must be rendered per request and kept out of shared caches. | `Personalised · server-rendered at <time>` — always current |

You can see the serving difference in the response headers. The SSR catalog
pages carry the app-set `Cache-Control: public, max-age=60, s-maxage=300, …`
and Base44's dispatcher cache flips `X-B44-Cache` from `MISS` to `HIT` (with
the `rendered-at` stamp freezing while cached). The prerendered pages come
back with the asset layer's own `Cache-Control: public, max-age=0,
must-revalidate` — they still transit the dispatcher (so you'll see
`X-B44-Cache: MISS`, and `max-age=0` means it never becomes a `HIT`), but the
app Worker's page-rendering code never runs: Cloudflare's asset routing
answers before the script is invoked, which is why they're consistently fast
and the `built-at` stamp never moves between requests.

Two build-time details worth copying:

- **Static pages can't fetch live data.** The build sandbox has no Base44
  backend, so the shared `Layout` accepts a `staticCategories` prop
  (`src/lib/static-nav.ts`) instead of querying the Category entity the way
  SSR pages do. If you restructure the catalog, update that file and rebuild.
- **`build: { format: "file" }`** emits `about.html` instead of
  `about/index.html`, so the asset layer serves `/about` directly with a `200`
  rather than a trailing-slash redirect. The prerendered `404.html` is picked
  up by Astro's Worker for any unmatched route and served with a real `404`
  status.

## The caching model (the fast part)

Base44's dispatcher is a **dumb shared cache**: it caches a `GET`/`HEAD` `200`
response **only when the app itself says it's shareable** via `Cache-Control`
(`public` + a positive `max-age`/`s-maxage`, no `Set-Cookie`, not
`private`/`no-store`). **The app owns cacheability.**

- **Public, identical-for-everyone pages** (catalog, product, category) set:

  ```
  Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
  ```

  Each carries a `data-testid="rendered-at"` server timestamp — on a cache HIT
  it shows an *older* time than the wall clock, which is the edge doing its job.

- **Personalised pages** (cart, checkout, orders, `/api/*`) set
  `Cache-Control: private, no-store` so a shared cache never stores one user's
  view.

To keep the catalog pages cacheable, the header is rendered **identically for
every visitor**. The signed-in name and cart badge are hydrated **on the
client** (the header calls `/api/me`; the cart reads `localStorage`), so the
cached HTML never contains per-user content. See `src/lib/cache.ts`.

## How the SDK is used

- **Reads** happen server-side in Astro frontmatter via
  `createServerClient({ request, env })` (`src/lib/base44.ts`). It resolves the
  visitor from the `base44_access_token` cookie / `Authorization` header.
  Auth-flavoured callers treat a missing runtime as a logged-out view; catalog
  reads (`src/lib/store.ts`) fail loudly instead — there is no mock fallback,
  so an unseeded or unreachable backend surfaces as an error, not fake data.
- **Writes** (create Review / Order) go through same-origin API routes
  (`src/pages/api/*`) that run a server-side client authenticated from the
  cookie, so RLS is enforced with the real user identity.
- **Auth**: the app owns its `/login` page (`src/pages/login.astro`) — sign-in
  **and** sign-up (with OTP email verification) post to same-origin
  `/api/auth/*` routes that call the SDK server-side and set the session
  cookie. On the deployed domain the platform reserves only `/api/apps/*` and
  `/ws-user-apps/*`; every other path, including `/login`, belongs to the app.
  Base44's hosted login page is used only by the edge gate in front of
  fully-private apps. Google OAuth (a redirect through `/api/apps/auth/login`,
  completed by `AuthBootstrap.astro` mirroring the returned token into the
  cookie) may fail on a newly added custom base domain until the OAuth gateway
  allowlists it — platform configuration, not app code; email/password works
  regardless.

## Develop & deploy

```bash
npm install
npm run dev      # http://localhost:4321 (renders the demo catalog; no backend needed)
npm run build    # production build -> dist/ (+ .wrangler/deploy/config.json)

base44 deploy    # deploy entities, agent, and the SSR site to Base44
```

After deploying, seed the catalog by creating `Category` and `Product` records
(dashboard, CLI, or SDK). Until then, the storefront renders the built-in demo
catalog so it always looks complete.

### Astro plumbing (do not change)

Meridian runs **Astro 7** with **@astrojs/cloudflare 14** (the Vite 8-based
adapter major that pairs with Astro 7; Node.js >= 22.12 required to build).

- `astro.config.mjs`: `output: "server"`, `adapter: cloudflare({ imageService:
  "passthrough" })`, `session: { driver: sessionDrivers.memory() }` — these
  avoid Worker bindings (IMAGES, SESSION KV) that Base44 hosting doesn't
  provision yet. After a build, confirm the generated
  `dist/server/wrangler.json` still contains **no** bindings beyond `ASSETS`.
- `wrangler.jsonc`: keeps `compatibility_flags: ["nodejs_compat"]`, required for
  Base44 SSR.
- `compressHTML: true` keeps Astro 6's HTML-aware whitespace handling (Astro
  7's new `"jsx"` default strips the space around inline elements that sit on
  their own source line, breaking prose with inline links).
- `package.json` pins `@base44/sdk` and the `base44` CLI to preview builds via
  npm aliases — leave those as-is.
