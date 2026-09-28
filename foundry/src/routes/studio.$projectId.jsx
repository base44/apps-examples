import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, KanbanSquare, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { BriefPanel } from "@/components/studio/BriefPanel";
import { Board } from "@/components/studio/Board";
import { Copilot } from "@/components/studio/Copilot";
import { ModelPicker } from "@/components/studio/ModelPicker";
import { TriageButton } from "@/components/studio/TriageButton";
import { Button } from "@/components/ui/button";
import { useDeleteProject, useFeatures, useProjects } from "@/hooks/use-foundry-data";
import { ACCENTS } from "@/lib/foundry";

export const Route = createFileRoute("/studio/$projectId")({
  validateSearch: z.object({ kickoff: z.boolean().optional() }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { kickoff } = Route.useSearch();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const project = projects?.find((p) => p.id === projectId);
  const features = useFeatures(projectId);
  const deleteProject = useDeleteProject();
  const [view, setView] = useState("board");
  const [model, setModel] = useState("automatic");

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!project) {
    return <div className="grid flex-1 place-items-center text-muted-foreground">This project doesn't exist, or isn't yours.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 max-w-md flex-1 items-center gap-3">
          <span className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${ACCENTS[project.accent] ?? ACCENTS.ember}`} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">{project.name}</h1>
            {project.pitch && <p className="truncate text-xs text-muted-foreground">{project.pitch}</p>}
          </div>
        </div>
        <div className="flex rounded-lg border border-border/70 p-0.5" role="tablist">
          {[
            { id: "board", label: "Board", icon: KanbanSquare },
            { id: "brief", label: "Launch brief", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${view === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <ModelPicker value={model} onChange={setModel} />
          <TriageButton projectId={projectId} model={model} disabled={!features.data?.length} />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete project"
            disabled={deleteProject.isPending}
            onClick={async () => {
              if (!window.confirm(`Delete ${project.name}, its board and its conversation?`)) return;
              await deleteProject.mutateAsync(project);
              await navigate({ to: "/studio" });
            }}
          >
            {deleteProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <section className="min-h-0 min-w-0 flex-1 overflow-auto">
          {view === "board" ? (
            <Board projectId={projectId} query={features} />
          ) : (
            <BriefPanel key={projectId} project={project} model={model} featureCount={features.data?.length ?? 0} />
          )}
        </section>
        <Copilot key={projectId} project={project} model={model} kickoff={!!kickoff} />
      </div>
    </div>
  );
}
