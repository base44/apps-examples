# AGENTS.md

## Project Context

This is a Base44 app repository built with **TanStack Start** (React 19, plain JavaScript — no TypeScript): file-based routes, server functions and server routes, server-side rendering by default. Treat it as user-owned application code, keep changes focused on the user's request, and preserve the conventions below.

Start with `README.md` for local setup and the publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/routes/__root.jsx`: the HTML document (`<html>`, `<head>` via `HeadContent`, `<Scripts />`) and the providers. There is **no `index.html`**.
- `src/routes/*.jsx`: one page per file (`index.jsx` → `/`, `posts.$id.jsx` → `/posts/$id`). `src/routes/api/*.js`: server routes (raw HTTP endpoints). `src/routeTree.gen.ts` is generated on every dev/build run — never edit or commit it (it is the one TypeScript file, owned by the router plugin).
- `src/lib/server-fns.js`: server functions (`createServerFn`), the data layer pages call.
- `src/start.js`: the Start instance; it applies `src/lib/auth-middleware.js` — `authMiddleware` to every server function and `base44RequestMiddleware` to every request — so each server function and server route handler gets `context.getBase44()` (returns a server-side SDK client acting as the visitor, created on first call) without opting in. Only call it when the handler needs Base44 — it requires the platform headers, and a handler that never calls it must still answer without them.
- `src/lib/auth-middleware.js`: the server-side SDK client, built from the platform headers with `createClientFromRequest` and handed to every server function and server route as `context.getBase44()`. `src/api/base44Client.js`: the browser SDK client, same as the Base44 SPA template — leave it at that path, the builder tooling probes it.
- `src/lib/AuthContext.jsx`: client-side session (`useAuth()`: `user`, `isAuthenticated`, `isLoadingAuth`, `authError`, `refresh`, `logout`, `navigateToLogin`), resolved after hydration as `authQuery` in the router's QueryClient (one `/me` call per page load when an access token is present, none for anonymous visitors; shared with the login gate, which reads it from the router context).
- `src/components/auth/`: auth boilerplate — the auth pages and a login gate. Nothing imports it until you wire it in; see **Adding Authentication**.
- `__root.jsx` renders `<Base44Scripts />` (from `base44:document`, a virtual module the Base44 Vite plugin serves) in `<body>` right before `<Scripts />`: the builder and analytics hooks an `index.html` app gets injected. Keep it there — never in `head()` (the preview proxy prepends its own scripts to `<head>`, which breaks React hydration of any script rendered there) and not after `<Scripts />` (module scripts run in document order, so the error handlers must come before the app entry). Keep `data-react-root` on `<body>` too; the builder's preview bridge reads it.
- App chrome: the starter has none. A shared header or nav is a component the app writes, rendered around `<Outlet />` by a layout route, so the auth pages stay outside it: `__root.jsx` while the app has no auth routes; `_authed.jsx` once it has them, with gated pages under `_authed/`; and if it also keeps public pages, a pathless `_site.jsx` rendering the same component, with those pages under `_site/`. The home page (`/`) is one file — `index.jsx`, `_authed/index.jsx` or `_site/index.jsx`: move it there, never copy it.
- `src/components/ui/`: shadcn/ui kit (JSX, shared with the Base44 SPA template). `src/index.css` + `tailwind.config.js`: design tokens.
- `vite.config.js`: `base44()` (sandbox/platform wiring), `cloudflare({ viteEnvironment: { name: "ssr" } })`, `tanstackStart()`, `react()`. The Cloudflare plugin runs the server in `workerd` and emits the build Base44's publish reads. Do not remove or reorder any of them. Keep `PREBUNDLE`: Vite bundles every runtime dependency in `package.json` at startup, for the browser and the server, so a package first imported mid-session can't make the server render load a second React. A new dependency joins it automatically.
- `wrangler.jsonc`: the Worker's entry (`@tanstack/react-start/server-entry`), compatibility date and `nodejs_compat`. Keep `main` and `nodejs_compat`. Bindings and `vars` in it are not deployed: secrets come from the Base44 dashboard / `base44 secrets set`.

## Adding Authentication

The starter ships no sign-in UI and no auth routes. `AuthProvider` resolves the visitor and `useAuth()` exposes it; everything else is boilerplate in `src/components/auth/` that renders nothing until a route or the header uses it. Wire in only what the app needs, and keep the components' flows, SDK calls and `returnTo` handling when you restyle them.

- **Sign-in entry point**: a Sign in button calls `useAuth().navigateToLogin()`, which sends the visitor to `/login` and back to the current page; Sign out calls `useAuth().logout()`. On an app with its own auth pages `/login` is the app's route below; otherwise the platform serves it.
- **Gated pages**: create the login gate once, then put every page that requires a session under `src/routes/_authed/` (`_authed/dashboard.jsx` → `/dashboard`). The gate resolves the session before any child loader runs, sends a signed-out visitor to `/login?returnTo=…` and shows the not-registered screen to a Base44 user who is not a user of this app; children read the visitor with `Route.useRouteContext().user`. Never re-implement the gate in a page.

```jsx
// src/routes/_authed.jsx
import { createFileRoute } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";

export const Route = createFileRoute("/_authed")({ ssr: false, beforeLoad: requireSignedIn, errorComponent: AuthGateError });
```

- **The app's own auth pages** (an app with custom auth, which serves `/login` itself instead of the platform): create all four routes together, even when only one was asked for — each page links to the others and the reset email targets `/reset-password`. Each route file only wires a page component from `src/components/auth/`:

| Route file | Path | Component |
| --- | --- | --- |
| `src/routes/login.jsx` | `/login` | `LoginPage` |
| `src/routes/register.jsx` | `/register` | `RegisterPage` (register → email code → `verifyOtp` → `setToken`; never sign in right after `register`, the account is unverified) |
| `src/routes/forgot-password.jsx` | `/forgot-password` | `ForgotPasswordPage` |
| `src/routes/reset-password.jsx` | `/reset-password` | `ResetPasswordPage` (reads `?token=`) |

```jsx
// src/routes/login.jsx — the other three follow the same shape
import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/auth/LoginPage";

export const Route = createFileRoute("/login")({ ssr: false, head: () => ({ meta: [{ title: "Sign in" }] }), component: LoginPage });
```

  These pages render full-screen: keep them outside any layout route that renders app chrome (header, nav). Every page honors a same-origin `returnTo` (and the platform's `from_url`) via `safeReturnTo()` from `src/lib/authReturnTo.js` — keep that, never hardcode `/`.
- **MCP consent**: an app with an MCP server needs `src/routes/oauth/consent.jsx` (`/oauth/consent`) rendering `ConsentPage`, with `ssr: false`. It handles the signed-out case itself, so keep it outside `_authed/`.

## Server Security

- Every server function and every server route is a public HTTP endpoint: anyone can call it directly, with any input, without going through your pages. A page's `beforeLoad`, redirect or hidden button protects nothing on the server.
- `authMiddleware` only forwards the visitor's token; it does not reject anyone. A server function that needs a signed-in caller adds `.middleware([requireUser])` (from `src/lib/auth-middleware.js`) and reads `context.user`. Then check that this user may touch the records it asks for (owner, membership or role) before reading or changing them.
- Validate input with `.validator(...)` (zod is installed) — never trust ids, emails or roles sent by the caller.
- `context.getBase44().asServiceRole` bypasses every entity access rule. Use it only after `requireUser` plus an ownership/role check, or in a webhook that verifies its signature — never in a handler an anonymous caller reaches, and never to "fix" a page that renders empty for anonymous visitors.
- Bound every input of a credit-spending function: `.max()` on strings and arrays, `z.enum` for choices.
- The app's own code calls the server only through server functions, never by fetching one of its own routes. A server route (`src/routes/api/*`) is for a URL something else requests: a webhook or callback another service calls, a link or image the browser loads by itself (`<a href>`, `<img src>`), a feed or a public API. Those requests carry no visitor token, so such a route is public, verifies a webhook signature, or checks a short-lived signed token a server function issued. A route whose callers do send a Base44 token adds `server: { middleware: [requireUserRoute], handlers }` (from `src/lib/auth-middleware.js`): it answers anonymous callers with 401 and sets `context.user`. Put it only on `src/routes/api/*` files — a route's middleware also runs for every route under it.
- Never forward, log or return incoming request headers: the platform's request headers carry a service credential for this app.
- Secrets: set them with `base44 secrets set` and read them in server code only, with `import { secrets } from "base44:runtime"` → `secrets.get("NAME")` (never `process.env`). Anything under `import.meta.env.VITE_*` is compiled into the browser bundle — never put a secret there.
- A route that opts into shared caching (`Cache-Control: public` / `s-maxage` in `headers()`) must render the same HTML for everyone: no per-user data and no `asServiceRole` reads in its loader.

## AI Features

- TanStack AI is installed (`@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react`) and runs on the Base44 AI gateway: no API key, usage billed to the app's AI credits. In server code only, build the adapter with `gatewayModel(context.getBase44())` from `src/lib/ai.server.js`. It calls the gateway as the app (service role), since an owner can restrict the gateway to server-side calls, so authenticate the caller before calling it. Tools keep using `context.getBase44()` and act as the caller. Keep model `"automatic"` unless the task needs a specific one; named models cost more credits.
- Every AI call spends the app owner's credits, so an AI endpoint follows the Server Security rules above: sign-in required, input validated, and the loop bounded with `agentLoopStrategy: maxIterations(n)`.
- A chat UI streams from a server function: its handler returns the `chat(...)` stream, and `useChat` reads it through `fetcher`. Tools are ordinary server code and run as the signed-in caller:

```js
// src/lib/chat.js
import { chat, maxIterations, toolDefinition } from "@tanstack/ai";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayModel } from "@/lib/ai.server";
import { requireUser } from "@/lib/auth-middleware";

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ messages: z.array(z.any()).max(40) }))
  .handler(({ data, context }) => {
    const base44 = context.getBase44();
    const listOrders = toolDefinition({
      name: "listOrders",
      description: "The caller's recent orders, optionally filtered by status",
      inputSchema: z.object({ status: z.string().optional() }),
    }).server(({ status }) => base44.entities.Order.filter(status ? { status } : {}, "-created_date", 20));

    return chat({
      adapter: gatewayModel(base44),
      messages: data.messages,
      systemPrompts: ["You help customers with their orders."],
      tools: [listOrders],
      agentLoopStrategy: maxIterations(5),
    });
  });
```

- In the page, `useChat` streams the reply. Messages are `{ id, role, parts }`; render `part.content` for `part.type === "text"`. Give the page `ssr: false`, as for any per-user page.

```jsx
import { useChat } from "@tanstack/ai-react";
import { chatWithAssistant } from "@/lib/chat";

const { messages, sendMessage, isLoading } = useChat({
  // send only the recent history: the server caps it, and a long chat would otherwise fail every turn
  fetcher: ({ messages }, { signal }) => chatWithAssistant({ data: { messages: messages.slice(-40) }, signal }),
});
```

- For AI work without a chat (summaries, classification, background agents), call `chat({ adapter, messages, stream: false })` inside a server function and return its result, or pass `outputSchema` (a zod schema) for typed JSON.

## Working Notes

- `npm run dev` runs the TanStack dev server (Vite); server code runs in `workerd`, exactly as in production.
- `npm run build` emits `dist/client` (static assets), `dist/server` (the Worker) and `.wrangler/deploy/config.json` (what publish reads). Never commit any of them.
- Read secrets inside a handler with `secrets.get("NAME")` from `base44:runtime`. Never from client code.
- Data flows through the router: `loader` + `Route.useLoaderData()` for reads, `useServerFn` + TanStack Query mutations for writes. Every server function and server route already runs as the caller through `context.getBase44()`. The router creates the `QueryClient` per request (`src/router.jsx`); never share one across requests with a module-level client. To read through TanStack Query instead, prefetch in the loader with `context.queryClient.ensureQueryData(options)` and read the same options with `useSuspenseQuery` in the component: `setupRouterSsrQueryIntegration` sends the server-fetched cache to the browser, so it is not fetched twice. That cache is embedded in the HTML, so the shared-cache rule above applies to it.
- `ssr: false` only on pages that need the signed-in user, so personal data never lands in cacheable HTML, and on the auth pages and `oauth/consent` as wired above; every other page (home, listings, details, tools, pages with only browser state) stays SSR'd and may opt into edge caching via the route's `headers()` (`Cache-Control: public, s-maxage=…`).
- Server and first client render must match: read `window`, `document` and browser storage only in effects and handlers (never in render or a `useState` initializer), and format dates and numbers with an explicit locale and time zone.
- `/api/apps/**`, `/api/app-logs/**` and `/ws-user-apps/**` belong to the Base44 platform API — never define routes under them.
- Prefer the Base44 CLI (`base44 dev`, `base44 deploy`, `base44 secrets set`) over adding npm scripts for Base44 tasks.
- Run `npm run lint` before finishing code changes. Write JavaScript/JSX only — no `.ts`/`.tsx` files and no type annotations (the generated `src/routeTree.gen.ts` is the sole exception and is never hand-edited).
