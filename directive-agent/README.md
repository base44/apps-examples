# Directive Agent

A small Node.js program that runs a model in a loop with exactly one tool: `js`, which evaluates JavaScript inside the program's own process. You give it a directive, and it works toward it by writing and running code. It can start web servers, read and write files, call APIs, and ask you questions in the terminal as it goes.

Model calls go through the [Base44 AI gateway](https://docs.base44.com/developers/references/sdk/getting-started/ai-gateway), so they're billed to your app's credits and there's no API key to manage.

## How it works

- `start.mjs` runs `base44 exec` once to get an app-user token and the app's URL, which is what the gateway needs. It then runs the agent in the normal Node process, so the agent shares your terminal's stdin.
- `src/agent.mjs` is the loop. It sends the conversation to the gateway's OpenAI-compatible `/chat/completions` endpoint, runs each `js` tool call, and feeds the result back. When the model replies without a tool call, you're prompted with `you>` to reply or give a new directive.
- `src/repl.mjs` is the tool. Code runs as the body of an async function in the main context, so `await`, `require()`, and `import()` all work, and state the model puts on `globalThis` survives between calls. Anything printed, including later output from servers or timers, goes to your terminal and is returned to the model with its next tool result. `ask("question")` prompts you and resolves with your answer.
- `src/run-log.mjs` writes every step (the directive, the model's thinking, code, results, printed output, questions) to the `AgentRun` and `AgentEvent` entities. The page in `site/` is hosted on the app's domain and shows runs as they happen. You can answer the agent's questions from the page, so it also works without a terminal.

> **Warning:** The model runs arbitrary code on your machine with your permissions. The system prompt tells it to ask before doing anything destructive, but nothing enforces that. Run it somewhere you're comfortable with that.

## Get started

You need Node.js v20.19.0 or higher, [Deno](https://deno.com/) (used by `base44 exec`), and the [Base44 CLI](https://docs.base44.com/developers/references/cli/get-started/overview).

1. Install dependencies and log in:

   ```bash
   npm install
   npm install -g base44
   base44 login
   ```

2. Create the app from this folder and deploy it. Deploying creates the entities, publishes the viewer page, and applies `"visibility": "private"` from `base44/config.jsonc`. New apps block direct gateway calls from app-user tokens unless the app requires login, so the agent gets a 403 while the app is public.

   ```bash
   base44 link --create
   base44 deploy --build
   ```

3. Give it a directive:

   ```bash
   npm start -- "Start a web server on port 3000 that shows a live clock, then ask me what color it should be"
   ```

   The agent prints a link to its run. Open the app URL from `base44 deploy` to watch any run live and reply to it.

   Run `npm start` with no argument to type the directive at a prompt. Type `exit` or press Ctrl+D to quit. Quitting also stops any servers the agent started.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `MODEL` | `automatic` | Gateway model. Models other than `automatic` can cost more credits. |
| `MAX_STEPS` | `40` | Model calls allowed per turn before the agent stops and waits for you. Each step is a metered model call. |
| `EVAL_WAIT_MS` | `30000` | How long a `js` call is awaited before the agent is told it's still running in the background. |
| `BASE44_APP_ID`, `BASE44_ACCESS_TOKEN`, `BASE44_APP_BASE_URL` | | Set all three to skip `base44 exec` and use these credentials directly. |
| `BASE44_CLI` | `base44` | Command used to run the Base44 CLI. |
