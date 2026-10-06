import { readFileSync, writeFileSync } from "node:fs";

// The page needs the app ID, which lives in the uncommitted base44/.app.jsonc.
const { id } = JSON.parse(readFileSync("base44/.app.jsonc", "utf-8").replace(/^\s*\/\/.*$/gm, ""));
writeFileSync("site/config.js", `export const APP_ID = ${JSON.stringify(id)};\n`);
