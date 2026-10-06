import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createClient } from "@base44/sdk";
import { generateText, jsonSchema, stepCountIs, ToolChoiceViolationError, tool } from "ai";
import { evaluate } from "./repl.mjs";
import { createRunLog } from "./run-log.mjs";

const SYSTEM = process.env.SYSTEM_PROMPT ?? "you are free";
const MODEL = process.env.MODEL ?? "automatic";
const MAX_STEPS = Number(process.env.MAX_STEPS ?? 200);
const TOOL_CHOICE = process.env.TOOL_CHOICE ?? "required";

const js = tool({
  description: "Evaluate JavaScript in a Node.js REPL.",
  inputSchema: jsonSchema({
    type: "object",
    properties: { code: { type: "string" } },
    required: ["code"],
    additionalProperties: false,
  }),
  strict: true,
  execute: ({ code }) => evaluate(code),
});

function logStep(log, step) {
  for (const part of step.content) {
    if (part.type === "reasoning" && part.text) log.emit("reasoning", part.text);
    else if (part.type === "text" && part.text) log.emit("text", part.text);
    else if (part.type === "tool-call") log.emit("tool-call", part.input?.code ?? JSON.stringify(part.input), part.toolCallId);
    else if (part.type === "tool-result") log.emit("tool-result", part.output, part.toolCallId);
    else if (part.type === "tool-error") log.emit("tool-error", String(part.error), part.toolCallId);
  }
}

export async function run({ appId, token, serverUrl }) {
  const base44 = createClient({ appId, token, serverUrl });
  const { baseURL, token: gatewayToken, headers } = base44.aiGateway.connection();
  const model = createOpenAICompatible({ name: "base44", baseURL, apiKey: gatewayToken, headers })(MODEL);

  const log = createRunLog(base44, { system: SYSTEM, model: MODEL });
  const runId = await log.start();
  process.stderr.write(`Run ${runId}: ${serverUrl}/?run=${runId}\n`);

  // The only user messages are ticks: one to start, and one whenever the model stops.
  const messages = [];
  let steps = 0;
  while (steps < MAX_STEPS) {
    const tick = `tick ${new Date().toISOString()}`;
    messages.push({ role: "user", content: tick });
    log.emit("tick", tick);
    // Kept per step so a call that throws still keeps the steps it finished.
    const generated = [];
    try {
      await generateText({
        model,
        system: SYSTEM,
        messages,
        tools: { js },
        toolChoice: TOOL_CHOICE,
        stopWhen: stepCountIs(MAX_STEPS - steps),
        onStepEnd: (step) => {
          steps++;
          generated.push(...step.response.messages);
          logStep(log, step);
        },
      });
    } catch (error) {
      steps++;
      if (ToolChoiceViolationError.isInstance(error)) {
        // Answering in text despite a required tool call is the model stopping.
        const text = error.content.filter((part) => part.type === "text").map((part) => part.text).join("");
        if (text) log.emit("text", text);
        generated.push({ role: "assistant", content: text });
      } else {
        log.emit("error", error.message);
        process.stderr.write(`${error.message}\n`);
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      }
    }
    messages.push(...generated);
  }
  log.setStatus("done");
  await log.flush();
  process.stderr.write(`Stopped after ${steps} steps.\n`);
  process.exit(0);
}
