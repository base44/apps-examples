import repl from "node:repl";
import { PassThrough } from "node:stream";
import { format, inspect } from "node:util";

const MAX_OUTPUT_CHARS = 10_000;
const WAIT_MS = Number(process.env.EVAL_WAIT_MS ?? 30_000);

let pendingOutput = "";

function record(stream, args) {
  const text = `${format(...args)}\n`;
  stream.write(text);
  pendingOutput += text;
}

// Everything the evaluated code prints, now or later from a server or timer, reaches
// both the terminal and the next tool result.
console.log = console.info = console.debug = (...args) => record(process.stdout, args);
console.warn = console.error = (...args) => record(process.stderr, args);
process.on("uncaughtException", (error) => record(process.stderr, ["Uncaught", error]));
process.on("unhandledRejection", (error) => record(process.stderr, ["Unhandled rejection", error]));

// Node's own REPL evaluator, on the global context: the last expression's value, top-level
// await, and declarations that persist between calls. Its streams go nowhere; stdin stays free.
const server = repl.start({ input: new PassThrough(), output: new PassThrough(), prompt: "", useGlobal: true, terminal: false });
let settle;
// The REPL reports thrown errors to its domain rather than the eval callback.
server._domain.removeAllListeners("error");
server._domain.on("error", (error) => (settle ? settle(error) : record(process.stderr, ["Uncaught", error])));

function truncate(text) {
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  const half = MAX_OUTPUT_CHARS / 2;
  return `${text.slice(0, half)}\n… ${text.length - MAX_OUTPUT_CHARS} chars omitted …\n${text.slice(-half)}`;
}

function run(code) {
  return new Promise((resolve) => {
    settle = (error, value) => {
      settle = undefined;
      if (!error) return resolve(inspect(value, { depth: 4 }));
      const cause = error.err ?? error; // a Recoverable wraps an incomplete-input SyntaxError
      // Like the real REPL, hide the frames of the evaluator itself.
      const lines = String(cause?.stack ?? cause).split("\n");
      const end = lines.findIndex((line) => line.includes(import.meta.url));
      resolve(`Uncaught ${lines.slice(0, end === -1 ? undefined : end).filter((l) => !l.includes("node:")).join("\n")}`);
    };
    server.eval(code, server.context, "js", settle);
  });
}

/** Evaluates `code` like input typed into a Node REPL running in this process. */
export async function evaluate(code) {
  let timer;
  const result = await Promise.race([
    run(code),
    new Promise((resolve) => {
      timer = setTimeout(resolve, WAIT_MS, `(still running after ${WAIT_MS / 1000}s)`);
    }),
  ]).finally(() => clearTimeout(timer));
  const output = pendingOutput;
  pendingOutput = "";
  return truncate(output + result);
}
