import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

// Client tools, shared by both sides: /api/copilot hands these definitions to the
// model, and the page attaches the implementations (src/lib/client-tools.js).
// A definition with no server execute pauses the run; the browser runs the tool
// and the chat continues with its result.

export const focusFeatureDef = toolDefinition({
  name: "focusFeature",
  description: "Scroll the board to a feature and highlight it for the user. Use after creating or discussing a specific feature.",
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ focused: z.boolean() }),
});

export const filterBoardDef = toolDefinition({
  name: "filterBoard",
  description: "Filter the visible board to one tag, or clear the filter with an empty string.",
  inputSchema: z.object({ tag: z.string() }),
  outputSchema: z.object({ visible: z.number() }),
});

export const celebrateDef = toolDefinition({
  name: "celebrate",
  description: "Fire confetti on the user's screen. Only when a feature moves to shipped.",
  inputSchema: z.object({ reason: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
});
