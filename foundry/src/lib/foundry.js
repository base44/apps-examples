import { z } from "zod";

// Shared by the server routes (validation, prompts) and the pages (rendering).
// Nothing here may import server-only code: this file ships to the browser.

export const STATUSES = [
  { id: "idea", label: "Ideas", hint: "Raw, unscored" },
  { id: "planned", label: "Planned", hint: "Scoped and scored" },
  { id: "building", label: "Building", hint: "In progress" },
  { id: "shipped", label: "Shipped", hint: "Live for users" },
];
export const STATUS_IDS = STATUSES.map((s) => s.id);
export const EFFORTS = ["S", "M", "L"];

// What the model picker offers. "automatic" lets the gateway pick; the named
// models are the same catalog InvokeLLM uses and cost more credits per call.
export const MODELS = [
  { id: "automatic", label: "Automatic", note: "Gateway picks · cheapest" },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6", note: "Anthropic" },
  { id: "gpt_5_5", label: "GPT-5.5", note: "OpenAI" },
  { id: "gemini_3_1_pro", label: "Gemini 3.1 Pro", note: "Google" },
];
export const MODEL_IDS = MODELS.map((m) => m.id);

export const ACCENTS = {
  ember: "from-orange-500 to-amber-400",
  ocean: "from-sky-500 to-cyan-400",
  moss: "from-emerald-500 to-lime-400",
  violet: "from-violet-500 to-fuchsia-400",
  rose: "from-rose-500 to-pink-400",
};

export const featureInput = z.object({
  title: z.string().min(2).max(80).describe("Short, specific feature name"),
  description: z.string().max(600).describe("What it does and why a user cares, one or two sentences"),
  status: z.enum(STATUS_IDS).default("idea"),
  impact: z.number().int().min(1).max(5).describe("Expected user impact, 1 low to 5 high"),
  effort: z.enum(EFFORTS).describe("S = days, M = a sprint, L = multiple sprints"),
  tags: z.array(z.string().max(24)).max(4).default([]).describe("Lower-case theme tags"),
});

// The launch brief: streamed as structured output and rendered while it fills in.
export const briefSchema = z.object({
  tagline: z.string().describe("A punchy one-line positioning statement"),
  problem: z.string().describe("The pain, in the target user's words"),
  audience: z
    .array(z.object({ persona: z.string(), need: z.string() }))
    .describe("Two or three target personas and what each needs most"),
  mvp: z
    .array(z.object({ feature: z.string(), why: z.string() }))
    .describe("The smallest set of board features that makes a launchable product, in build order"),
  later: z.array(z.string()).describe("Board features to defer past launch"),
  risks: z
    .array(z.object({ risk: z.string(), mitigation: z.string(), severity: z.enum(["low", "medium", "high"]) }))
    .describe("The biggest delivery or market risks"),
  launchChecklist: z.array(z.string()).describe("Concrete launch-week tasks"),
  metric: z.string().describe("The one metric that tells you the launch worked"),
});

export const triageSchema = z.object({
  summary: z.string().describe("Two sentences on the shape of the roadmap after triage"),
  moves: z
    .array(z.object({ title: z.string(), from: z.string(), to: z.string(), reason: z.string() }))
    .describe("Every feature whose column changed, and why"),
});

export const scoreOf = (f) => (f.impact ?? 3) * 10 - { S: 2, M: 6, L: 12 }[f.effort ?? "M"];
