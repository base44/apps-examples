import { parsePartialJSON } from "@tanstack/ai";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { Braces, CheckCircle2, FileText, Loader2, Sparkles, Square } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { briefSchema } from "@/lib/foundry";

const SEVERITY = {
  high: "bg-red-500/15 text-red-300",
  medium: "bg-amber-500/15 text-amber-200",
  low: "bg-emerald-500/15 text-emerald-300",
};

// A streamed, typed document: the brief arrives as JSON text, `partial` is
// whatever parses from the text so far, and `final` is the finished object
// validated against briefSchema. See src/routes/api/brief.js for why this
// streams text rather than using `outputSchema`.
export function BriefPanel({ project, model, featureCount }) {
  const [angle, setAngle] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const options = useRef({ model, angle });
  options.current = { model, angle };

  const connection = useMemo(
    () =>
      fetchServerSentEvents("/api/brief", () => ({
        fetchClient: base44.fetchWithAuth,
        body: { projectId: project.id, ...options.current },
      })),
    [project.id],
  );
  const { sendMessage, isLoading, stop, error, messages } = useChat({ connection });

  const raw = messages.findLast((m) => m.role === "assistant")?.parts.find((p) => p.type === "text")?.content ?? "";
  const { partial, final, invalid } = useMemo(() => readBrief(raw, isLoading), [raw, isLoading]);
  const brief = final ?? partial;
  const started = isLoading || raw.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="min-w-[14rem] flex-1 space-y-1.5">
          <label htmlFor="angle" className="text-sm font-medium">
            Angle <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="angle"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            maxLength={300}
            placeholder="e.g. launching to design agencies first"
          />
        </div>
        {isLoading ? (
          <Button variant="secondary" className="gap-2" onClick={stop}>
            <Square className="h-3.5 w-3.5 fill-current" /> Stop
          </Button>
        ) : (
          <Button className="gap-2" disabled={featureCount === 0} onClick={() => void sendMessage("Write the launch brief")}>
            <Sparkles className="h-4 w-4" /> {final ? "Regenerate brief" : "Write launch brief"}
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-label="Show raw JSON" aria-pressed={showRaw} onClick={() => setShowRaw((s) => !s)}>
          <Braces className={`h-4 w-4 ${showRaw ? "text-orange-400" : ""}`} />
        </Button>
      </div>

      {featureCount === 0 && !started && (
        <p className="text-sm text-muted-foreground">Add a few features to the board first: the brief is grounded in them.</p>
      )}
      {invalid && !isLoading && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          The model's JSON didn't match briefSchema ({invalid}). Showing what parsed; regenerate for a clean copy.
        </p>
      )}
      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error.message}</p>}

      {showRaw && started && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-border/70 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-orange-100/80 scrollbar-thin">
          {raw || "…"}
        </pre>
      )}

      {!started && featureCount > 0 && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <FileText className="h-6 w-6 text-orange-400" />
          <p className="mt-2 font-medium">A launch brief, streamed as typed JSON</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Positioning, personas, MVP cut, risks and a launch checklist. Watch it fill in, then it's validated against the zod
            schema.
          </p>
        </div>
      )}

      {started && (
        <article className="space-y-8 rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs">
            {final ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Validated against briefSchema
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-orange-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Streaming partial object…
              </span>
            )}
            <span className="ml-auto font-mono text-muted-foreground">{project.name}</span>
          </div>

          <header className="space-y-3">
            <Field value={brief?.tagline} live={isLoading} className="font-display text-3xl font-semibold leading-tight">
              {(v) => v}
            </Field>
            <Field value={brief?.problem} live={isLoading} className="text-muted-foreground">
              {(v) => v}
            </Field>
          </header>

          <Section title="Who it's for" items={brief?.audience} live={isLoading}>
            {(a) => (
              <div className="rounded-xl border border-border/70 p-3">
                <p className="font-medium">{a?.persona}</p>
                <p className="text-sm text-muted-foreground">{a?.need}</p>
              </div>
            )}
          </Section>

          <Section title="MVP, in build order" items={brief?.mvp} live={isLoading} ordered>
            {(m, i) => (
              <div className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500/15 font-mono text-xs text-orange-200">{i + 1}</span>
                <div>
                  <p className="font-medium">{m?.feature}</p>
                  <p className="text-sm text-muted-foreground">{m?.why}</p>
                </div>
              </div>
            )}
          </Section>

          <Section title="Later" items={brief?.later} live={isLoading} inline>
            {(l) => <span className="rounded-full border border-border/70 px-2.5 py-1 text-sm text-muted-foreground">{l}</span>}
          </Section>

          <Section title="Risks" items={brief?.risks} live={isLoading}>
            {(r) => (
              <div className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-medium">{r?.risk}</p>
                  {r?.severity && <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${SEVERITY[r.severity] ?? ""}`}>{r.severity}</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r?.mitigation}</p>
              </div>
            )}
          </Section>

          <Section title="Launch week" items={brief?.launchChecklist} live={isLoading}>
            {(c) => (
              <label className="flex items-start gap-2.5 text-sm">
                <input type="checkbox" className="mt-0.5 accent-orange-500" /> {c}
              </label>
            )}
          </Section>

          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <p className="text-xs uppercase tracking-widest text-orange-300">North-star metric</p>
            <Field value={brief?.metric} live={isLoading} className="mt-1 font-display text-lg font-semibold">
              {(v) => v}
            </Field>
          </div>
        </article>
      )}
    </div>
  );
}

const stripFences = (text) => text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

function readBrief(raw, streaming) {
  const text = stripFences(raw);
  if (!text.trim()) return { partial: null, final: null, invalid: null };
  const partial = parsePartialJSON(text) ?? null;
  if (streaming) return { partial, final: null, invalid: null };
  try {
    const result = briefSchema.safeParse(JSON.parse(text));
    if (result.success) return { partial, final: result.data, invalid: null };
    return { partial, final: null, invalid: result.error.issues[0]?.path.join(".") || "shape" };
  } catch {
    return { partial, final: null, invalid: "incomplete JSON" };
  }
}

function Field({ value, live, className, children }) {
  if (!value) return live ? <div className={`shimmer h-5 w-3/4 rounded ${className}`} /> : null;
  return <p className={className}>{children(value)}</p>;
}

function Section({ title, items, live, children, inline, ordered }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0 && !live) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</h2>
      {list.length === 0 ? (
        <div className="shimmer h-14 rounded-xl" />
      ) : (
        <Tag className={inline ? "flex flex-wrap gap-2" : "space-y-2"}>
          {list.map((item, i) => (
            <li key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              {children(item, i)}
            </li>
          ))}
        </Tag>
      )}
    </section>
  );
}
