// Sales Copilot chat state. Talks to the `sales_copilot` Base44 agent through
// the SDK agents module: creates a conversation, streams updates over the
// realtime subscription, and sends user turns with addMessage. The agent runs
// as the logged-in rep, so its entity tools stay inside that rep's RLS scope.

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "../../lib/browser-client.js";
import type { Base44Config } from "../../lib/types.js";
import type { AgentConversation, AgentMessage } from "@base44/sdk";

const AGENT_NAME = "sales_copilot";

export interface ChatItem {
  key: string;
  role: "user" | "assistant" | "tool";
  text: string;
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string" ? part : typeof part?.text === "string" ? part.text : "",
      )
      .join("")
      .trim();
  }
  return "";
}

function toChatItems(messages: AgentMessage[]): ChatItem[] {
  const items: ChatItem[] = [];
  messages.forEach((m, i) => {
    for (const call of m.tool_calls ?? []) {
      items.push({ key: `${i}-tool-${call.name}`, role: "tool", text: `Used ${call.name}` });
    }
    const text = contentToText(m.content);
    if (text && (m.role === "user" || m.role === "assistant")) {
      items.push({ key: `${i}-${m.role}`, role: m.role, text });
    }
  });
  return items;
}

export function useCopilot(base44: Base44Config) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<AgentConversation | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const ensureConversation = useCallback(async () => {
    if (conversationRef.current) return conversationRef.current;
    const client = getBrowserClient(base44);
    const conversation = await client.agents.createConversation({ agent_name: AGENT_NAME });
    conversationRef.current = conversation;
    unsubscribeRef.current = client.agents.subscribeToConversation(conversation.id, (updated) => {
      setItems(toChatItems(updated.messages ?? []));
    });
    return conversation;
  }, [base44]);

  const openPanel = useCallback(async () => {
    setOpen(true);
    if (conversationRef.current || starting) return;
    setStarting(true);
    setError(null);
    try {
      await ensureConversation();
    } catch {
      setError("The Sales Copilot isn't available yet. Deploy the agent with `base44 deploy`.");
    } finally {
      setStarting(false);
    }
  }, [ensureConversation, starting]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;
      setSending(true);
      setError(null);
      // Optimistic echo; the subscription replaces this with authoritative state.
      setItems((prev) => [...prev, { key: `local-${Date.now()}`, role: "user", text: content }]);
      try {
        const conversation = await ensureConversation();
        await getBrowserClient(base44).agents.addMessage(conversation, {
          role: "user",
          content,
        });
      } catch {
        setError("Couldn't reach the Copilot. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [base44, ensureConversation, sending],
  );

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return { open, setOpen, openPanel, items, send, sending, starting, error };
}
