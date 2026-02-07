import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    await browser.sidePanel.open({ windowId: tab.windowId });
  });

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "elementSelected") {
      browser.runtime.sendMessage(message);
    }
    return true;
  });
});
