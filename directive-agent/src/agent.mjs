import { createClient } from "@base44/sdk";
import { ask, closeInput, evaluate, trackQuestions } from "./repl.mjs";
import { createRunLog } from "./run-log.mjs";

const MODEL = process.env.MODEL ?? "automatic";
const MAX_STEPS = Number(process.env.MAX_STEPS ?? 40);
const OUTPUT_SEPARATOR = "\n\n--- output ---\n";

const dim = (text) => (process.stdout.isTTY ? `\x1b[2m${text}\x1b[0m` : text);

const JS_TOOL = {
  type: "function",
  function: {
    name: "js",
    description:
      "Run JavaScript in the live Node.js process you are running in, as the body of an async function. " +
      "`return` a value to see it. Returns the value plus anything printed since your last call.",
    strict: true,
    parameters: {
      type: "object",
      properties: { code: { type: "string", description: "JavaScript to run" } },
      required: ["code"],
      additionalProperties: false,
    },
  },
};
const TOOL_ONLY_NUDGE = "Respond only with a `js` tool call. Use say() to talk to the user and done() when finished.";

function systemPrompt(appId) {
  return `You are an autonomous agent living inside a running Node.js ${process.version} process on a machine (${process.platform}, cwd ${process.cwd()}). You were given a directive; carry it out.

You have one tool, \`js\`, which runs JavaScript in this same process:
- Code is the body of an async function: use \`await\` freely and \`return\` a value to see it.
- Local declarations vanish after each call. Keep anything you need later on \`globalThis\` (e.g. \`globalThis.server = http.createServer(...)\`).
- \`require()\` and \`import()\` work for Node built-ins and installed packages; \`fetch\` is global.
- Servers, timers and child processes you start keep running after the call returns. Their console output reaches you with your next \`js\` result.
- \`base44\` is a Base44 SDK client signed in as the user for app ${appId}.

Every response you give must be a single \`js\` call; plain-text replies are not shown to anyone. Everything you communicate goes through code:
- \`say("text")\` posts a message to the user. Use it to explain what you're doing and why, and to show results.
- \`return await ask("question")\` asks the user something and resolves with their answer.
- \`done("summary")\` ends your turn when the directive is complete. The user can then give you a new one.

The user watches a live feed of your code and output. Work in small steps and check your work (for example, fetch the server you started). Ask before anything destructive, such as deleting files you didn't create or killing processes you didn't start.`;
}

function gatewayClient(base44) {
  const { baseURL, token, headers } = base44.aiGateway.connection();
  return async function complete(messages) {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers },
      body: JSON.stringify({ model: MODEL, messages, tools: [JS_TOOL], tool_choice: "required" }),
    });
    if (!response.ok) {
      const hint = response.status === 403 ? " Is the app private? Run `base44 deploy` to apply `visibility` from base44/config.jsonc." : "";
      throw new Error(`AI gateway returned ${response.status}: ${await response.text()}${hint}`);
    }
    return (await response.json()).choices[0].message;
  };
}

/** Takes an answer from the terminal (when there is one) or the viewer page, whichever comes first. */
function askAnywhere(log) {
  return async (question) => {
    log.emit("question", question);
    log.setStatus("waiting");
    const controller = new AbortController();
    const answers = [log.waitForReply(controller.signal)];
    if (process.stdin.isTTY) {
      answers.push(ask(question).then((a) => (a === null ? new Promise(() => {}) : (log.emit("user", a), a))));
    }
    const answer = await Promise.race(answers);
    controller.abort();
    log.setStatus("running");
    return answer;
  };
}

async function runToolCall(call, log) {
  let code;
  try {
    ({ code } = JSON.parse(call.function.arguments));
  } catch {
    return `Error: arguments must be JSON like {"code": "..."}; got ${call.function.arguments}`;
  }
  process.stdout.write(`${dim(`\n▸ js\n${code}`)}\n`);
  log.emit("code", code);
  const content = await evaluate(code);
  const [result, output] = content.split(OUTPUT_SEPARATOR);
  process.stdout.write(`${dim(`◂ ${result}`)}\n`);
  if (output) log.emit("output", output);
  log.emit("result", result);
  return content;
}

async function runTurn(complete, messages, log, turn) {
  for (let step = 0; step < MAX_STEPS; step++) {
    const message = await complete(messages);
    messages.push(message);
    const thinking = [message.reasoning_content ?? message.reasoning, message.content].filter(Boolean).join("\n\n");
    if (thinking) log.emit("thinking", thinking);
    if (!message.tool_calls?.length) {
      // A model that ignores tool_choice gets told again rather than ending the turn.
      messages.push({ role: "user", content: TOOL_ONLY_NUDGE });
      continue;
    }
    for (const call of message.tool_calls) {
      messages.push({ role: "tool", tool_call_id: call.id, content: await runToolCall(call, log) });
    }
    if (turn.done) return;
  }
  const note = `Stopped after ${MAX_STEPS} steps; reply to let it continue.`;
  process.stdout.write(`\n[${note}]\n`);
  log.emit("message", note);
}

export async function run({ appId, token, serverUrl, directive }) {
  const base44 = createClient({ appId, token, serverUrl });
  globalThis.base44 = base44;
  const complete = gatewayClient(base44);

  const first = directive || (await ask("directive>"));
  if (!first?.trim()) process.exit(0);

  const log = createRunLog(base44, MODEL);
  const runId = await log.start(first);
  process.stdout.write(dim(`Run ${runId} — watch it at ${serverUrl}/?run=${runId}\n`));
  const askUser = askAnywhere(log);
  globalThis.ask = trackQuestions(askUser);
  globalThis.say = (text) => {
    process.stdout.write(`\nagent> ${text}\n`);
    log.emit("message", text);
  };
  let turn;
  globalThis.done = (summary) => {
    turn.done = true;
    if (summary) globalThis.say(summary);
    return "Turn ended. The user will be asked what to do next.";
  };

  const messages = [{ role: "system", content: systemPrompt(appId) }];
  let next = first;
  log.emit("directive", first);
  while (next !== null && next.trim() !== "exit") {
    if (next.trim()) {
      messages.push({ role: "user", content: next });
      turn = { done: false };
      try {
        await runTurn(complete, messages, log, turn);
      } catch (error) {
        process.stderr.write(`\n${error.message}\n`);
        log.emit("error", error.message);
      }
    }
    next = await askUser("What next? (reply exit to stop)");
  }
  log.setStatus("done");
  await log.flush();
  closeInput();
  base44.cleanup();
  process.exit(0);
}
