import type { Browser } from "wxt/browser";
import type { DisplayMessage } from "../types";

interface PageContext {
  url: string;
  title: string;
  content: string;
}

export function buildContext(
  tabs: Browser.tabs.Tab[],
  currentTab: Browser.tabs.Tab | null,
  tabGroups: Browser.tabGroups.TabGroup[],
  selectedElement: string | null,
  pageContext: PageContext | null
): string {
  const tabsSummary = tabs.map((t) => `[${t.id}] ${t.title} - ${t.url}`).join("\n");
  const groupsSummary = tabGroups.map(g => `Group "${g.title}": ${g.color}`).join(", ");

  let context = `Browser Context:
- ${tabs.length} open tabs
- Current tab: "${currentTab?.title}" (${currentTab?.url})
${tabGroups.length > 0 ? `- Tab groups: ${groupsSummary}` : ""}

Open Tabs (format: [tabId] title - url):
${tabsSummary}`;

  if (selectedElement) {
    context += `\n\nSelected Element on Page:\n${selectedElement}`;
  }

  if (pageContext) {
    context += `\n\n${pageContext.content}`;
  }

  return context;
}

export function cleanMessageContent(msg: DisplayMessage): string {
  let content = msg.content || "";

  if (msg.role === "user") {
    const contextIndex = content.indexOf("\n\n---\n");
    if (contextIndex > -1) {
      content = content.substring(0, contextIndex);
    }
  }

  if (msg.role === "assistant") {
    content = content.replace(/\[ACTION:[^\]]+\]/g, "").trim();
  }

  return content;
}
