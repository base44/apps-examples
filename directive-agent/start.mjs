import { spawnSync } from "node:child_process";
import { run } from "./src/agent.mjs";

const MARKER = "__DIRECTIVE_AGENT_CREDENTIALS__";

// `base44 exec` hands its script an app-user token and the app's own URL, which is
// what the AI gateway needs. Grab them once and run the agent in this process, so
// it keeps this terminal's stdin.
const PRINT_CREDENTIALS = `console.log("${MARKER}" + JSON.stringify({
  appId: Deno.env.get("BASE44_APP_ID"),
  token: Deno.env.get("BASE44_ACCESS_TOKEN"),
  serverUrl: Deno.env.get("BASE44_APP_BASE_URL"),
}));`;

function credentialsFromEnv() {
  const { BASE44_APP_ID, BASE44_ACCESS_TOKEN, BASE44_APP_BASE_URL } = process.env;
  if (BASE44_APP_ID && BASE44_ACCESS_TOKEN && BASE44_APP_BASE_URL) {
    return { appId: BASE44_APP_ID, token: BASE44_ACCESS_TOKEN, serverUrl: BASE44_APP_BASE_URL };
  }
}

function credentialsFromCli() {
  const cli = process.env.BASE44_CLI ?? "base44";
  const result = spawnSync(cli, ["exec"], {
    input: PRINT_CREDENTIALS,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "inherit"],
    shell: process.platform === "win32",
  });
  if (result.error) {
    throw new Error(`Could not run \`${cli} exec\`: ${result.error.message}. Install the CLI with \`npm install -g base44\`.`);
  }
  const line = result.stdout.split("\n").find((l) => l.startsWith(MARKER));
  if (result.status !== 0 || !line) {
    throw new Error(`\`${cli} exec\` failed (exit ${result.status}). Run \`base44 login\`, and \`base44 deploy\` from this folder first.`);
  }
  return JSON.parse(line.slice(MARKER.length));
}

try {
  const credentials = credentialsFromEnv() ?? credentialsFromCli();
  await run({ ...credentials, directive: process.argv.slice(2).join(" ").trim() });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
