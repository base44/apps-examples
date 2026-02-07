import { browser, type Browser } from "wxt/browser";

interface PageContext {
  url: string;
  title: string;
  content: string;
}

interface QuickActionsState {
  pageContext: PageContext | null;
  instruction: string | null;
  isBookmarked: boolean;
}

export function createQuickActions(
  currentTab: Browser.tabs.Tab | null,
  tabs: Browser.tabs.Tab[],
  refreshContext: () => Promise<void>,
  addNotification: (content: string) => void,
  setPageContext: (context: PageContext | null) => void,
  setInstruction: (content: string | null) => void,
  setIsBookmarked: (value: boolean) => void,
  state: QuickActionsState
) {
  return {
    bookmark: async () => {
      if (!currentTab?.url) return;

      if (state.isBookmarked) {
        // Remove bookmark
        const existing = await browser.bookmarks.search({ url: currentTab.url });
        if (existing.length > 0) {
          await browser.bookmarks.remove(existing[0].id);
        }
        setIsBookmarked(false);
        addNotification("Bookmark removed");
      } else {
        // Add bookmark
        await browser.bookmarks.create({ title: currentTab.title, url: currentTab.url });
        setIsBookmarked(true);
        addNotification("Bookmarked");
      }
    },
    screenshot: async () => {
      const dataUrl = await browser.tabs.captureVisibleTab();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `screenshot-${Date.now()}.png`;
      link.click();
      addNotification("Screenshot saved");
    },
    copyUrl: async () => {
      if (currentTab?.url) {
        await navigator.clipboard.writeText(currentTab.url);
        addNotification("URL copied");
      }
    },
    closeDuplicates: async () => {
      const urlMap = new Map<string, number[]>();
      tabs.forEach(tab => {
        if (tab.url && tab.id) {
          if (!urlMap.has(tab.url)) urlMap.set(tab.url, []);
          urlMap.get(tab.url)!.push(tab.id);
        }
      });
      const toClose: number[] = [];
      urlMap.forEach(ids => {
        if (ids.length > 1) toClose.push(...ids.slice(1));
      });
      if (toClose.length > 0) {
        await browser.tabs.remove(toClose);
        addNotification(`Closed ${toClose.length} duplicates`);
        refreshContext();
      } else {
        addNotification("No duplicates found");
      }
    },
    selectElement: async () => {
      if (state.instruction) {
        // Cancel element selection
        if (currentTab?.id) {
          browser.tabs.sendMessage(currentTab.id, { action: "stopPicker" });
        }
        setInstruction(null);
      } else {
        // Start element selection
        if (currentTab?.id) {
          browser.tabs.sendMessage(currentTab.id, { action: "startPicker" });
          setInstruction("Click an element on the page");
        }
      }
    },
    readPage: async () => {
      // Check if current page is already in context
      const currentPageInContext = state.pageContext?.url === currentTab?.url;

      if (currentPageInContext) {
        // Remove current page from context
        setPageContext(null);
        addNotification("Page removed from context");
      } else {
        // Load page content
        if (currentTab?.id) {
          try {
            const results = await browser.scripting.executeScript({
              target: { tabId: currentTab.id },
              func: () => {
                const title = document.title;
                const url = window.location.href;
                const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || "";

                const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.article'];
                let mainElement: Element | null = null;
                for (const selector of mainSelectors) {
                  mainElement = document.querySelector(selector);
                  if (mainElement) break;
                }

                const contentRoot = mainElement || document.body;
                const clone = contentRoot.cloneNode(true) as HTMLElement;
                const removeSelectors = ['script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer', 'aside', '[hidden]', '[aria-hidden="true"]'];
                removeSelectors.forEach(selector => {
                  clone.querySelectorAll(selector).forEach(el => el.remove());
                });

                let text = clone.innerText || clone.textContent || "";
                text = text.replace(/\s+/g, ' ').trim();

                const maxLength = 8000;
                if (text.length > maxLength) {
                  text = text.substring(0, maxLength) + "... [truncated]";
                }

                return { title, url, description, content: text };
              }
            });

            const response = results?.[0]?.result;
            if (response) {
              const content = `Page Content from "${response.title}":\n${response.description ? `Description: ${response.description}\n` : ""}URL: ${response.url}\n\nContent:\n${response.content}`;
              setPageContext({ url: response.url, title: response.title, content });
              addNotification("Page added to context");
            }
          } catch (err) {
            console.error("Failed to read page:", err);
            addNotification("Can't read this page");
          }
        }
      }
    }
  };
}
