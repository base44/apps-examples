import { chat, maxIterations } from "@tanstack/ai";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { gatewayModel } from "@/lib/ai.server";
import { MODEL_IDS, triageSchema } from "@/lib/foundry";
import { boardTools, listFeatures, loadProject, projectContext } from "@/lib/foundry.server";

// A background agent: no chat UI and no stream. It runs a bounded tool loop that
// rewrites the board, then finishes with a typed summary of what it moved.
export const triageBoard = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .inputValidator(z.object({ projectId: z.string(), model: z.enum(MODEL_IDS).default("automatic") }))
  .handler(async ({ data, context }) => {
    const base44 = context.getBase44();
    const project = await loadProject(base44, data.projectId);
    if (!project) throw new Error("Project not found");
    const features = await listFeatures(base44, project.id);
    if (features.length === 0) return { summary: "The board is empty — nothing to triage yet.", moves: [] };

    const { updateFeature } = boardTools(base44, project.id);
    const startedAt = Date.now();
    const result = await chat({
      adapter: gatewayModel(base44, data.model),
      messages: [
        {
          role: "user",
          content:
            "Triage the board. Re-score impact and effort where they look wrong, promote the highest impact-for-effort ideas to planned, " +
            "and leave building/shipped alone unless something is clearly misfiled. Use updateFeature for every change, with a one-sentence rationale.",
        },
      ],
      systemPrompts: ["You are a pragmatic product lead doing a roadmap triage pass.", projectContext(project, features)],
      tools: [updateFeature],
      agentLoopStrategy: maxIterations(6),
      outputSchema: triageSchema,
    });
    return { ...result, ms: Date.now() - startedAt };
  });
