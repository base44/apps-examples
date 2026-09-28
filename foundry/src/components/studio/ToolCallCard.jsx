import { Check, Crosshair, Eye, Filter, Loader2, PartyPopper, PencilLine, PlusSquare, ShieldAlert, Trash2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = {
  readBoard: { icon: Eye, label: "Read the board", side: "server" },
  addFeatures: { icon: PlusSquare, label: "Add features", side: "server" },
  updateFeature: { icon: PencilLine, label: "Update a feature", side: "server" },
  deleteFeature: { icon: Trash2, label: "Delete a feature", side: "server" },
  focusFeature: { icon: Crosshair, label: "Focus on the board", side: "client" },
  filterBoard: { icon: Filter, label: "Filter the board", side: "client" },
  celebrate: { icon: PartyPopper, label: "Celebrate", side: "client" },
};

const parse = (value) => {
  if (value == null || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// One tool call, from streaming arguments to result. Server tools ran as the
// signed-in user; client tools ran in this browser tab.
export function ToolCallCard({ part, result, onApproval }) {
  const meta = TOOLS[part.name] ?? { icon: PencilLine, label: part.name, side: "server" };
  const Icon = meta.icon;
  const input = part.input ?? parse(part.arguments);
  const output = part.output ?? parse(typeof result?.content === "string" ? result.content : null);
  const failed = part.state === "error" || result?.state === "error";
  const awaitingApproval = part.state === "approval-requested" && part.approval;
  const denied = part.approval?.approved === false;
  const done = part.state === "complete" || result?.state === "complete" || part.output !== undefined;
  const working = !done && !failed && !awaitingApproval && !denied;

  return (
    <div
      className={`overflow-hidden rounded-xl border text-sm transition ${awaitingApproval ? "border-amber-500/60 bg-amber-500/5" : "border-border/70 bg-background/40"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon className="h-4 w-4 shrink-0 text-orange-400" />
        <span className="font-medium">{meta.label}</span>
        <span
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${meta.side === "client" ? "bg-sky-500/15 text-sky-300" : "bg-secondary text-muted-foreground"}`}
          title={meta.side === "client" ? "Ran in your browser" : "Ran on the app's server, as you"}
        >
          {meta.side === "client" ? "browser" : "server"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          {working && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {part.state === "input-streaming" ? `${part.arguments?.length ?? 0} chars` : "running"}
            </>
          )}
          {done && !failed && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {failed && <TriangleAlert className="h-3.5 w-3.5 text-destructive" />}
          {denied && <span className="text-destructive">denied</span>}
        </span>
      </div>

      <Summary name={part.name} input={input} output={output} error={result?.error} />

      {awaitingApproval && (
        <div className="flex items-center gap-2 border-t border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" />
          <span className="flex-1 text-xs text-amber-100">Needs your approval before it runs.</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" onClick={() => onApproval({ id: part.approval.id, approved: false })}>
            <X className="h-3.5 w-3.5" /> Deny
          </Button>
          <Button size="sm" className="h-7 gap-1 bg-amber-400 px-2 text-stone-950 hover:bg-amber-300" onClick={() => onApproval({ id: part.approval.id, approved: true })}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
        </div>
      )}
    </div>
  );
}

function Summary({ name, input, output, error }) {
  if (error) return <p className="border-t border-border/60 px-3 py-2 text-xs text-destructive">{error}</p>;
  if (!input || typeof input !== "object") return null;

  let body = null;
  if (name === "addFeatures" && Array.isArray(input.features)) {
    body = (
      <ul className="space-y-1">
        {input.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
            <span className="truncate">{f?.title ?? "…"}</span>
            {f?.status && <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">{f.status}</span>}
          </li>
        ))}
      </ul>
    );
  } else if (name === "updateFeature") {
    const changes = Object.entries(input).filter(([k]) => k !== "id" && k !== "rationale");
    body = (
      <>
        {output?.title && <p className="font-medium text-foreground">{output.title}</p>}
        <p>{changes.map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(", ") : v}`).join(" · ") || "…"}</p>
        {input.rationale && <p className="italic text-orange-200/70">{input.rationale}</p>}
      </>
    );
  } else if (name === "deleteFeature") {
    body = (
      <>
        {output?.deleted && <p className="font-medium text-foreground">Deleted “{output.deleted}”</p>}
        {input.reason && <p>{input.reason}</p>}
      </>
    );
  } else if (name === "readBoard" && Array.isArray(output)) {
    body = <p>{output.length} cards read</p>;
  } else if (name === "filterBoard") {
    body = <p>{input.tag ? `#${input.tag}` : "Cleared the filter"}{output?.visible != null ? ` · ${output.visible} visible` : ""}</p>;
  } else if (name === "celebrate" && input.reason) {
    body = <p>{input.reason}</p>;
  }
  return body ? <div className="space-y-1 border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">{body}</div> : null;
}
