# Directive Agent

An experiment: a model in a loop with exactly one tool, a JavaScript REPL running inside the loop's own Node.js process, and nothing else. The system prompt is `you are free`. The only user messages are `tick <timestamp>`: one to start, and another whenever the model stops. Every step is recorded, and a web page shows the transcript live.

Model calls go through the [Base44 AI gateway](https://docs.base44.com/developers/references/sdk/getting-started/ai-gateway), so they're billed to your app's credits and there's no API key to manage.

## How it works

- `start.mjs` runs `base44 exec` once to get an app-user token and the app's URL, which is what the gateway needs, then starts the loop in this process.
- `src/agent.mjs` is the loop, built on the AI SDK's `generateText` with the gateway as an OpenAI-compatible provider. Tool calls are required, and the one tool's schema is strict. A reply without a tool call counts as the model stopping, and gets the next tick.
- `src/repl.mjs` is the tool. It drives Node's own REPL evaluator on the global context, so it behaves like typing into `node`: the last expression's value comes back, top-level `await` works, and declarations persist. Anything printed, including later output from servers or timers, comes back with the next result. The process's stdin is left alone.
- `src/run-log.mjs` writes each step (ticks, reasoning, text, tool calls and results) to the `AgentRun` and `AgentEvent` entities.
- `web/` is the transcript viewer, built with [AI Elements](https://ai-sdk.dev/elements) and hosted on the app's domain. It's read-only.

> **Warning:** The model runs whatever code it writes, with your permissions, on your machine. Nothing restricts it. Run it somewhere you're comfortable with that, and set `AGENT_CWD` to an empty folder.

## Get started

You need Node.js v20.19.0 or higher, [Deno](https://deno.com/) (used by `base44 exec`), and the [Base44 CLI](https://docs.base44.com/developers/references/cli/get-started/overview).

1. Install dependencies and log in:

   ```bash
   npm ci
   npm install -g base44
   base44 login
   ```

2. Create the app from this folder and deploy it. Deploying creates the entities, builds and publishes the viewer, and applies `"visibility": "private"` from `base44/config.jsonc`. New apps block direct gateway calls from app-user tokens unless the app requires login, so the loop gets a 403 while the app is public.

   ```bash
   base44 link --create
   base44 deploy --build
   ```

3. Start it, and open the app URL from `base44 deploy` to watch:

   ```bash
   AGENT_CWD=/tmp/free npm start
   ```

   It stops after `MAX_STEPS` model calls. Stopping also ends any servers or processes it started.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `SYSTEM_PROMPT` | `you are free` | The whole system prompt. |
| `MAX_STEPS` | `200` | Total model calls before the loop stops. Each one is metered. |
| `MODEL` | `automatic` | Gateway model. Models other than `automatic` can cost more credits. The gateway rejects required tool calls on some models. |
| `TOOL_CHOICE` | `required` | Set to `auto` to let the model answer without calling the tool. |
| `EVAL_WAIT_MS` | `30000` | How long a tool call is awaited before it returns `(still running …)`. The code keeps running. |
| `AGENT_CWD` | | Folder the loop runs in. |
| `BASE44_APP_ID`, `BASE44_ACCESS_TOKEN`, `BASE44_APP_BASE_URL` | | Set all three to skip `base44 exec` and use these credentials directly. |
| `BASE44_CLI` | `base44` | Command used to run the Base44 CLI. |

Run `npm run dev` to work on the viewer locally.
