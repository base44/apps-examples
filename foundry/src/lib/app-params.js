import { getAccessToken } from "@base44/sdk";

const isBrowser = typeof window !== "undefined";

const isClearAccessTokenRequested = () =>
  isBrowser && new URLSearchParams(window.location.search).get("clear_access_token") === "true";

const clearStoredAccessToken = () => {
  window.localStorage.removeItem("base44_access_token");
  window.localStorage.removeItem("token");
};

export function getAppParams() {
  if (isClearAccessTokenRequested()) clearStoredAccessToken();
  return {
    appId: import.meta.env.VITE_BASE44_APP_ID,
    token: isBrowser ? getAccessToken() : null,
    functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
    appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL,
  };
}
