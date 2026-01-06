import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Loader2, 
  Bot, 
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import MessageBubble from "@/components/chat/MessageBubble";

export default function Assistant() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation?.id) {
      const unsubscribe = base44.agents.subscribeToConversation(
        selectedConversation.id,
        (data) => {
          setMessages(data.messages || []);
        }
      );
      return () => unsubscribe();
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await base44.agents.listConversations({
        agent_name: "task_assistant"
      });
      setConversations(convs || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const createNewConversation = async () => {
    setIsLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "task_assistant",
        metadata: {
          name: `Chat ${format(new Date(), "MMM d, h:mm a")}`
        }
      });
      setConversations([conv, ...conversations]);
      setSelectedConversation(conv);
      setMessages(conv.messages || []);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setIsLoading(true);
    try {
      const fullConv = await base44.agents.getConversation(conv.id);
      setSelectedConversation(fullConv);
      setMessages(fullConv.messages || []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation || isSending) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsSending(true);
    
    try {
      await base44.agents.addMessage(selectedConversation, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Boards
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800">AI Assistant</h1>
              <p className="text-xs text-slate-500">Manage your tasks</p>
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <Button 
            onClick={createNewConversation}
            disabled={isLoading}
            className="w-full gap-2 bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors",
                  selectedConversation?.id === conv.id
                    ? "bg-violet-50 border border-violet-200"
                    : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {conv.metadata?.name || "Untitled Chat"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(conv.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            
            {conversations.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                No conversations yet
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* WhatsApp Link */}
        <div className="p-4 border-t border-slate-200">
          <a 
            href={base44.agents.getWhatsAppConnectURL('task_assistant')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">WhatsApp</p>
              <p className="text-xs text-emerald-600">Connect to chat</p>
            </div>
          </a>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-violet-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Task Assistant
            </h2>
            <p className="text-slate-500 text-center max-w-md mb-8">
              I can help you create tasks, update status, find information, and provide insights about your work.
            </p>
            <Button 
              onClick={createNewConversation}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Start a Conversation
            </Button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-800">
                {selectedConversation.metadata?.name || "Chat"}
              </h2>
            </div>
            
            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-slate-500 mb-6">
                    How can I help you today?
                  </p>
                  <div className="space-y-2 w-full max-w-sm">
                    {[
                      "Show me all my tasks",
                      "Create a new task",
                      "What tasks are overdue?",
                      "Give me a summary"
                    ].map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-sm"
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
            
            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your tasks..."
                  disabled={isSending}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isSending}
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
          </>
        )}
      </div>
    </div>
  );
}