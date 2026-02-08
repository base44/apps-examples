import { useState, useRef, useEffect, useCallback } from "react";
import type { AgentConversation } from "@base44/sdk";
import { base44 } from "../../../api/base44Client";
import type { DisplayMessage } from "../types";
import { parseActions, executeAction } from "../utils/actions";

interface UseChatOptions {
  buildContext: () => string;
  refreshContext: () => Promise<void>;
  readPage: () => Promise<void>;
}

export function useChat({ buildContext, refreshContext, readPage }: UseChatOptions) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [conversation, setConversation] = useState<AgentConversation | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastExecutedContentRef = useRef<string | null>(null);

  // Use refs to avoid stale closure in subscription callback
  const refreshContextRef = useRef(refreshContext);
  const readPageRef = useRef(readPage);

  useEffect(() => {
    refreshContextRef.current = refreshContext;
    readPageRef.current = readPage;
  }, [refreshContext, readPage]);

  const handleConversationUpdate = useCallback((updatedConversation: AgentConversation) => {
    const serverMsgs = updatedConversation.messages || [];
    if (serverMsgs.length === 0) return;

    const lastServerMsg = serverMsgs[serverMsgs.length - 1];
    const rawContent = lastServerMsg?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : rawContent != null
        ? JSON.stringify(rawContent)
        : "";
    const isGenerating = (updatedConversation as AgentConversation & { is_generating?: boolean }).is_generating;

    if (lastServerMsg?.role === "assistant") {
      if (content) {
        const displayMsg: DisplayMessage = {
          role: lastServerMsg.role,
          content: content
        };
        setMessages(prev => {
          if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1] = displayMsg;
            return updated;
          } else {
            return [...prev, displayMsg];
          }
        });
      }

      if (!isGenerating) {
        setIsWaiting(false);

        if (content && content !== lastExecutedContentRef.current) {
          const actions = parseActions(content);
          if (actions.length > 0) {
            lastExecutedContentRef.current = content;
            actions.forEach(action => executeAction(action, refreshContextRef.current, readPageRef.current));
          }
        }
      }
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isWaiting) return;

    const userMessage = input.trim();
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsWaiting(true);
    lastExecutedContentRef.current = null;

    try {
      let conv = conversation;

      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: "assistant",
          metadata: { source: "buzz-extension" }
        });
        setConversation(conv);

        unsubscribeRef.current = base44.agents.subscribeToConversation(
          conv.id,
          handleConversationUpdate
        );
      }

      const context = buildContext();
      const messageContent = `${userMessage}\n\n---\n${context}`;

      await base44.agents.addMessage(conv, {
        role: "user",
        content: messageContent
      });

      // Fetch conversation to get AI response as fallback
      // (subscription may not fire reliably in extension context)
      const updated = await base44.agents.getConversation(conv.id);
      handleConversationUpdate(updated as AgentConversation);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
      setIsWaiting(false);
    }
  }, [input, isWaiting, conversation, buildContext, handleConversationUpdate]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    messages,
    input,
    setInput,
    isWaiting,
    sendMessage,
    parseActions
  };
}
