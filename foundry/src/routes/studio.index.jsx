import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-foundry-data";
import { ACCENTS } from "@/lib/foundry";

export const Route = createFileRoute("/studio/")({
  component: NewProjectPage,
});

const STARTERS = [
  {
    name: "Tandem",
    pitch: "A habit tracker for remote teams: shared streaks, async check-ins, and nudges that feel like a teammate, not a nag.",
    accent: "ember",
  },
  {
    name: "Pantry Pilot",
    pitch: "Snap your fridge, get a week of dinners that use what you have, with a grocery list for the gaps.",
    accent: "moss",
  },
  {
    name: "Quiet Hours",
    pitch: "A focus app for developers that batches Slack, email and GitHub notifications into three calm digests a day.",
    accent: "violet",
  },
];

function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [accent, setAccent] = useState("ember");

  async function create(data) {
    const project = await createProject.mutateAsync(data);
    await navigate({ to: "/studio/$projectId", params: { projectId: project.id }, search: { kickoff: true } });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Start a project</h1>
        <p className="text-muted-foreground">
          Describe the product. The copilot drafts a first roadmap straight onto the board, streaming as it goes.
        </p>
      </div>

      <form
        className="mt-8 space-y-4 rounded-2xl border border-border/70 bg-card/60 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void create({ name: name.trim(), pitch: pitch.trim(), accent });
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Product name
          </label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tandem" maxLength={60} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pitch" className="text-sm font-medium">
            Pitch
          </label>
          <Textarea
            id="pitch"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="What is it, who is it for, and why now?"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent colour">
            {Object.entries(ACCENTS).map(([id, gradient]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={accent === id}
                aria-label={id}
                onClick={() => setAccent(id)}
                className={`h-6 w-6 rounded-full bg-gradient-to-br ${gradient} ring-offset-2 ring-offset-card transition ${accent === id ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100"}`}
              />
            ))}
          </div>
          <Button type="submit" disabled={createProject.isPending || !name.trim()} className="gap-2">
            {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Create and draft roadmap
          </Button>
        </div>
        {createProject.error && <p className="text-sm text-destructive">{createProject.error.message}</p>}
      </form>

      <div className="mt-10 space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Or start from an idea</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {STARTERS.map((starter) => (
            <button
              key={starter.name}
              type="button"
              disabled={createProject.isPending}
              onClick={() => void create(starter)}
              className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-card/40 p-4 text-left transition hover:border-orange-500/40 hover:bg-card disabled:opacity-50"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${ACCENTS[starter.accent]}`} />
                {starter.name}
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </span>
              <span className="text-sm text-muted-foreground">{starter.pitch}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
