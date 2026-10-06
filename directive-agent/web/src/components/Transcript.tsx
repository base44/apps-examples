import { CodeBlock } from "@/components/ai-elements/code-block";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import type { Part, Turn } from "@/lib/transcript";

function ToolPart({ part }: { part: Extract<Part, { type: "tool" }> }) {
  const state = part.error ? "output-error" : part.output !== undefined ? "output-available" : "input-available";
  return (
    <Tool defaultOpen>
      <ToolHeader type="tool-js" title="js" state={state} />
      <ToolContent>
        <div className="space-y-3 p-4">
          <CodeBlock code={part.code} language="javascript" />
          {(part.output ?? part.error) !== undefined && (
            <CodeBlock
              className={part.error ? "border-destructive/50" : undefined}
              code={part.output ?? part.error ?? ""}
              language="log"
            />
          )}
        </div>
      </ToolContent>
    </Tool>
  );
}

function AssistantPart({ part }: { part: Part }) {
  if (part.type === "reasoning") {
    return (
      <Reasoning defaultOpen={false}>
        <ReasoningTrigger />
        <ReasoningContent>{part.text}</ReasoningContent>
      </Reasoning>
    );
  }
  if (part.type === "text") return <MessageResponse>{part.text}</MessageResponse>;
  return <ToolPart part={part} />;
}

export function Transcript({ turns }: { turns: Turn[] }) {
  return (
    <Conversation className="h-full">
      <ConversationContent className="mx-auto w-full max-w-3xl">
        {turns.length === 0 && (
          <ConversationEmptyState title="No events yet" description="Start the agent with npm start." />
        )}
        {turns.map((turn) =>
          turn.role === "assistant" ? (
            <Message key={turn.id} from="assistant">
              <MessageContent className="w-full">
                {turn.parts.map((part) => (
                  <AssistantPart key={part.id} part={part} />
                ))}
              </MessageContent>
            </Message>
          ) : (
            <Message key={turn.id} from="user">
              <MessageContent className={turn.role === "error" ? "text-destructive" : "font-mono text-xs"}>
                {turn.text}
              </MessageContent>
            </Message>
          ),
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
