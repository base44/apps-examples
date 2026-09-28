import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bot, Braces, Hand, ImageIcon, Layers, MousePointerClick, Radio, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventStreamDemo } from "@/components/landing/EventStreamDemo";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Foundry · AI product studio on TanStack AI + Base44" }] }),
  component: LandingPage,
});

const CAPABILITIES = [
  {
    icon: Radio,
    title: "Token streaming over SSE",
    body: "The copilot answers as it thinks. `chat()` streams AG-UI events from the gateway through the app's own server route to `useChat`.",
    code: "toServerSentEventsResponse(chat({ adapter, messages, tools }))",
  },
  {
    icon: Layers,
    title: "Server tools, as the caller",
    body: "addFeatures, updateFeature and readBoard write Base44 entities with the signed-in user's client, so entity access rules still apply.",
    code: "toolDefinition({ … }).server(() => base44.entities.Feature.bulkCreate(…))",
  },
  {
    icon: MousePointerClick,
    title: "Client tools that drive the page",
    body: "The model can focus a card, filter the board or fire confetti. The run pauses, the browser runs the tool, and the loop continues.",
    code: "focusFeatureDef.client(({ id }) => boardStore.set({ focusId: id }))",
  },
  {
    icon: Hand,
    title: "Human-in-the-loop approval",
    body: "Deleting a feature is `needsApproval: true`. The run pauses at an approval card and resumes only when you decide, even after a reload: the chat and its paused run are saved to a Base44 entity.",
    code: "interrupt.resolveInterrupt({ approved: true })",
  },
  {
    icon: Braces,
    title: "A typed document, streamed",
    body: "The launch brief is a zod schema. The page renders `parsePartialJSON` of the text as it streams, then validates the finished object with the same schema.",
    code: "briefSchema.safeParse(JSON.parse(text))",
  },
  {
    icon: Workflow,
    title: "A background agent, no chat",
    body: "Triage runs a bounded tool loop in a server function with `stream: false`, then returns an `outputSchema`-typed summary of every card it changed.",
    code: "chat({ tools: [updateFeature], outputSchema, agentLoopStrategy: maxIterations(6) })",
  },
  {
    icon: ImageIcon,
    title: "Multimodal input",
    body: "Drop a whiteboard photo into the chat. It's uploaded to Base44 storage and sent as an image part; the model turns it into cards.",
    code: '{ type: "image", source: { type: "url", value: file_url } }',
  },
  {
    icon: Bot,
    title: "Any model, one gateway",
    body: "Pick Automatic or a named Claude, GPT or Gemini model per request. No API keys: usage is billed to the app's Base44 AI credits.",
    code: 'gatewayModel(base44, "claude_sonnet_4_6")',
  },
];

function LandingPage() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const cta = isAuthenticated ? (
    <Button asChild size="lg" className="gap-2">
      <Link to="/studio">
        Open the studio <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  ) : (
    <Button size="lg" className="gap-2" onClick={navigateToLogin}>
      Sign in to start forging <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pb-24 sm:px-6">
      <section className="grid grid-cols-1 items-center gap-12 pb-16 pt-16 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
        <div className="min-w-0 space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            TanStack AI × Base44 AI gateway
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl xl:text-[3.5rem]">
            Forge a roadmap with an AI product lead that <span className="text-ember">streams, acts and asks</span>.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Foundry is a showcase Base44 app built on TanStack Start. Its agents run in the app's own server with TanStack AI and
            stream from the Base44 AI gateway: no API keys, any model, billed to the app's credits.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {cta}
            <Button asChild size="lg" variant="ghost">
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>
        <EventStreamDemo />
      </section>

      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-3xl font-semibold">Every TanStack AI pattern, in one app</h2>
          <p className="text-muted-foreground">Each card is a real feature of the studio. The code is in this repo.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, body, code }) => (
            <article
              key={title}
              className="group flex min-w-0 flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-5 transition hover:border-orange-500/40 hover:bg-card"
            >
              <Icon className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{renderTicks(body)}</p>
              <code className="mt-auto block overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-orange-200/80" title={code}>
                {code}
              </code>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mt-24 scroll-mt-20 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-3xl font-semibold">How a turn flows</h2>
          <p className="text-muted-foreground">
            The browser never holds a model key and never talks to the gateway. The app's server does, as the app, after
            checking who you are.
          </p>
        </div>
        <FlowDiagram />
      </section>
    </div>
  );
}

function renderTicks(text) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="rounded bg-black/40 px-1 font-mono text-[12px] text-orange-200/90">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

const STEPS = [
  { label: "Browser", title: "useChat", detail: "fetchServerSentEvents('/api/copilot') over base44.fetchWithAuth: the visitor's token rides along." },
  { label: "App server", title: "/api/copilot", detail: "TanStack Start route on Workers: auth.me(), load the project through the caller's client, run chat()." },
  { label: "Gateway", title: "Base44 AI gateway", detail: "OpenAI-compatible, stream: true. Called as the app via gatewayModel(); Base44-State keeps the IP allowlist." },
  { label: "Tools", title: "Entities + realtime", detail: "Server tools write Feature records as the caller; the board hears them over realtime and redraws." },
];

function FlowDiagram() {
  return (
    <ol className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step.title} className="relative rounded-xl border border-border/70 bg-card/60 p-5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-orange-300/80">
            {String(i + 1).padStart(2, "0")} · {step.label}
          </span>
          <p className="mt-2 font-display text-lg font-semibold">{step.title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{step.detail}</p>
          {i < STEPS.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-background text-orange-400 lg:block" />
          )}
        </li>
      ))}
    </ol>
  );
}
