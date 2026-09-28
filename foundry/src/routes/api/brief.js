import { createFileRoute } from "@tanstack/react-router";
import { chat, chatParamsFromRequest, toServerSentEventsResponse } from "@tanstack/ai";
import { z } from "zod";
import { gatewayModel } from "@/lib/ai.server";
import { briefSchema } from "@/lib/foundry";
import { listFeatures, loadProject, pickModel, projectContext, requireCaller, unauthorized } from "@/lib/foundry.server";

const angle = z.string().max(300).catch("");

// Streams a launch brief as JSON text the page parses as it arrives.
//
// Why not `outputSchema`: the Base44 gateway buffers `response_format:
// json_schema` completions (it re-serializes the final JSON), so a typed
// structured-output stream arrives in one chunk at the end. Plain text streams
// token by token, so the schema goes in the prompt and the page parses partial
// JSON, then validates the finished object with the same zod schema. The triage
// agent (src/lib/server-fns.js) shows `outputSchema` where buffering is fine.
const briefJsonSchema = JSON.stringify(z.toJSONSchema(briefSchema));

export const Route = createFileRoute("/api/brief")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const base44 = context.getBase44();
        if (!(await requireCaller(base44))) return unauthorized();

        const { forwardedProps } = await chatParamsFromRequest(request);
        const project = await loadProject(base44, forwardedProps.projectId);
        if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
        const features = await listFeatures(base44, project.id);
        const focus = angle.parse(forwardedProps.angle);

        return toServerSentEventsResponse(
          chat({
            adapter: gatewayModel(base44, pickModel(forwardedProps.model)),
            messages: [
              {
                role: "user",
                content: `Write the launch brief for this product. Ground every MVP and "later" item in the features on the board.${focus ? ` Angle: ${focus}` : ""}`,
              },
            ],
            systemPrompts: [
              "You are a seasoned product strategist writing a crisp launch brief. Be specific and concrete; no filler.",
              `Reply with a single JSON object that matches this JSON Schema, and nothing else: no prose, no markdown fences.\n${briefJsonSchema}`,
              projectContext(project, features),
            ],
          }),
        );
      },
    },
  },
});
