import { createClient } from "@base44/sdk";
import { ask, closeInput, evaluate } from "./repl.mjs";

const MODEL = process.env.MODEL ?? "automatic";
const MAX_STEPS = Number(process.env.MAX_STEPS ?? 40);

const dim = (text) => (process.stdout.isTTY ? `\x1b[2m${text}\x1b[0m` : text);

const JS_TOOL = {
  type: "function",
  function: {
    name: "js",
    description:
      "Run JavaScript in the live Node.js process you are running in, as the body of an async function. " +
      "`return` a value to see it. Returns the value plus anything printed since your last call.",
    parameters: {
      type: "object",
      properties: { code: { type: "string", description: "JavaScript to run" } },
      required: ["code"],
    },
  },
};

function systemPrompt(appId) {
  return `You are an autonomous agent living inside a running Node.js ${process.version} process on the user's machine (${process.platform}, cwd ${process.cwd()}). The user gave you a directive; carry it out.

You have one tool, \`js\`, which runs JavaScript in this same process:
- Code is the body of an async function: use \`await\` freely and \`return\` a value to see it.
- Local declarations vanish after each call. Keep anything you need later on \`globalThis\` (e.g. \`globalThis.server = http.createServer(...)\`).
- \`require()\` and \`import()\` work for Node built-ins and installed packages; \`fetch\` is global.
- Servers, timers and child processes you start keep running after the call returns. Their console output reaches you with your next \`js\` result.
- \`console.log\` prints to the user's terminal and comes back to you.
- To ask the user something mid-task: \`return await ask("question")\`. It prompts in the terminal and resolves with their answer.
- \`base44\` is a Base44 SDK client signed in as the user for app ${appId}.

Work in small steps and check your work (for example, fetch the server you started). Ask before anything destructive on the user's machine, such as deleting files or killing processes you didn't start. When you're done, or need a longer answer from the user, reply with text and no tool call; the user can reply or give a new directive.`;
}

function gatewayClient(base44) {
  const { baseURL, token, headers } = base44.aiGateway.connection();
  return async function complete(messages) {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers },
      body: JSON.stringify({ model: MODEL, messages, tools: [JS_TOOL] }),
    });
    if (!response.ok) {
      const hint = response.status === 403 ? " Is the app private? Run `base44 deploy` to apply `visibility` from base44/config.jsonc." : "";
      throw new Error(`AI gateway returned ${response.status}: ${await response.text()}${hint}`);
    }
    return (await response.json()).choices[0].message;
  };
}

async function runToolCall(call) {
  let code;
  try {
    ({ code } = JSON.parse(call.function.arguments));
  } catch {
    return `Error: arguments must be JSON like {"code": "..."}; got ${call.function.arguments}`;
  }
  process.stdout.write(`${dim(`\n▸ js\n${code}`)}\n`);
  const result = await evaluate(code);
  process.stdout.write(`${dim(`◂ ${result.split("\n--- output ---\n")[0]}`)}\n`);
  return result;
}

async function runTurn(complete, messages) {
  for (let step = 0; step < MAX_STEPS; step++) {
    const message = await complete(messages);
    messages.push(message);
    if (message.content) process.stdout.write(`\nagent> ${message.content}\n`);
    if (!message.tool_calls?.length) return;
    for (const call of message.tool_calls) {
      messages.push({ role: "tool", tool_call_id: call.id, content: await runToolCall(call) });
    }
  }
  process.stdout.write(`\n[stopped after ${MAX_STEPS} steps; reply to let it continue]\n`);
}

export async function run({ appId, token, serverUrl, directive }) {
  const base44 = createClient({ appId, token, serverUrl });
  globalThis.base44 = base44;
  const complete = gatewayClient(base44);

  const messages = [{ role: "system", content: systemPrompt(appId) }];
  let next = directive || (await ask("directive>"));
  while (next !== null && next.trim() !== "exit") {
    if (next.trim()) {
      messages.push({ role: "user", content: next });
      try {
        await runTurn(complete, messages);
      } catch (error) {
        process.stderr.write(`\n${error.message}\n`);
      }
    }
    next = await ask("\nyou>");
  }
  closeInput();
  base44.cleanup();
  process.exit(0);
}
