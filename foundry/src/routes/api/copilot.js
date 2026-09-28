import { createFileRoute } from "@tanstack/react-router";
import { chat, chatParamsFromRequest, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { gatewayModel } from "@/lib/ai.server";
import {
  COPILOT_PROMPT,
  boardTools,
  celebrateDef,
  filterBoardDef,
  focusFeatureDef,
  listFeatures,
  loadProject,
  pickModel,
  projectContext,
  requireCaller,
  unauthorized,
} from "@/lib/foundry.server";

// The copilot: a streaming agent loop on the Base44 AI gateway. Server tools
// write the board as the signed-in caller; client tools drive the page.
export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const base44 = context.getBase44();
        if (!(await requireCaller(base44))) return unauthorized();

        const { messages, forwardedProps, threadId, runId, parentRunId, resume } = await chatParamsFromRequest(request);
        const project = await loadProject(base44, forwardedProps.projectId);
        if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

        const features = await listFeatures(base44, project.id);
        const { readBoard, addFeatures, updateFeature, deleteFeature } = boardTools(base44, project.id);

        return toServerSentEventsResponse(
          chat({
            adapter: gatewayModel(base44, pickModel(forwardedProps.model)),
            messages,
            // The client's ids, so a paused run (a browser tool, an approval)
            // can bind its interrupt and resume the same run.
            threadId,
            runId,
            parentRunId,
            resume,
            systemPrompts: [COPILOT_PROMPT, projectContext(project, features)],
            tools: [readBoard, addFeatures, updateFeature, deleteFeature, focusFeatureDef, filterBoardDef, celebrateDef],
            agentLoopStrategy: maxIterations(8),
          }),
        );
      },
    },
  },
});
