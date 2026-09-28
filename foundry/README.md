# Foundry - AI Product Studio

An AI product studio built on [TanStack Start](https://tanstack.com/start) and [TanStack AI](https://tanstack.com/ai), running on the [Base44](https://base44.com) AI gateway. Describe a product and a copilot drafts a roadmap board with you: it streams its answers, writes Base44 entities through server tools, drives the page through browser tools, and waits for your approval before anything destructive.

Every model call runs in the app's own server, on the Base44 AI gateway. There are no API keys, you can use any supported model, and usage is billed to the app's Base44 AI credits.

## Get started

> **Note:** Node.js v20.19.0 or higher and a [Base44 account](https://app.base44.com) are required.

1. Install the Base44 CLI globally.

   ```bash
   npm install -g base44
   ```

2. From the repo root, go to the app and install its dependencies.

   ```bash
   cd foundry
   npm ci
   ```

3. Log in and link the project.

   ```bash
   base44 login
   base44 link
   ```

   This links your local project to a new or existing Base44 project. The command creates `base44/.app.jsonc` with your app ID.

4. Push the entities, build the app and publish it.

   ```bash
   base44 deploy
   ```

5. Or run it locally, with the local backend and the app together.

   ```bash
   base44 dev
   ```

## Features

- **Projects and boards**: Create a product with a one-line pitch and get a four-column roadmap (idea, planned, building, shipped) with drag and drop, impact scores, effort sizes and tags.
- **Copilot**: A streaming chat agent that reads the board, adds, re-scores and moves cards, and explains its choices.
- **Kickoff**: A new project opens with the copilot already drafting its first cards.
- **Browser tools**: The copilot can focus a card, filter the board by tag, or celebrate a shipped feature with confetti.
- **Approvals**: Deleting a card pauses the run at an approval card. The paused run is saved with the conversation, so you can reload the page and still approve or deny.
- **Launch brief**: A structured launch document (positioning, personas, MVP cut, risks, launch checklist) that fills in section by section as it streams.
- **Auto-triage**: A background agent re-scores and re-sorts the whole board, then shows a summary of every move.
- **Whiteboard photos**: Drop an image into the chat, and the model turns the sticky notes into cards.
- **Model picker**: Automatic, Claude, GPT or Gemini, selectable per request.
- **Stream inspector**: A live view of each run's AG-UI events: time to first byte, time to first token, event counts, tool calls and token usage.

## How each TanStack AI pattern maps to the code

| Pattern | Where |
| --- | --- |
| Streaming chat over SSE: `chat()` → `toServerSentEventsResponse()` → `useChat` + `fetchServerSentEvents` | `src/routes/api/copilot.js`, `src/components/studio/Copilot.jsx` |
| The gateway adapter, called as the app with `Base44-State` forwarded | `src/lib/ai.server.js` (`gatewayModel`) |
| Server tools that write entities as the signed-in caller, so entity access rules still apply | `src/lib/foundry.server.js` (`boardTools`) |
| Client tools: `toolDefinition()` shared by server and browser, `.client()` implementations | `src/lib/tool-defs.js`, `src/lib/client-tools.js` |
| `needsApproval: true` plus approval UI, resolved through `interrupt.resolveInterrupt()` | `deleteFeature` in `src/lib/foundry.server.js`, `src/components/studio/ToolCallCard.jsx` |
| Persisting the conversation and a paused run (`{ messages, resume }`) in a Base44 entity | `src/lib/thread-persistence.js`, `base44/entities/thread.jsonc` |
| A streamed typed document: `parsePartialJSON` while streaming, zod validation at the end | `src/routes/api/brief.js`, `src/components/studio/BriefPanel.jsx` |
| A non-streaming agent loop with `outputSchema` and `maxIterations`, in a server function | `triageBoard` in `src/lib/server-fns.js` |
| Multimodal input: upload with `base44.integrations.Core.UploadFile`, send an image part | `src/components/studio/Copilot.jsx` |
| Reading raw AG-UI chunks with `onChunk` for metrics | `src/hooks/use-stream-stats.js`, `src/components/studio/StreamInspector.jsx` |

### Client tools and approvals need the client's run ids

Browser tools and approvals pause the run as AG-UI interrupts. For the next request to resume the same run, the server route must pass the client's ids and resume state into `chat()`:

```js
const { messages, forwardedProps, threadId, runId, parentRunId, resume } = await chatParamsFromRequest(request);

return toServerSentEventsResponse(
  chat({ adapter, messages, threadId, runId, parentRunId, resume, tools }),
);
```

Without `threadId` and `runId`, the tool result fails to bind to its interrupt. Without `parentRunId` and `resume`, the continuation is rejected.

### Structured output and streaming

The Base44 gateway buffers completions that set `response_format` (`outputSchema` in TanStack AI), and tool-call arguments. They arrive in one chunk when the model finishes. Plain text streams token by token. That's why:

- The launch brief puts its JSON Schema in the system prompt and streams text. The page renders partial JSON as it arrives, then validates the finished object with the same zod schema.
- Auto-triage uses `outputSchema`, because it shows a result only at the end anyway.

## Project structure

```
foundry/
├── base44/
│   ├── config.jsonc              # Project configuration
│   └── entities/                 # JSONC schemas, owner-only access rules
│       ├── project.jsonc         # Product name, pitch, accent color
│       ├── feature.jsonc         # Roadmap card: status, impact, effort, tags, rationale
│       └── thread.jsonc          # Saved copilot conversation and paused run
├── src/
│   ├── routes/
│   │   ├── __root.jsx            # HTML document and providers
│   │   ├── index.jsx             # Landing page
│   │   ├── studio.jsx            # Signed-in shell with the project rail
│   │   ├── studio.index.jsx      # New project form
│   │   ├── studio.$projectId.jsx # Board, launch brief and copilot
│   │   └── api/
│   │       ├── copilot.js        # Streaming agent route
│   │       └── brief.js          # Streaming launch brief route
│   ├── lib/
│   │   ├── ai.server.js          # gatewayModel(): the TanStack AI adapter
│   │   ├── foundry.js            # Shared schemas, models and constants
│   │   ├── foundry.server.js     # Server tools, auth and project loading
│   │   ├── tool-defs.js          # Client tool definitions
│   │   ├── client-tools.js       # Client tool implementations
│   │   ├── thread-persistence.js # useChat persistence adapter on the Thread entity
│   │   ├── board-store.js        # Board focus and filter state
│   │   └── server-fns.js         # triageBoard server function
│   ├── hooks/                    # Entity queries, realtime and stream metrics
│   └── components/
│       ├── landing/              # Landing page event-stream demo
│       ├── studio/               # Board, copilot, brief, inspector, tool cards
│       └── ui/                   # shadcn/ui kit
├── vite.config.js
└── wrangler.jsonc
```

## Tech stack

- **[Base44](https://base44.com)**: Auth, entities, realtime, file storage, AI gateway and hosting.
- **[TanStack Start](https://tanstack.com/start)**: Full-stack React framework with server routes and server functions, running on Cloudflare Workers.
- **[TanStack AI](https://tanstack.com/ai)**: Chat, tools, approvals and streaming.
- **[TanStack Query](https://tanstack.com/query)**: Data fetching and optimistic updates.
- **[Tailwind CSS](https://tailwindcss.com)** and **[shadcn/ui](https://ui.shadcn.com)**: Styling and components.
- **[Zod](https://zod.dev)**: Schemas for tools, input validation and structured output.

## Available commands

Run these npm commands from the project root.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server. |
| `npm run build` | Build to `dist/client` (assets) and `dist/server` (the Worker). |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

## Troubleshooting

### The copilot replies with 401

The server routes require a signed-in caller. Sign in from the landing page. The browser calls them with `base44.fetchWithAuth`, which sends your token; a plain `fetch` doesn't.

### The board doesn't update live

Board changes arrive over Base44 realtime. If the websocket can't connect, the board still refreshes after each tool result and after triage.

### Build fails

Run `npm run lint` to check for errors. Fix any reported issues and try `npm run build` again.

## See also

- [TanStack AI documentation](https://tanstack.com/ai)
- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/developers/references/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
