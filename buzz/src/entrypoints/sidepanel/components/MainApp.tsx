import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { browser } from "wxt/browser";
import { Icons } from "./Icons";
import { useBrowserContext } from "../hooks/useBrowserContext";
import { useChat } from "../hooks/useChat";
import { buildContext, cleanMessageContent } from "../utils/messages";
import { createQuickActions } from "../utils/quickActions";

interface ToolItem {
  Icon: () => ReactNode;
  action: () => Promise<void>;
  title: string;
  active?: boolean;
}

export function MainApp() {
  const { tabs, currentTab, tabGroups, refreshContext } = useBrowserContext();
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<{ url: string; title: string; content: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check bookmark status when tab changes
  useEffect(() => {
    const checkBookmark = async () => {
      if (currentTab?.url) {
        const existing = await browser.bookmarks.search({ url: currentTab.url });
        setIsBookmarked(existing.length > 0);
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [currentTab?.url]);

  const addNotification = useCallback((content: string) => {
    setNotification(content);
    setTimeout(() => {
      setNotification(prev => prev === content ? null : prev);
    }, 3000);
  }, []);

  const quickActions = useMemo(() => createQuickActions(
    currentTab,
    tabs,
    refreshContext,
    addNotification,
    setPageContext,
    setInstruction,
    setIsBookmarked,
    { pageContext, instruction, isBookmarked }
  ), [currentTab, tabs, refreshContext, addNotification, pageContext, instruction, isBookmarked]);

  const buildContextFn = useCallback(() => {
    return buildContext(tabs, currentTab, tabGroups, selectedElement, pageContext);
  }, [tabs, currentTab, tabGroups, selectedElement, pageContext]);

  const { messages, input, setInput, isWaiting, sendMessage, parseActions } = useChat({
    buildContext: buildContextFn,
    refreshContext,
    readPage: quickActions.readPage
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for messages from content script and background
  useEffect(() => {
    const listener = (message: { action: string; content?: string; type?: string; text?: string; pageTitle?: string }) => {
      if (message.action === "elementSelected" && message.content) {
        setSelectedElement(message.content);
        setInstruction(null);
        addNotification("Element added to context");
      } else if (message.action === "pickerCancelled") {
        setInstruction(null);
      } else if (message.action === "contextMenuAction") {
        if (message.type === "ask" && message.text) {
          setInput(`What is this: "${message.text}"`);
        } else if (message.type === "summarize") {
          setInput(`Summarize ${message.pageTitle || "this page"}`);
          quickActions.readPage();
        }
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, [addNotification, setInput, quickActions]);

  const isCurrentPageInContext = pageContext?.url === currentTab?.url;

  const tools: ToolItem[] = [
    { Icon: Icons.Camera, action: quickActions.screenshot, title: "Screenshot" },
    { Icon: Icons.Bookmark, action: quickActions.bookmark, title: "Bookmark", active: isBookmarked },
    { Icon: Icons.Link, action: quickActions.copyUrl, title: "Copy URL" },
    { Icon: Icons.Trash, action: quickActions.closeDuplicates, title: "Close duplicates" },
    { Icon: Icons.Target, action: quickActions.selectElement, title: "Select element", active: !!instruction },
    { Icon: Icons.FileText, action: quickActions.readPage, title: "Read page content", active: isCurrentPageInContext },
  ];

  // Calculate stats
  const duplicateCount = (() => {
    const urlMap = new Map<string, number>();
    tabs.forEach(tab => {
      if (tab.url) {
        if (!urlMap.has(tab.url)) urlMap.set(tab.url, 0);
        urlMap.set(tab.url, urlMap.get(tab.url)! + 1);
      }
    });
    let count = 0;
    urlMap.forEach(c => { if (c > 1) count += c - 1; });
    return count;
  })();

  const suggestions = [
    "Organize my tabs",
    "What's open?",
    "Find duplicates",
    "Summarize this page"
  ];

  return (
    <div className="h-screen flex flex-col sidebar-container">
      {/* Top Section - Stats & Tools */}
      <div className="shrink-0 p-4">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value">{tabs.length}</span>
            <span className="stat-label">tabs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{tabGroups.length}</span>
            <span className="stat-label">groups</span>
          </div>
          <div className="stat-divider" />
          <div className={`stat-item ${duplicateCount > 0 ? 'has-alert' : ''}`}>
            <span className="stat-value">{duplicateCount}</span>
            <span className="stat-label">dupes</span>
          </div>
        </div>

        {/* Tools Row */}
        <div className="tools-row">
          {tools.map((tool, i) => (
            <button
              key={i}
              onClick={tool.action}
              className={`tool-button ${tool.active ? 'active' : ''}`}
              title={tool.title}
            >
              <tool.Icon />
            </button>
          ))}
        </div>

        {/* Context Indicators */}
        {(selectedElement || pageContext) && (
          <div className="context-indicators">
            {selectedElement && (
              <div className="context-badge animate-fade-in">
                <Icons.Target />
                <span>Element</span>
                <button onClick={() => setSelectedElement(null)} className="icon-button">
                  <Icons.Close />
                </button>
              </div>
            )}
            {pageContext && (
              <div className="context-badge animate-fade-in">
                <Icons.FileText />
                <span className="truncate max-w-[120px]">{pageContext.title}</span>
                <button onClick={() => setPageContext(null)} className="icon-button">
                  <Icons.Close />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instruction Banner */}
        {instruction && (
          <div className="instruction-banner animate-fade-in">
            <Icons.Target />
            <span>{instruction}</span>
            <button onClick={() => setInstruction(null)} className="icon-button ml-auto">
              <Icons.Close />
            </button>
          </div>
        )}

        {/* Toast Notification */}
        {notification && (
          <div className="toast-notification animate-fade-in">
            <Icons.Check />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Chat Section - Bottom */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="empty-state animate-fade-in">
              <div className="suggestion-chips">
                {suggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="suggestion-chip"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation messages */}
          {messages.filter(msg => msg.role !== "system").map((msg, i) => {
            const content = cleanMessageContent(msg);
            if (!content) return null;

            const actions = msg.role === "assistant" ? parseActions(msg.content || "") : [];

            return (
              <div
                key={`msg-${i}-${msg.role}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 ${
                    msg.role === "user" ? "message-user" : "message-assistant"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{content}</p>
                  )}
                  {actions.length > 0 && (
                    <div className="mt-2 text-xs opacity-50 flex items-center gap-1">
                      <span>action: {actions.map(a => a.type.replace("_", " ")).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isWaiting && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <div className="flex justify-start">
              <Icons.TypingDots />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 shrink-0">
          <div className="chat-input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask Buzz anything..."
              className="chat-input"
            />
            <div className="chat-input-actions">
              <button
                onClick={sendMessage}
                disabled={isWaiting || !input.trim()}
                className="send-button"
              >
                <Icons.Send />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
