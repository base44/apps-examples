import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Activity, ArrowUp, ImagePlus, Loader2, MessagesSquare, RotateCcw, Square, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageView } from "@/components/studio/MessageView";
import { StreamInspector } from "@/components/studio/StreamInspector";
import { Button } from "@/components/ui/button";
import { featuresKey } from "@/hooks/use-foundry-data";
import { useStreamStats } from "@/hooks/use-stream-stats";
import { clientTools } from "@/lib/client-tools";
import { threadPersistence } from "@/lib/thread-persistence";

const SUGGESTIONS = [
  "Draft a first roadmap: 8 features across all four columns",
  "What's the one feature that makes this launchable? Plan it.",
  "Split the biggest L-effort feature into smaller ones",
  "Show me only the onboarding work",
];

const KICKOFF =
  "Draft a first roadmap for this product: about 8 features spread across idea, planned and building, scored honestly. Then focus the most important one.";

export function Copilot({ project, model, kickoff }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const stats = useStreamStats();
  const [tab, setTab] = useState("chat");
  const [draft, setDraft] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(null);
  const scroller = useRef(null);
  const fileInput = useRef(null);
  const modelRef = useRef(model);
  modelRef.current = model;

  // Stable across renders: changing the connection or persistence recreates the
  // ChatClient. The options function runs per request, so the model picker and
  // the timing wrapper take effect without a remount.
  const persistence = useMemo(() => threadPersistence(project.id, { onLoad: setLoadedCount }), [project.id]);
  const connection = useMemo(
    () =>
      fetchServerSentEvents("/api/copilot", () => ({
        fetchClient: stats.wrapFetch(base44.fetchWithAuth),
        body: { projectId: project.id, model: modelRef.current },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.id],
  );

  const chatState = useChat({
    connection,
    tools: clientTools,
    persistence,
    threadId: `foundry-${project.id}`,
    onChunk: (chunk) => {
      stats.onChunk(chunk);
      // Realtime already carries tool writes to the board; this refetch covers a
      // socket that never connected (strict proxies, some corporate networks).
      if (chunk.type === "TOOL_CALL_RESULT") void queryClient.invalidateQueries({ queryKey: featuresKey(project.id) });
    },
  });

  const { messages, sendMessage, isLoading, status, stop, error, clear, addToolApprovalResponse, interrupts } = chatState;

  // A needsApproval tool pauses the run as an interrupt. Resolving that
  // interrupt resumes the run on the server, which then executes (or skips) it.
  const respondToApproval = ({ id, approved }) => {
    const interrupt = interrupts.find((i) => i.id === id);
    if (interrupt) interrupt.resolveInterrupt({ approved });
    else void addToolApprovalResponse({ id, approved });
  };

  // Arriving from "Create" with ?kickoff: draft the first roadmap once the
  // stored thread has loaded and turned out to be empty.
  const kicked = useRef(false);
  useEffect(() => {
    if (!kickoff || kicked.current || loadedCount === null) return;
    kicked.current = true;
    void navigate({ to: ".", search: {}, replace: true });
    if (loadedCount === 0) void sendMessage(KICKOFF);
  }, [kickoff, loadedCount, navigate, sendMessage]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function attach(files) {
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        [...files].slice(0, 3).map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, name: file.name };
        }),
      );
      setImages((prev) => [...prev, ...uploaded].slice(0, 3));
    } finally {
      setUploading(false);
    }
  }

  function send(text = draft) {
    const content = text.trim();
    if ((!content && images.length === 0) || isLoading) return;
    if (images.length) {
      void sendMessage({
        content: [
          { type: "text", content: content || "Turn what you see in this image into features on the board." },
          ...images.map((img) => ({ type: "image", source: { type: "url", value: img.url } })),
        ],
      });
    } else {
      void sendMessage(content);
    }
    setDraft("");
    setImages([]);
  }

  return (
    <aside className="flex h-[70vh] w-full shrink-0 flex-col border-t border-border/60 bg-card/30 xl:h-auto xl:w-[27rem] xl:border-l xl:border-t-0">
      <div className="flex items-center gap-1 border-b border-border/60 px-3 py-2">
        {[
          { id: "chat", label: "Copilot", icon: MessagesSquare },
          { id: "stream", label: "Stream", icon: Activity, badge: stats.totals.runs || null },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition ${tab === id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" /> {label}
            {badge ? <span className="rounded bg-orange-500/20 px-1 font-mono text-[10px] text-orange-200">{badge}</span> : null}
          </button>
        ))}
        <StatusPill status={status} />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          aria-label="Clear conversation"
          disabled={isLoading || messages.length === 0}
          onClick={() => {
            clear();
            stats.reset();
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {tab === "stream" ? (
        <StreamInspector runs={stats.runs} totals={stats.totals} />
      ) : (
        <>
          <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto px-4 py-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="space-y-4 pt-6">
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold">What are we building?</p>
                  <p className="text-sm text-muted-foreground">
                    I can add, re-score and move cards, point at them on the board, and write your launch brief. Drop in a
                    whiteboard photo and I'll turn it into features.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-border/70 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-orange-500/40 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, i) => (
              <MessageView
                key={message.id}
                message={message}
                streaming={isLoading && i === messages.length - 1 && message.role === "assistant"}
                onApproval={respondToApproval}
              />
            ))}
            {status === "submitted" && messages.at(-1)?.role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting to the gateway…
              </div>
            )}
            {error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error.message}</p>
            )}
          </div>

          <form
            className="border-t border-border/60 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {images.length > 0 && (
              <div className="mb-2 flex gap-2">
                {images.map((img) => (
                  <div key={img.url} className="relative">
                    <img src={img.url} alt={img.name} className="h-14 w-14 rounded-lg border border-border/70 object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove ${img.name}`}
                      onClick={() => setImages((prev) => prev.filter((p) => p.url !== img.url))}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-background text-muted-foreground shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-border/70 bg-background/60 p-2 focus-within:border-orange-500/50">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files?.length) void attach(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                aria-label="Attach an image"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              </Button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask the copilot…"
                className="max-h-40 min-h-[2rem] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              {isLoading ? (
                <Button type="button" size="icon" variant="secondary" className="h-8 w-8 shrink-0" aria-label="Stop" onClick={stop}>
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0" aria-label="Send" disabled={!draft.trim() && images.length === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </aside>
  );
}

function StatusPill({ status }) {
  const tone = {
    ready: "bg-emerald-400",
    submitted: "bg-amber-400 animate-pulse",
    streaming: "bg-orange-400 animate-pulse",
    error: "bg-red-500",
  }[status];
  return (
    <span className="ml-auto flex items-center gap-1.5 px-2 font-mono text-[11px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${tone ?? "bg-stone-500"}`} />
      {status}
    </span>
  );
}
