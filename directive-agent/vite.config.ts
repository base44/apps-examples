import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The viewer needs the app ID from the uncommitted base44/.app.jsonc.
const { id: appId } = JSON.parse(readFileSync("base44/.app.jsonc", "utf-8").replace(/^\s*\/\/.*$/gm, ""));

export default defineConfig({
  root: "web",
  plugins: [react(), tailwindcss()],
  define: { __APP_ID__: JSON.stringify(appId) },
  resolve: { alias: { "@": fileURLToPath(new URL("./web/src", import.meta.url)) } },
  build: { outDir: "../dist", emptyOutDir: true },
});
