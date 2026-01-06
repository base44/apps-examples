import React, { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageBubble from "./MessageBubble";

export default function ChatPanel({ open, onOpenChange, boardId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && !conversation) {
      initConversation();
    }
  }, [open]);

  useEffect(() => {
    if (conversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(
        conversation.id,
        (data) => {
          setMessages(data.messages || []);
        }
      );
      return () => unsubscribe();
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initConversation = async () => {
    setIsLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "task_assistant",
        metadata: {
          name: "Task Assistant Chat",
          board_id: boardId
        }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || isSending) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsSending(true);
    
    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-violet-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-white">AI Task Assistant</SheetTitle>
              <p className="text-xs text-white/70">Ask me anything about your tasks</p>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm text-slate-500">
                I can help you create tasks, update status, find information, and more.
              </p>
              <div className="mt-6 space-y-2 w-full max-w-xs">
                {[
                  "Show me all high priority tasks",
                  "Create a new task for review",
                  "What tasks are overdue?"
                ].map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-sm h-auto py-2 px-3"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <MessageBubble key={idx} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your tasks..."
              disabled={isLoading || isSending}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading || isSending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}