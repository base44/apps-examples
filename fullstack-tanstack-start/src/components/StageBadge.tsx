import type { DealStage } from "../lib/types.js";
import { STAGES } from "../lib/types.js";
import { stageAccent } from "../lib/format.js";

const LABELS = new Map(STAGES.map((s) => [s.id, s.label]));

export function StageBadge({ stage }: { stage: DealStage }) {
  return (
    <span className="badge">
      <span className="dot" style={{ background: stageAccent(stage) }} />
      {LABELS.get(stage) ?? stage}
    </span>
  );
}
