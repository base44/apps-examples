import { browser, type Browser } from "wxt/browser";

interface Action {
  type: string;
  tabIds?: number[];
  name?: string;
  color?: string;
  url?: string;
  tabId?: number;
}

export function parseActions(content: string): Action[] {
  const actionRegex = /\[ACTION:\s*(\w+)(?:\s*\|([^\]]+))?\]/g;
  const actions: Action[] = [];
  let match;

  while ((match = actionRegex.exec(content)) !== null) {
    const type = match[1];
    const paramsStr = match[2] || "";
    const params: Record<string, unknown> = {};

    if (paramsStr) {
      paramsStr.split("|").forEach(param => {
        const colonIndex = param.indexOf(":");
        if (colonIndex > -1) {
          const key = param.substring(0, colonIndex).trim();
          let value = param.substring(colonIndex + 1).trim();
          if (key && value) {
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            try {
              params[key] = JSON.parse(value);
            } catch {
              params[key] = value;
            }
          }
        }
      });
    }

    actions.push({ type, ...params } as Action);
  }

  return actions;
}

export async function executeAction(
  action: Action,
  refreshContext: () => Promise<void>,
  readPage: () => Promise<void>
): Promise<void> {
  try {
    switch (action.type) {
      case "close_tabs":
        if (action.tabIds?.length) {
          await browser.tabs.remove(action.tabIds);
          refreshContext();
        }
        break;
      case "group_tabs":
        if (action.tabIds?.length) {
          const groupId = await browser.tabs.group({
            tabIds: action.tabIds as [number, ...number[]]
          });
          await browser.tabGroups.update(groupId, {
            title: action.name || "Group",
            color: (action.color as Browser.tabGroups.Color) || "blue"
          });
          refreshContext();
        }
        break;
      case "open_url":
        if (action.url) {
          await browser.tabs.create({ url: action.url });
        }
        break;
      case "focus_tab":
        if (action.tabId) {
          await browser.tabs.update(action.tabId, { active: true });
        }
        break;
      case "read_page":
        await readPage();
        break;
    }
  } catch (error) {
    console.error("Action execution error:", error);
  }
}
