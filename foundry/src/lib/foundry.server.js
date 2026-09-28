import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { EFFORTS, MODEL_IDS, STATUS_IDS, featureInput } from "@/lib/foundry";

export { celebrateDef, filterBoardDef, focusFeatureDef } from "@/lib/tool-defs";

// Server-only: the tool implementations and prompts behind /api/copilot,
// /api/brief and the triage server function.

export async function requireCaller(base44) {
  // Only an auth rejection means "not signed in"; outages propagate as themselves.
  return base44.auth.me().catch((error) => {
    if (error?.status === 401 || error?.status === 403) return null;
    throw error;
  });
}

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });

// Read through the caller's own client: entity rules scope Project to its
// creator, so someone else's id simply isn't found.
export async function loadProject(base44, projectId) {
  if (typeof projectId !== "string" || !/^[a-f0-9]{24}$/.test(projectId)) return null;
  const [project] = await base44.entities.Project.filter({ id: projectId }, "-created_date", 1);
  return project ?? null;
}

export const listFeatures = (base44, projectId) =>
  base44.entities.Feature.filter({ project_id: projectId }, "-created_date", 200);

export const pickModel = (value) => (MODEL_IDS.includes(value) ? value : "automatic");

const compact = (f) => ({
  id: f.id,
  title: f.title,
  status: f.status,
  impact: f.impact,
  effort: f.effort,
  tags: f.tags ?? [],
  description: f.description,
});

export function projectContext(project, features) {
  return [
    `Product: ${project.name}`,
    project.pitch ? `Pitch: ${project.pitch}` : null,
    `Board (${features.length} features): ${JSON.stringify(features.map(compact))}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function boardTools(base44, projectId) {
  const inProject = async (id) => {
    const [feature] = await base44.entities.Feature.filter({ id, project_id: projectId }, "-created_date", 1);
    if (!feature) throw new Error(`No feature ${id} on this board`);
    return feature;
  };

  const readBoard = toolDefinition({
    name: "readBoard",
    description: "The current board: every feature with its id, column, impact, effort and tags.",
    inputSchema: z.object({}),
  }).server(async () => (await listFeatures(base44, projectId)).map(compact));

  const addFeatures = toolDefinition({
    name: "addFeatures",
    description: "Add one or more features to the board. Batch related features in one call.",
    inputSchema: z.object({ features: z.array(featureInput).min(1).max(12) }),
  }).server(async ({ features }) => {
    const created = await base44.entities.Feature.bulkCreate(
      features.map((f) => ({ ...f, project_id: projectId })),
    );
    return created.map((f) => ({ id: f.id, title: f.title, status: f.status }));
  });

  const updateFeature = toolDefinition({
    name: "updateFeature",
    description: "Change a feature: move it between columns, re-score it, retitle it or re-tag it.",
    inputSchema: z.object({
      id: z.string(),
      title: z.string().max(80).optional(),
      description: z.string().max(600).optional(),
      status: z.enum(STATUS_IDS).optional(),
      impact: z.number().int().min(1).max(5).optional(),
      effort: z.enum(EFFORTS).optional(),
      tags: z.array(z.string().max(24)).max(4).optional(),
      rationale: z.string().max(300).optional().describe("Why, in one sentence — shown on the card"),
    }),
  }).server(async ({ id, ...patch }) => {
    await inProject(id);
    const updated = await base44.entities.Feature.update(id, patch);
    return compact(updated);
  });

  // Destructive, so the user confirms it in the chat before it runs.
  const deleteFeature = toolDefinition({
    name: "deleteFeature",
    description: "Permanently remove a feature from the board. The user is asked to approve first.",
    inputSchema: z.object({ id: z.string(), reason: z.string().describe("Shown to the user in the approval prompt") }),
    needsApproval: true,
  }).server(async ({ id }) => {
    const feature = await inProject(id);
    await base44.entities.Feature.delete(id);
    return { deleted: feature.title };
  });

  return { readBoard, addFeatures, updateFeature, deleteFeature };
}

export const COPILOT_PROMPT = `You are Foundry, a sharp, opinionated product lead pairing with a founder on their roadmap.
The roadmap is a board with four columns: idea, planned, building, shipped.

How you work:
- Act, don't just advise: when the founder asks for features, add them to the board with addFeatures; when they agree on a change, apply it with updateFeature.
- Score honestly. impact 1-5 is value to the target user; effort is S (days), M (a sprint), L (several sprints).
- After adding or changing a single feature, call focusFeature on it so the founder sees it. After moving a feature to shipped, call celebrate.
- Deleting is permanent: only call deleteFeature when the founder asks for a removal, and give a clear reason.
- If the founder shares an image (a whiteboard, a sketch, a screenshot), read it carefully and turn what you see into concrete features.
- Keep replies short: a sentence or two plus what you changed. Use markdown lists when listing features. Never paste ids at the user.`;
