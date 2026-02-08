import { useState, useEffect, useCallback } from "react";
import { browser, type Browser } from "wxt/browser";

export function useBrowserContext() {
  const [tabs, setTabs] = useState<Browser.tabs.Tab[]>([]);
  const [currentTab, setCurrentTab] = useState<Browser.tabs.Tab | null>(null);
  const [tabGroups, setTabGroups] = useState<Browser.tabGroups.TabGroup[]>([]);

  const refreshContext = useCallback(async () => {
    const allTabs = await browser.tabs.query({});
    setTabs(allTabs);

    const [active] = await browser.tabs.query({ active: true, currentWindow: true });
    setCurrentTab(active || null);

    try {
      const groups = await browser.tabGroups.query({});
      setTabGroups(groups);
    } catch {
      setTabGroups([]);
    }
  }, []);

  useEffect(() => {
    refreshContext();
    browser.tabs.onUpdated.addListener(refreshContext);
    browser.tabs.onRemoved.addListener(refreshContext);
    browser.tabs.onActivated.addListener(refreshContext);
    return () => {
      browser.tabs.onUpdated.removeListener(refreshContext);
      browser.tabs.onRemoved.removeListener(refreshContext);
      browser.tabs.onActivated.removeListener(refreshContext);
    };
  }, [refreshContext]);

  return { tabs, currentTab, tabGroups, refreshContext };
}
