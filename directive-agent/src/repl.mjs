import { createRequire } from "node:module";
import { join } from "node:path";
import readline from "node:readline";
import { format, inspect } from "node:util";

// Unlike vm.Script, a function built in the main context gets native `import()`.
const AsyncFunction = (async () => {}).constructor;
const MAX_OUTPUT_CHARS = 10_000;
const WAIT_MS = Number(process.env.EVAL_WAIT_MS ?? 30_000);

let pendingOutput = "";
let evalCount = 0;
let openQuestions = 0;

/** Wraps an ask function so time spent waiting for the user doesn't count toward a call's wait limit. */
export function trackQuestions(askFn) {
  return async (...args) => {
    openQuestions++;
    try {
      return await askFn(...args);
    } finally {
      openQuestions--;
    }
  };
}

function record(stream, args) {
  const text = `${format(...args)}\n`;
  stream.write(text);
  pendingOutput += text;
}

// Everything the agent's code prints, now or later from a server or timer, reaches
// both the terminal and the model's next tool result.
console.log = console.info = console.debug = (...args) => record(process.stdout, args);
console.warn = console.error = (...args) => record(process.stderr, args);
process.on("uncaughtException", (error) => record(process.stderr, ["[uncaught]", error]));
process.on("unhandledRejection", (error) => record(process.stderr, ["[unhandled rejection]", error]));

const input = readline.createInterface({ input: process.stdin, output: process.stdout });
let inputClosed = false;
let pending;
input.on("close", () => {
  inputClosed = true;
  pending?.resolve(null);
});

/** Prompts the user in the terminal; resolves with their answer, or null once stdin has closed. */
export function ask(question) {
  if (inputClosed) return Promise.resolve(null);
  // A question answered elsewhere leaves readline waiting; reuse it rather than stack a second one.
  if (pending) {
    input.setPrompt(`${question} `);
    input.prompt(true);
    return pending.promise;
  }
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  pending = { promise, resolve };
  input.question(`${question} `, (answer) => {
    pending = undefined;
    resolve(answer);
  });
  return promise;
}

export function closeInput() {
  input.close();
}

globalThis.require = createRequire(join(process.cwd(), "repl.cjs"));
globalThis.ask = trackQuestions(ask);

function truncate(text) {
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  const half = MAX_OUTPUT_CHARS / 2;
  return `${text.slice(0, half)}\n… ${text.length - MAX_OUTPUT_CHARS} chars omitted …\n${text.slice(-half)}`;
}

function describe(value) {
  return typeof value === "string" ? value : inspect(value, { depth: 4 });
}

function describeError(error) {
  // Drop the frames below the agent's own code.
  return String(error?.stack ?? error).split("\n    at evaluate (")[0];
}

/** Runs `code` as the body of an async function in this process and reports its result plus any output since the last call. */
export async function evaluate(code) {
  const name = `js-${++evalCount}`;
  let result;
  try {
    const running = new AsyncFunction(`${code}\n//# sourceURL=${name}.js`)();
    const stillRunning = Symbol("still running");
    let settled;
    do {
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(resolve, WAIT_MS, stillRunning);
      });
      settled = await Promise.race([running, timeout]).finally(() => clearTimeout(timer));
    } while (settled === stillRunning && openQuestions > 0);
    if (settled === stillRunning) {
      running.then(
        (value) => record(process.stdout, [`[${name} finished]`, describe(value)]),
        (error) => record(process.stderr, [`[${name} failed]`, describeError(error)]),
      );
      result = `Still running after ${WAIT_MS / 1000}s. It keeps going in the background; its result will show up in a later output.`;
    } else {
      result = describe(settled);
    }
  } catch (error) {
    result = `Threw ${describeError(error)}`;
  }
  const output = pendingOutput;
  pendingOutput = "";
  return truncate(output ? `${result}\n\n--- output ---\n${output}` : result);
}
