import { Brain, ChevronRight } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToolCallCard } from "@/components/studio/ToolCallCard";

// Renders one UIMessage part by part. Tool results arrive as their own parts;
// each is shown inside the card of the call it answers.
export function MessageView({ message, streaming, onApproval }) {
  const results = new Map(message.parts.filter((p) => p.type === "tool-result").map((p) => [p.toolCallId, p]));

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        {message.parts.map((part, i) =>
          part.type === "image" ? (
            <img key={i} src={part.source?.value} alt="" className="max-h-40 rounded-xl border border-border/70 object-cover" />
          ) : part.type === "text" ? (
            <p key={i} className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm">
              {part.content}
            </p>
          ) : null,
        )}
      </div>
    );
  }

  const lastText = message.parts.findLastIndex((p) => p.type === "text");
  return (
    <div className="space-y-2.5">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={i} className={`prose-foundry text-sm leading-relaxed ${streaming && i === lastText ? "caret" : ""}`}>
              <ReactMarkdown>{part.content}</ReactMarkdown>
            </div>
          );
        }
        if (part.type === "thinking") return <Thinking key={i} content={part.content} live={streaming} />;
        if (part.type === "tool-call") return <ToolCallCard key={part.id} part={part} result={results.get(part.id)} onApproval={onApproval} />;
        return null;
      })}
    </div>
  );
}

function Thinking({ content, live }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-background/40">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
        <Brain className={`h-3.5 w-3.5 ${live ? "animate-pulse text-orange-300" : ""}`} />
        Reasoning
        <ChevronRight className={`ml-auto h-3.5 w-3.5 transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <p className="whitespace-pre-wrap border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">{content}</p>}
    </div>
  );
}
