import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-foundry-data";
import { useAuth } from "@/lib/AuthContext";
import { ACCENTS } from "@/lib/foundry";

// Per-user pages render in the browser only: the server renders anonymously.
export const Route = createFileRoute("/studio")({
  ssr: false,
  head: () => ({ meta: [{ title: "Studio · Foundry" }] }),
  component: StudioLayout,
});

function StudioLayout() {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="grid flex-1 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="grid flex-1 place-items-center px-4">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Sign in to open the studio</h1>
          <p className="text-sm text-muted-foreground">
            Your projects, boards and conversations are private to your account. Every AI call runs on the app's Base44 AI
            credits, so the copilot needs to know who you are.
          </p>
          <Button onClick={navigateToLogin}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <ProjectRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function ProjectRail() {
  const { data: projects, isLoading } = useProjects();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar/60 lg:flex">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Projects</span>
        <Button asChild size="icon" variant="ghost" className="h-7 w-7" aria-label="New project">
          <Link to="/studio">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 my-1.5 h-8" />)}
        {projects?.map((project) => (
          <Link
            key={project.id}
            to="/studio/$projectId"
            params={{ projectId: project.id }}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary !text-foreground" }}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${ACCENTS[project.accent] ?? ACCENTS.ember}`} />
            <span className="truncate">{project.name}</span>
          </Link>
        ))}
        {projects?.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">No projects yet.</p>}
      </nav>
    </aside>
  );
}
