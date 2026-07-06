# Base44 CRM — TanStack Start

A polished, private **team sales CRM** (think monday.com / Salesforce) built on
[**TanStack Start**](https://tanstack.com/start) and served from **Base44
full-stack hosting** on Cloudflare Workers.

It's a real, opinionated showcase of the platform:

- **Entities with per-owner Row-Level Security** — every rep sees only their own
  contacts, deals, and activities; a sales manager sees the whole team.
- **Authentication** — email/password and Google OAuth via the Base44 SDK.
- **Dynamic SSR dashboards** — pipeline KPIs are computed on the Worker with a
  server function, per logged-in user, on every request.
- **A drag-and-drop kanban board** — moving a card writes the new stage straight
  from the browser SDK.
- **An AI Sales Copilot** — a Base44 agent that reads your pipeline and drafts
  follow-ups, scoped to your data by the same RLS rules.

Everything requires login. Every server-fetched page is per-user and served
`Cache-Control: no-store`.

## How it works

| Concern | Implementation |
| --- | --- |
| **Server rendering / reads** | `createServerFn` handlers run only on the Worker. They build a request-scoped client with `createServerClient({ request, env })`, which reads the visitor's token from the `base44_access_token` cookie — so every read is executed *as that user* and RLS-scoped. See `src/lib/crm.ts` + `src/lib/server.ts`. |
| **Client writes** | The kanban drag, the deal/contact forms, and the copilot use the **browser** SDK (`createClient({ appId })`, `src/lib/browser-client.ts`). The app id is resolved server-side and handed to the client through the root route context. |
| **Auth** | `src/routes/login.tsx` (`loginViaEmailPassword` / `loginWithProvider`). The root route's `beforeLoad` resolves the session on the server; private routes redirect anonymous visitors to `/login`. |
| **No caching** | Each read server function calls `markPrivate()` → `setResponseHeader("Cache-Control", "no-store")`. |
| **Worker safety** | `cloudflare:workers` is imported lazily *inside* server-fn handlers only, so it never leaks into the client bundle. |

## Data model & Row-Level Security

Entities live in `base44/entities/*.jsonc`. RLS is expressed with the `rls` block
([docs](https://docs.base44.com/developers/backend/resources/entities/security)).
The pattern: **the record's owner OR a manager/admin**.

**`Contact`** — `name`, `email`, `company`, `phone`, `title`, `owner_email`

```jsonc
"rls": {
  "create": true,
  "read":   { "$or": [ { "data.owner_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] },
  "update": { "$or": [ { "data.owner_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] },
  "delete": { "$or": [ { "data.owner_email": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] }
}
```

**`Deal`** — `title`, `contact_id`, `amount`, `stage`
(`lead`/`qualified`/`proposal`/`negotiation`/`won`/`lost`), `close_date`,
`owner_email`, `notes`. **Same owner-scoped RLS as `Contact`.** Because access
keys off the `owner_email` field (not the immutable `created_by`), a manager can
reassign a deal and access follows the new owner.

**`Activity`** — `deal_id`, `contact_id`, `type`
(`call`/`email`/`meeting`/`note`), `summary`. Scoped on the **built-in
`created_by`** field (referenced without a `data.` prefix):

```jsonc
"rls": {
  "create": true,
  "read":   { "$or": [ { "created_by": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] },
  "update": { "$or": [ { "created_by": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] },
  "delete": { "$or": [ { "created_by": "{{user.email}}" }, { "user_condition": { "role": "admin" } }, { "user_condition": { "role": "manager" } } ] }
}
```

> **Reps vs. managers:** the built-in Base44 `role` is `admin` or `user`. A
> regular rep (`user`) sees only their own rows; give a sales manager the `admin`
> role (in the dashboard) to unlock the team-wide view. The rules also honor a
> custom `manager` role if you define one.

## Routes

All pages are **private** (login required) and served **`Cache-Control: no-store`**.

| Route | File | What it does |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | **Pipeline dashboard** — SSR KPIs (open pipeline, weighted forecast, won revenue, win rate), a by-stage funnel, and "closing soon", computed server-side from your deals. |
| `/deals` | `src/routes/deals.index.tsx` | **Kanban board** — columns per stage; drag a card to change its stage (client-side SDK write). Create deals from here. |
| `/deals/$id` | `src/routes/deals.$id.tsx` | **Deal detail** — contact info, activity timeline, and an add-activity form. |
| `/contacts` | `src/routes/contacts.tsx` | **Contacts** — list with create/edit. |
| `/login` | `src/routes/login.tsx` | Email/password + Google OAuth. |

## AI Sales Copilot

`base44/agents/sales_copilot.jsonc` defines the agent. Its tools are scoped to
the CRM entities, and because it runs as the logged-in rep, its entity access
still obeys RLS.

```jsonc
{
  "name": "sales_copilot",
  "description": "AI sales assistant that summarizes your pipeline, drafts follow-ups, and logs activities.",
  "instructions": "You are Sales Copilot … read the rep's Deals and Contacts and create Activities …",
  "model": "anthropic/claude-sonnet-4-20250514",
  "tool_configs": [
    { "entity_name": "Deal",     "allowed_operations": ["read", "update"] },
    { "entity_name": "Contact",  "allowed_operations": ["read"] },
    { "entity_name": "Activity", "allowed_operations": ["read", "create"] }
  ]
}
```

It surfaces as a chat panel (the ✨ button, bottom-right). The UI creates a
conversation with `agents.createConversation`, streams replies over
`agents.subscribeToConversation`, and sends turns with `agents.addMessage`
(`src/components/Copilot.tsx` + `src/components/copilot/useCopilot.ts`). Try:

- "Summarize my pipeline"
- "Which deals are closing soon?"
- "Draft a follow-up for my top deal"

## Getting started

> Requires Node.js v20.19.0+ and a [Base44 account](https://app.base44.com).

```bash
# 1. From this app directory, install dependencies
npm install

# 2. Log in and link the project (creates base44/.app.jsonc with your app id)
npx base44 login
npx base44 link

# 3. Deploy the entities + agent to Base44
npx base44 deploy

# 4. Run locally
npm run dev
```

Build for production hosting:

```bash
npm run build      # outputs dist/ and .wrangler/deploy/config.json
npm run typecheck  # tsc --noEmit (optional; requires a prior build for routeTree.gen.ts)
```

## Seed sample data

Populate a realistic pipeline (8 contacts, 11 deals across every stage, a few
activities) in one command. Everything is created as **you**, so it lands in
your RLS scope.

```bash
BASE44_APP_ID=<your app id> \
BASE44_EMAIL=<your login email> \
BASE44_PASSWORD=<your password> \
node scripts/seed.mjs
```

Find your app id in `base44/.app.jsonc` (written by `base44 link`). Prefer the
UI? Just click **New contact** / **New deal**.

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** — full-stack React with SSR + server functions
- **[Base44](https://base44.com)** — auth, entities, RLS, agents, hosting
- **React 19**, **TypeScript**, **Vite 7**
- **[Cloudflare Workers](https://workers.cloudflare.com/)** via `@cloudflare/vite-plugin` + Wrangler
- Hand-written CSS (no UI framework) — see `src/styles/app.css`

## Project structure

```
fullstack-tanstack-start/
├── base44/
│   ├── config.jsonc              # Project config
│   ├── agents/sales_copilot.jsonc
│   └── entities/                 # Contact.jsonc · Deal.jsonc · Activity.jsonc (schema + RLS)
├── scripts/seed.mjs              # Sample-data seeder
├── src/
│   ├── router.tsx                # getRouter() factory (Base44 hosting entry)
│   ├── styles/app.css            # Design system
│   ├── lib/
│   │   ├── server.ts             # getServerClient() + markPrivate()  (server-only)
│   │   ├── session.ts            # getSession server fn (runs in root beforeLoad)
│   │   ├── crm.ts                # read server functions (dashboard, pipeline, contacts, detail)
│   │   ├── browser-client.ts     # browser SDK singleton (client writes + agent)
│   │   ├── stats.ts / format.ts  # pure helpers
│   │   ├── types.ts / guard.ts   # shared types + auth guard
│   ├── components/               # header, kanban, forms, timeline, copilot, …
│   └── routes/                   # __root · index · login · deals.index · deals.$id · contacts
├── wrangler.jsonc                # main: @tanstack/react-start/server-entry, nodejs_compat
└── vite.config.ts                # cloudflare() + tanstackStart() + react()
```
