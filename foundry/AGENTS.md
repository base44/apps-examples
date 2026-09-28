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
- `src/lib/AuthContext.jsx`: client-side session (`useAuth()`), resolved after hydration.
- `__root.jsx` renders `<Base44Scripts />` (from `base44:document`, a virtual module the Base44 Vite plugin serves) in `<body>` right before `<Scripts />`: the builder and analytics hooks an `index.html` app gets injected. Keep it there — never in `head()` (the preview proxy prepends its own scripts to `<head>`, which breaks React hydration of any script rendered there) and not after `<Scripts />` (module scripts run in document order, so the error handlers must come before the app entry). Keep `data-react-root` on `<body>` too; the builder's preview bridge reads it.
- `src/components/ui/`: shadcn/ui kit (JSX, shared with the Base44 SPA template). `src/styles/app.css` + `tailwind.config.js`: design tokens.
- `vite.config.js`: `base44()` (sandbox/platform wiring), `cloudflare({ viteEnvironment: { name: "ssr" } })`, `tanstackStart()`, `react()`. The Cloudflare plugin runs the server in `workerd` and emits the build Base44's publish reads. Do not remove or reorder any of them.
- `wrangler.jsonc`: the Worker's entry (`@tanstack/react-start/server-entry`), compatibility date and `nodejs_compat`. Keep `main` and `nodejs_compat`. Bindings and `vars` in it are not deployed: secrets come from the Base44 dashboard / `base44 secrets set`.

## Server Security

- Every server function and every server route is a public HTTP endpoint: anyone can call it directly, with any input, without going through your pages. A page's `beforeLoad`, redirect or hidden button protects nothing on the server.
- `authMiddleware` only forwards the visitor's token; it does not reject anyone. A server function that needs a signed-in caller adds `.middleware([requireUser])` (from `src/lib/auth-middleware.js`) and reads `context.user`. Then check that this user may touch the records it asks for (owner, membership or role) before reading or changing them.
- Validate input with `.inputValidator(...)` (zod is installed) — never trust ids, emails or roles sent by the caller.
- `context.getBase44().asServiceRole` bypasses every entity access rule. Use it only after `requireUser` plus an ownership/role check, or in a webhook that verifies its signature — never in a handler an anonymous caller reaches, and never to "fix" a page that renders empty for anonymous visitors.
- Server routes (`src/routes/api/*`) get `context.getBase44()` from `base44RequestMiddleware`, but `requireUser` is function middleware and does not apply to them: call `await context.getBase44().auth.me()` in the handler yourself and return a 401 `Response` when it rejects with status 401 or 403 (let other errors propagate). Call them from the browser with `base44.fetchWithAuth("/api/...")` — a plain `fetch` sends no token.
- Never forward, log or return incoming request headers: the platform's request headers carry a service credential for this app.
- Secrets: set them with `base44 secrets set` and read them as `process.env.NAME` in server code only. Anything under `import.meta.env.VITE_*` is compiled into the browser bundle — never put a secret there.
- A route that opts into shared caching (`Cache-Control: public` / `s-maxage` in `headers()`) must render the same HTML for everyone: no per-user data and no `asServiceRole` reads in its loader.

## AI Features

- TanStack AI is installed (`@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-react`) and runs on the Base44 AI gateway: no API key, usage billed to the app's AI credits. In server code only, build the adapter with `gatewayModel(context.getBase44())` from `src/lib/ai.server.js`. It calls the gateway as the app (service role), since an owner can restrict the gateway to server-side calls, so authenticate the caller before calling it. Tools keep using `context.getBase44()` and act as the caller. Keep model `"automatic"` unless the task needs a specific one; named models cost more credits.
- Every AI call spends the app owner's credits, so an AI endpoint follows the Server Security rules above: sign-in required, input validated, and the loop bounded with `agentLoopStrategy: maxIterations(n)`.
- A chat UI streams from a server route. Tools are ordinary server code and run as the signed-in caller:

```js
// src/routes/api/chat.js
import { createFileRoute } from "@tanstack/react-router";
import { chat, chatParamsFromRequest, maxIterations, toServerSentEventsResponse, toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { gatewayModel } from "@/lib/ai.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const base44 = context.getBase44();
        const user = await base44.auth.me().catch((error) => {
          if (error?.status === 401 || error?.status === 403) return null;
          throw error;
        });
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { messages } = await chatParamsFromRequest(request);
        const listOrders = toolDefinition({
          name: "listOrders",
          description: "The caller's recent orders, optionally filtered by status",
          inputSchema: z.object({ status: z.string().optional() }),
        }).server(({ status }) => base44.entities.Order.filter(status ? { status } : {}, "-created_date", 20));

        return toServerSentEventsResponse(
          chat({
            adapter: gatewayModel(base44),
            messages,
            systemPrompts: ["You help customers with their orders."],
            tools: [listOrders],
            agentLoopStrategy: maxIterations(5),
          }),
        );
      },
    },
  },
});
```

- In the page, `useChat` streams the reply; `base44.fetchWithAuth` sends the visitor's token with the request (a plain `fetch` sends none). Messages are `{ id, role, parts }`; render `part.content` for `part.type === "text"`. Give the page `ssr: false`, as for any per-user page.

```jsx
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { base44 } from "@/api/base44Client";

const { messages, sendMessage, isLoading } = useChat({
  connection: fetchServerSentEvents("/api/chat", { fetchClient: base44.fetchWithAuth }),
});
```

- For AI work without a chat (summaries, classification, background agents), call `chat({ adapter, messages, stream: false })` inside a server function and return its result, or pass `outputSchema` (a zod schema) for typed JSON.

## Working Notes

- `npm run dev` runs the TanStack dev server (Vite); server code runs in `workerd`, exactly as in production.
- `npm run build` emits `dist/client` (static assets), `dist/server` (the Worker) and `.wrangler/deploy/config.json` (what publish reads). Never commit any of them.
- Read secrets inside a handler: `import { env } from "cloudflare:workers"` (or `secrets.get()` from `base44:runtime`). Never from client code.
- Data flows through the router: `loader` + `Route.useLoaderData()` for reads, `useServerFn` + TanStack Query mutations for writes. Every server function and server route already runs as the caller through `context.getBase44()`. The router creates the `QueryClient` per request (`src/router.jsx`); never share one across requests with a module-level client. To read through TanStack Query instead, prefetch in the loader with `context.queryClient.ensureQueryData(options)` and read the same options with `useSuspenseQuery` in the component: `setupRouterSsrQueryIntegration` sends the server-fetched cache to the browser, so it is not fetched twice. That cache is embedded in the HTML, so the shared-cache rule above applies to it.
- Per-user pages set `ssr: false` on the route so personal data never lands in cacheable HTML; public pages stay SSR'd and may opt into edge caching via the route's `headers()` (`Cache-Control: public, s-maxage=…`).
- `/api/apps/**`, `/api/app-logs/**` and `/ws-user-apps/**` belong to the Base44 platform API — never define routes under them.
- Prefer the Base44 CLI (`base44 dev`, `base44 deploy`, `base44 secrets set`) over adding npm scripts for Base44 tasks.
- Run `npm run lint` before finishing code changes. Write JavaScript/JSX only — no `.ts`/`.tsx` files and no type annotations (the generated `src/routeTree.gen.ts` is the sole exception and is never hand-edited).
