import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateFeature } from "@/hooks/use-foundry-data";
import { boardStore, useBoardState } from "@/lib/board-store";
import { STATUSES, scoreOf } from "@/lib/foundry";

export function Board({ projectId, query }) {
  const { data: features = [], isLoading } = query;
  const { focusId, tag } = useBoardState();
  const updateFeature = useUpdateFeature(projectId);
  const [dragOver, setDragOver] = useState(null);

  const tags = useMemo(() => [...new Set(features.flatMap((f) => f.tags ?? []))].sort(), [features]);
  const visible = useMemo(() => (tag ? features.filter((f) => f.tags?.includes(tag)) : features), [features, tag]);

  // The filterBoard client tool reports how many cards it left visible.
  useEffect(() => boardStore.set({ visibleCount: visible.length }), [visible.length]);

  const columns = STATUSES.map((status) => ({
    ...status,
    items: visible.filter((f) => (f.status ?? "idea") === status.id).sort((a, b) => scoreOf(b) - scoreOf(a)),
  }));

  return (
    <div className="flex h-full min-h-[28rem] flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {features.length} feature{features.length === 1 ? "" : "s"}
        </span>
        {tags.length > 0 && <span className="h-4 w-px bg-border" />}
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => boardStore.set({ tag: tag === t ? "" : t })}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${tag === t ? "border-orange-500/60 bg-orange-500/15 text-orange-200" : "border-border/70 text-muted-foreground hover:text-foreground"}`}
          >
            #{t}
          </button>
        ))}
        {tag && (
          <button onClick={() => boardStore.set({ tag: "" })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> clear
          </button>
        )}
      </div>

      {!isLoading && features.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-border/70">
          <div className="max-w-xs space-y-2 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-orange-400" />
            <p className="font-medium">The board is empty</p>
            <p className="text-sm text-muted-foreground">Ask the copilot for a first roadmap, or drop a whiteboard photo into the chat.</p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 auto-cols-[minmax(12.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {columns.map((column) => (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(column.id);
              }}
              onDragLeave={() => setDragOver((c) => (c === column.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/feature-id");
                const feature = features.find((f) => f.id === id);
                if (feature && feature.status !== column.id) updateFeature.mutate({ id, status: column.id });
              }}
              className={`flex min-h-0 flex-col rounded-2xl border bg-card/40 transition ${dragOver === column.id ? "border-orange-500/50 bg-orange-500/5" : "border-border/60"}`}
            >
              <div className="flex items-baseline justify-between px-3.5 pb-2 pt-3">
                <span className="text-sm font-semibold">{column.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{column.items.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-2.5 pb-3 scrollbar-thin">
                {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                {column.items.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} focused={focusId === feature.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature, focused }) {
  return (
    <article
      data-feature-id={feature.id}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/feature-id", feature.id)}
      className={`group cursor-grab space-y-2 rounded-xl border bg-card p-3 shadow-sm transition animate-in fade-in zoom-in-95 duration-300 active:cursor-grabbing ${focused ? "glow-ring border-transparent" : "border-border/70 hover:border-border"}`}
    >
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-sm font-medium leading-snug">{feature.title}</h3>
        <span
          className="rounded-md border border-border/70 px-1.5 font-mono text-[10px] text-muted-foreground"
          title="Effort: S = days, M = a sprint, L = several sprints"
        >
          {feature.effort ?? "M"}
        </span>
      </div>
      {feature.description && <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <ImpactMeter value={feature.impact ?? 3} />
        <div className="flex flex-wrap gap-1">
          {(feature.tags ?? []).slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </div>
      {feature.rationale && (
        <p className="border-t border-border/60 pt-2 text-[11px] italic leading-relaxed text-orange-200/70">{feature.rationale}</p>
      )}
    </article>
  );
}

function ImpactMeter({ value }) {
  return (
    <span className="flex shrink-0 gap-0.5" title={`Impact ${value}/5`} aria-label={`Impact ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-3 rounded-full ${i <= value ? "bg-gradient-to-r from-orange-500 to-amber-300" : "bg-secondary"}`} />
      ))}
    </span>
  );
}
