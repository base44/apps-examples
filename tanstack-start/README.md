# TanStack Guestbook

A server-rendered guestbook built with [TanStack Start](https://tanstack.com/start) and the [Base44](https://base44.com) backend. It shows a full-stack Base44 app: pages rendered on the server, server functions that read and write a Base44 entity, and a GitHub workflow that deploys the app on every push to `main`.

## Get started

> **Note:** Node.js v20.19.0 or higher and a [Base44 account](https://app.base44.com) are required.

1. Install the Base44 CLI globally.

   ```bash
   npm install -g base44
   ```

2. From the repo root, go to the app and install its dependencies.

   ```bash
   cd tanstack-start
   npm ci
   ```

3. Log in and link the project.

   ```bash
   base44 login
   base44 link
   ```

   This links your local project to a new or existing Base44 project. The command creates `base44/.app.jsonc` with your app ID.

4. Build the app and deploy it, along with the `GuestbookEntry` entity.

   ```bash
   base44 deploy --build --git-hash $(git rev-parse HEAD)
   ```

   A full-stack build deploys by the commit it was built from, so pass `--git-hash`. The command prints the app's URL when it's done.

5. Start development.

   ```bash
   base44 dev
   ```

   This runs a local Base44 backend and the app together.

## Deploy from GitHub

[`.github/workflows/deploy-tanstack-start.yml`](../.github/workflows/deploy-tanstack-start.yml) deploys the app whenever a push to `main` changes `tanstack-start/`. You can also run it by hand from the **Actions** tab. It installs dependencies, then runs `base44 deploy -y --build --git-hash "$GITHUB_SHA"`, so each deployment is addressed by the commit that triggered it.

Before the first run, add these in the repository's **Settings → Secrets and variables → Actions**:

| Name | Kind | Value |
| --- | --- | --- |
| `BASE44_API_KEY` | Secret | A Base44 workspace API key (starts with `b44k_`). The CLI uses it instead of `base44 login`. |
| `TANSTACK_START_APP_ID` | Variable | The ID of the Base44 app to deploy to, from `base44/.app.jsonc` after `base44 link`. |

## Features

- **Server rendering**: the guestbook page is rendered on the server; its loader calls a server function.
- **Server functions**: `src/lib/server-fns.js` lists and creates entries as the visitor, so the entity's access rules apply.
- **Entity access rules**: anyone can read and sign the guestbook; only admins can edit or delete entries (`base44/entities/guestbook-entry.jsonc`).
- **Continuous deployment**: a GitHub workflow deploys `main` with the Base44 CLI.

## How the pieces fit

- **Pages** are files in `src/routes/`. A route's `loader` runs on the server for a document request and in the browser for a client navigation; `Route.useLoaderData()` gives the component the resolved data.
- **Server functions** (`src/lib/server-fns.js`) are RPCs created with `createServerFn`. `src/start.js` runs every one of them through `authMiddleware`, which sends the visitor's token along, so `context.getBase44()` returns a client acting as that visitor and entity access rules apply. `context.getBase44().asServiceRole` bypasses them, so use it only after authenticating the caller (`.middleware([requireUser])`) and checking they may access the records involved: server functions and server routes are public endpoints anyone can call with any input. See **Server Security** in `AGENTS.md`. Call it only in handlers that need Base44: it reads the platform headers, and a handler that never calls it works without them.
- **Secrets** are read in server code with `import { secrets } from "base44:runtime"` → `secrets.get("NAME")`, inside a handler. Never `process.env`.
- **Server routes** (`src/routes/api/*.js`) are raw HTTP endpoints for URLs something other than the app's own code requests (webhooks, downloads, feeds); the app's pages call server functions. `src/start.js` runs every request through `base44RequestMiddleware`, so their `server.handlers` receive the same `context.getBase44()` (`({ request, params, context }) => …`).
- **Server-only code** lives in `*.server.js` files (TanStack refuses to bundle them for the browser).
- **Auth** is resolved client-side after hydration (`useAuth()`); the server is anonymous on a document request, so give per-user pages `ssr: false`.
- **Sign-in and gated pages** are not wired in the starter: `src/components/auth/` holds the pages (login, register, password reset, MCP consent) and a login gate for `src/routes/_authed/`, to add when the app needs them. See **Adding Authentication** in `AGENTS.md`.
- **AI**: TanStack AI is installed and runs on the Base44 AI gateway, with no API key and usage billed to the app's AI credits. `gatewayModel(context.getBase44())` in `src/lib/ai.server.js` builds the adapter; `AGENTS.md` has a streaming chat example (a server route plus `useChat`).
- **Caching**: the platform caches only what a route opts into via `headers()` (`Cache-Control: public, s-maxage=…`). Everything else is served fresh.
