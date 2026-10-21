import pluginJs from "@eslint/js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["node_modules", "dist", ".wrangler", ".tanstack", "src/routeTree.gen.ts", "src/components/ui/**"],
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
