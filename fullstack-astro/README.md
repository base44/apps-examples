# Meridian — a full-stack storefront on Base44

**Meridian** is a small-batch coffee-roaster storefront, server-rendered with
**Astro 6** and deployed to **Base44 full-stack hosting** (Cloudflare Workers
SSR). It's a real example app: a product catalog, dynamic product and category
pages, a client-side cart, an authenticated checkout that writes real orders,
per-user order history, and an AI shopping concierge.

Its headline feature is **SSR edge caching**: the public catalog pages tell
Base44's shared cache they're safe to store, so they're served fast from the
edge, while everything personalised is explicitly kept out of the cache.

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

| Route | What it is | Cache |
| --- | --- | --- |
| `/` | Homepage: hero, featured rail, category nav, full catalog | **Edge-cached** (public) |
| `/products/[slug]` | Dynamic product detail + reviews + review form | **Edge-cached** (public) |
| `/category/[slug]` | Category listing | **Edge-cached** (public) |
| `/cart` | Cart (client-side, localStorage) | `private, no-store` |
| `/checkout` | Auth-gated checkout; writes an Order | `private, no-store` |
| `/account/orders` | The signed-in shopper's order history | `private, no-store` |
| `/login` | **App-owned auth page** — email/password sign-in and sign-up (OTP verification) + Google OAuth | `private, no-store` |
| `/api/me`, `/api/reviews`, `/api/orders`, `/api/auth/*` | JSON endpoints (server SDK) | `private, no-store` |

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
  visitor from the `base44_access_token` cookie / `Authorization` header, and is
  guarded so pages still render when there's no Base44 runtime (local `astro
  dev`) or before the catalog is seeded — falling back to the curated demo
  catalog in `src/lib/demo-data.ts`.
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

- `astro.config.mjs`: `output: "server"`, `adapter: cloudflare({ imageService:
  "passthrough" })`, `session: { driver: sessionDrivers.memory() }` — these
  avoid Worker bindings (IMAGES, SESSION KV) that Base44 hosting doesn't
  provision yet.
- `wrangler.jsonc`: keeps `compatibility_flags: ["nodejs_compat"]`, required for
  Base44 SSR.
