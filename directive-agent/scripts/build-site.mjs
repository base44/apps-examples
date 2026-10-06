import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The page needs the app ID from the uncommitted base44/.app.jsonc. It's inlined
// because the platform serves its own /config.js on the app's domain.
const { id } = JSON.parse(readFileSync("base44/.app.jsonc", "utf-8").replace(/^\s*\/\/.*$/gm, ""));
const html = readFileSync("site/index.html", "utf-8");
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html.replace("__APP_ID__", JSON.stringify(id)));
