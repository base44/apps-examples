import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { featuresKey } from "@/hooks/use-foundry-data";
import { triageBoard } from "@/lib/server-fns";

// The background agent: one click, no chat. The cards move on the board over
// realtime while it works; the dialog shows its typed summary when it's done.
export function TriageButton({ projectId, model, disabled }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const triage = useMutation({
    mutationFn: () => triageBoard({ data: { projectId, model } }),
    onSuccess: () => {
      setOpen(true);
      void queryClient.invalidateQueries({ queryKey: featuresKey(projectId) });
    },
  });

  return (
    <>
      <Button variant="secondary" className="gap-2" disabled={disabled || triage.isPending} onClick={() => triage.mutate()}>
        {triage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-orange-400" />}
        {triage.isPending ? "Triaging…" : "Auto-triage"}
      </Button>
      {triage.error && <span className="max-w-[12rem] truncate text-xs text-destructive">{triage.error.message}</span>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Triage complete</DialogTitle>
            <DialogDescription>
              A server-function agent ran a bounded tool loop with <code className="font-mono text-xs">stream: false</code> and returned
              this typed summary{triage.data?.ms ? ` in ${(triage.data.ms / 1000).toFixed(1)}s` : ""}.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">{triage.data?.summary}</p>
          <ul className="max-h-72 space-y-2 overflow-y-auto scrollbar-thin">
            {triage.data?.moves?.map((move, i) => (
              <li key={i} className="rounded-lg border border-border/70 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <span className="truncate">{move.title}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                    {move.from === move.to ? (
                      <span className="text-orange-300">re-scored</span>
                    ) : (
                      <>
                        {move.from} <ArrowRight className="h-3 w-3" /> <span className="text-orange-300">{move.to}</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{move.reason}</p>
              </li>
            ))}
            {triage.data?.moves?.length === 0 && <li className="text-sm text-muted-foreground">Nothing needed to move.</li>}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
