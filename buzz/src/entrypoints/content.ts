import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    let pickerActive = false;
    let overlay: HTMLDivElement | null = null;
    let highlightedElement: HTMLElement | null = null;

    function createOverlay() {
      overlay = document.createElement("div");
      overlay.id = "browser-assistant-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        cursor: crosshair;
        background: rgba(99, 102, 241, 0.1);
      `;
      document.body.appendChild(overlay);
    }

    function removeOverlay() {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      if (highlightedElement) {
        highlightedElement.style.outline = "";
        highlightedElement = null;
      }
    }

    function getElementContent(element: HTMLElement) {
      const tagName = element.tagName.toLowerCase();
      const text = element.innerText?.substring(0, 500) || "";
      const href = (element as HTMLAnchorElement).href || "";
      const src = (element as HTMLImageElement).src || "";
      const alt = (element as HTMLImageElement).alt || "";

      let content = `<${tagName}>`;
      if (text) content += `\nText: ${text}`;
      if (href) content += `\nLink: ${href}`;
      if (src) content += `\nSource: ${src}`;
      if (alt) content += `\nAlt: ${alt}`;

      const rect = element.getBoundingClientRect();
      content += `\nSize: ${Math.round(rect.width)}x${Math.round(rect.height)}px`;

      return content;
    }

    function handleMouseMove(e: MouseEvent) {
      if (!pickerActive || !overlay) return;

      if (highlightedElement) {
        highlightedElement.style.outline = "";
      }

      overlay.style.pointerEvents = "none";
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      overlay.style.pointerEvents = "auto";

      if (element && element !== document.body && element !== document.documentElement) {
        highlightedElement = element;
        element.style.outline = "2px solid #6366f1";
      }
    }

    function handleClick(e: MouseEvent) {
      if (!pickerActive || !overlay) return;

      e.preventDefault();
      e.stopPropagation();

      overlay.style.pointerEvents = "none";
      const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      overlay.style.pointerEvents = "auto";

      if (element) {
        const content = getElementContent(element);
        browser.runtime.sendMessage({
          action: "elementSelected",
          content: content
        });
      }

      stopPicker();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        browser.runtime.sendMessage({ action: "pickerCancelled" });
        stopPicker();
      }
    }

    function startPicker() {
      pickerActive = true;
      createOverlay();
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyDown);
    }

    function stopPicker() {
      pickerActive = false;
      removeOverlay();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown);
    }

    function getPageContent() {
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

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "startPicker") {
        startPicker();
        sendResponse({ success: true });
      } else if (message.action === "stopPicker") {
        stopPicker();
        sendResponse({ success: true });
      } else if (message.action === "readPage") {
        const pageContent = getPageContent();
        sendResponse(pageContent);
      }
      return true;
    });
  }
});
