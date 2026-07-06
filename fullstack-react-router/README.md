# Base44 Estates — Full-Stack React Router 7

A real-estate agency website, server-rendered with [React Router 7](https://reactrouter.com) on **Base44 full-stack hosting**. It's a working showcase of the pieces you'd reach for in a production app:

- **SSR + edge caching** — public pages fetch data server-side in loaders and set `Cache-Control` so the Base44 dispatcher edge-caches the rendered HTML. Repeat visits are instant.
- **Entities with row-level security (RLS)** — `Property`, `Inquiry`, and `Favorite`, each with real access rules enforced by the backend.
- **Auth** — login/logout via the Base44 SDK, private per-user pages, and a hosted-login redirect for anonymous visitors.
- **Server-only data access** — the SDK talks to Base44 from inside the Worker (loaders/actions). No service token ever reaches the browser bundle.
- **An AI agent** — an "Estate Assistant" concierge defined in config.

> **Preview feature.** Full-stack hosting is in preview. This example pins preview builds of the SDK and CLI (`@base44-preview/sdk`, `@base44-preview/cli`) via npm aliases in `package.json`; they move to `@base44/sdk` and `base44` at GA.

---

## Entities & row-level security

Schemas live in `base44/entities/*.jsonc`. RLS syntax follows the [Base44 security docs](https://docs.base44.com/developers/backend/resources/entities/security): each of `create`/`read`/`update`/`delete` is `true`, `false`, or a condition object. `{{user.email}}` only resolves for a logged-in user, so any condition referencing it implicitly requires authentication.

### `Property` — public catalog, agent-owned writes
Fields: `title`, `description`, `price`, `address`, `city`, `bedrooms`, `bathrooms`, `sqft`, `property_type` (`house`/`apartment`/`condo`/`land`), `status` (`for_sale`/`sold`/`pending`), `images[]` (`{ url }`), `featured`, `agent_email`.

```jsonc
"rls": {
  "create": { "$or": [ { "data.agent_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] },
  "read": true,
  "update": { "$or": [ { "data.agent_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] },
  "delete": { "$or": [ { "data.agent_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] }
}
```
Anyone can browse listings; only the listing agent (or an admin) can create/edit/delete.

### `Inquiry` — anyone submits, only the agent reads
Fields: `property_id`, `property_title`, `name`, `email`, `phone`, `message`, `status` (`new`/`contacted`/`closed`), `agent_email`.

```jsonc
"rls": {
  "create": true,
  "read": { "$or": [ { "data.agent_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] },
  "update": { "$or": [ { "data.agent_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } } ] },
  "delete": { "user_condition": { "role": "admin" } }
}
```
This is the entity that demonstrates RLS **protecting data**: a visitor can send an inquiry, but can never read anyone's inquiries. Only the property's agent sees their leads. Base44 RLS can't follow cross-entity relations, so the property's `agent_email` is **denormalized onto the inquiry** at creation time (the server derives it from the `Property`, ignoring any client-supplied value).

### `Favorite` — strictly private to each user
Fields: `property_id`, `user_email`.

```jsonc
"rls": {
  "create": { "data.user_email": "{{user.email}}" },
  "read":   { "data.user_email": "{{user.email}}" },
  "update": { "data.user_email": "{{user.email}}" },
  "delete": { "data.user_email": "{{user.email}}" }
}
```
Every operation is scoped to the owner — no public or admin escape hatch.

---

## Routes

| Route | Rendering | Cache | Notes |
|-------|-----------|-------|-------|
| `/` | SSR | `public, max-age=60, s-maxage=60` | Hero + featured/latest grids, read server-side in the loader. Edge-cacheable. |
| `/listings` | SSR | `public, max-age=60, s-maxage=60` | Filter by city, type, bedrooms, price, status (GET form → shareable URLs). Each query is edge-cached. |
| `/property/:id` | SSR | `public, max-age=60, s-maxage=60` | **Dynamic** detail page. Gallery, stats, "save to favorites", and an inquiry `<Form>` that POSTs to the route `action` (POST is never cached). |
| `/favorites` | SSR | `no-store` | **Private.** Loader reads the user via the request cookie; redirects anonymous visitors to hosted login. Shows only the user's own saved homes (RLS). |
| `/agent` | SSR | `no-store` | **Private.** An agent's listings + inbound inquiries. RLS means an agent sees only their own leads. Inline status updates via a fetcher `action`. |
| `/seed` | SSR | `no-store` | **Admin-only.** One click bulk-creates realistic sample listings so you can populate the app fast. |

**Why the caching split matters:** the header renders auth state on the **client** only, so the SSR HTML that gets edge-cached is user-neutral — a cached public page never leaks one visitor's identity to another. Private pages opt out with `no-store`.

---

## AI agent

`base44/agents/estate_assistant.jsonc` defines a concierge (`anthropic/claude-sonnet-4-20250514`) that can **read `Property`** and **create/read `Inquiry`**, so it can search listings for a visitor and file a tour request with the right agent:

```jsonc
{
  "name": "estate_assistant",
  "description": "Concierge that helps visitors find homes and send inquiries to agents",
  "model": "anthropic/claude-sonnet-4-20250514",
  "tool_configs": [
    { "entity_name": "Property", "allowed_operations": ["read"] },
    { "entity_name": "Inquiry",  "allowed_operations": ["create", "read"] }
  ]
}
```

Push it with `npx base44 agents push` (or the full `npx base44 deploy`).

### Connector (easy add)
A **Gmail / email connector** would let the assistant (or a backend function) email agents when a new inquiry lands. Connectors require OAuth credentials, so they can't be committed here without secrets — set one up in the Base44 dashboard (see [connector docs](https://docs.base44.com/developers/backend/resources/connectors)) and call it from a backend function that triggers on inquiry creation.

---

## Get started

> Node.js v20.19.0+ and a [Base44 account](https://app.base44.com) required.

```bash
cd fullstack-react-router
npm install

npx base44 login
npx base44 link      # writes base44/.app.jsonc with your app ID
```

Push the backend (entities + agent) and deploy:

```bash
npx base44 deploy            # runs npm run build, uploads the Worker + entities + agent
npx base44 deploy --prod     # promote when the preview looks right
```

### Seed sample data
Two options:

1. **In-app (fastest):** sign in, set your user's role to `admin` in the Base44 dashboard, then open **`/seed`** and click *Seed listings*. It bulk-creates ~10 homes owned by you, so they appear on `/agent` and can receive inquiries.
2. **CLI/SDK:** create `Property` records with `npx base44` entity commands or a small SDK script — see `app/lib/seed-data.ts` for ready-to-use payloads.

Until the app has data, the public pages fall back to the bundled demo listings so the site never looks empty.

### Local development
```bash
npm run dev
```
For local auth/data, provide `BASE44_APP_ID` (and optionally `BASE44_API_URL`, `BASE44_SERVICE_TOKEN`) to the Worker via `.dev.vars`. The server injects the app ID into the page as a `<meta>` tag, which the browser SDK reads. (`VITE_BASE44_APP_ID` works as a client-only fallback.)

---

## How the SDK is used (and kept safe)

- **`app/lib/base44.server.ts`** — server-only. `getServerClient({ request, env })` binds to the visitor's session cookie; `getCatalogReader()` uses the service role for public reads when a token is present (guaranteed on Base44 hosting) and falls back to the anonymous client otherwise. `createServerClient` is imported **only** here, so it's tree-shaken out of the client bundle.
- **`app/lib/base44.client.ts`** — browser-only. `createClient({ appId })` with **no** service token; it can only ever act as the anonymous or logged-in user. The app ID comes from the injected `<meta>` tag.

The production build was verified to contain **no** service token and **no** `createServerClient` in `build/client/*` — elevated access lives strictly in the Worker.

## Project structure

```
fullstack-react-router/
├── base44/
│   ├── config.jsonc                # project name + build commands
│   ├── entities/                   # Property.jsonc, Inquiry.jsonc, Favorite.jsonc (+ RLS)
│   └── agents/estate_assistant.jsonc
├── app/
│   ├── root.tsx                    # document shell, Header/Footer, meta-tag SDK config
│   ├── routes.ts                   # route table
│   ├── routes/                     # home, listings, property, favorites, agent, seed
│   ├── components/                 # Header, Footer, PropertyCard/Grid, InquiryForm, …
│   ├── lib/                        # base44.server/client, types, format, seed-data, favorites-context
│   └── app.css                     # hand-authored design system (no CSS framework)
├── workers/app.ts                  # Worker entry: passes { cloudflare: { env, ctx } } to loaders
├── react-router.config.ts          # ssr:true + future.v8_viteEnvironmentApi
├── vite.config.ts                  # @cloudflare/vite-plugin + React Router
└── wrangler.jsonc                  # nodejs_compat
```

## See also
- [Base44 Documentation](https://docs.base44.com)
- [Entities & Security](https://docs.base44.com/developers/backend/resources/entities/security)
- [SDK Reference](https://docs.base44.com/developers/references/sdk)
- [CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
