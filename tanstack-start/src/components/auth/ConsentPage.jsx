import { getAccessToken } from "@base44/sdk";
import { Loader2, ShieldCheck } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { getAppParams } from "@/lib/app-params";

// The /oauth/consent page: app-side OAuth consent for the app's MCP server. The platform redirects
// AI clients here (base44/mcp/config.json `consent_path`, default /oauth/consent)
// with an opaque `ctx` handle — the authorization request itself lives on the
// server. The page gates on the app-user session, fetches the display info for
// the handle, shows what is being granted and posts the approve/deny decision.
// It handles the signed-out case itself, so its route must stay OUTSIDE _authed/.
// Do not change the fetch calls, headers or the `ctx` handling — styling and
// copy are safe to edit.
const authHeaders = () => {
  // Cookie-backed sessions carry no token; "Bearer null" would shadow the valid
  // cookie, so send the header only when a token exists.
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const loginRedirect = (loginPath, ctx) => {
  // The handle rides back in returnTo (our pages) and from_url (the platform
  // login, which serves an app coerced to platform auth). Rebuild the query
  // from `ctx` alone — never forward the raw location.search.
  const returnTo = window.location.pathname + "?ctx=" + encodeURIComponent(ctx);
  const encoded = encodeURIComponent(returnTo);
  window.location.href = (loginPath || "/login") + "?returnTo=" + encoded + "&from_url=" + encoded;
};

const OPERATION_VERBS = { read: "view", create: "create", update: "edit", delete: "delete" };
const COLLAPSED_DATA_ROWS = 6;

// Entity tools arrive one per operation; show each entity once, naming only the
// operations it actually grants.
function groupTools(tools) {
  const operationsByEntity = new Map();
  const agents = [];
  const actions = [];
  for (const tool of tools) {
    if (tool.kind === "entity" && tool.entity) {
      if (!operationsByEntity.has(tool.entity)) operationsByEntity.set(tool.entity, []);
      operationsByEntity.get(tool.entity).push(tool.operation);
    } else if (tool.kind === "agent") {
      agents.push(tool);
    } else {
      actions.push(tool);
    }
  }
  const data = [...operationsByEntity].map(([entity, operations]) => ({
    entity,
    operations: Object.keys(OPERATION_VERBS).filter((op) => operations.includes(op)),
  }));
  return { data, agents, actions };
}

const humanize = (name) =>
  name.split(/[_-]+/).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ") || name;

// "View, create and delete records" — delete is emphasized so it doesn't hide
// among harmless verbs.
function OperationSummary({ operations }) {
  return (
    <>
      {operations.map((op, i) => {
        const verb = OPERATION_VERBS[op];
        const separator = i === 0 ? "" : i === operations.length - 1 ? " and " : ", ";
        return (
          <Fragment key={op}>
            {separator}
            <span className={op === "delete" ? "font-medium text-destructive" : undefined}>
              {i === 0 ? verb[0].toUpperCase() + verb.slice(1) : verb}
            </span>
          </Fragment>
        );
      })}{" "}
      records
    </>
  );
}

function ToolSection({ title, children }) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{title}</h3>
      <ul className="divide-y divide-border rounded-lg border border-border">{children}</ul>
    </section>
  );
}

function ToolRow({ title, children }) {
  return (
    <li className="flex flex-col gap-0.5 px-3 py-2">
      <span className="font-medium text-foreground">{title}</span>
      {children && <span className="text-muted-foreground">{children}</span>}
    </li>
  );
}

export function ConsentPage() {
  // Read raw: the opaque handle must reach the server exactly as the platform sent it.
  const ctx = new URLSearchParams(window.location.search).get("ctx");
  const { appId } = getAppParams();
  const [info, setInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decided, setDecided] = useState("");
  const [error, setError] = useState("");
  const [reconnect, setReconnect] = useState("");
  const [showAllData, setShowAllData] = useState(false);

  useEffect(() => {
    let redirecting = false;
    (async () => {
      try {
        if (!ctx) {
          setError("This authorization link is invalid or has expired.");
          return;
        }
        // Resolve the handle first: a dead handle must never render approve/deny,
        // and the response carries the app's configured login route.
        const res = await fetch(`/api/apps/${appId}/mcp/consent-info?handle=${encodeURIComponent(ctx)}`, {
          credentials: "include",
          headers: authHeaders(),
        });
        if (!res.ok) {
          setError("This authorization link is invalid or has expired.");
          return;
        }
        const data = await res.json();
        // Gate on the server's answer, not on the SDK: a cookie-only session
        // reads as signed-out client-side but authenticated this request.
        if (!data.authenticated) {
          redirecting = true;
          loginRedirect(data.login_path, ctx);
          return;
        }
        setInfo(data);
      } catch {
        setError("Could not load this authorization request. Please try again.");
      } finally {
        if (!redirecting) setChecking(false);
      }
    })();
  }, [ctx, appId]);

  const respond = async (action) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${appId}/mcp/authorize-grant`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ ctx, action }),
      });
      if (!res.ok) {
        // 401: the session expired before the single-use handle was spent — back through login with ctx.
        if (res.status === 401) {
          loginRedirect(info?.login_path, ctx);
          return;
        }
        // These come after the handle is consumed (409 tool set changed, 403
        // mismatch, 404 access gone, 400 used) — retrying can only 404.
        if ([400, 403, 404, 409].includes(res.status)) {
          let detail = "";
          try {
            detail = (await res.json()).detail;
          } catch {
            /* keep default */
          }
          setReconnect(detail || "This authorization can no longer be completed. Reconnect from your AI client to try again.");
          setSubmitting(false);
          return;
        }
        throw new Error("Could not complete authorization. Please try again.");
      }
      const data = await res.json();
      window.location.href = data.redirect_url;
      if (!/^https?:/i.test(data.redirect_url)) {
        // Custom-scheme redirects (native AI clients) may not visibly navigate.
        setDecided(action);
        setSubmitting(false);
      }
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      </AuthLayout>
    );
  }

  const client = info?.client_name || "An AI client";
  const appName = info?.app_name || "this app";

  if (decided) {
    return <AuthLayout icon={ShieldCheck} title={decided === "approve" ? "Access granted" : "Access denied"} subtitle={`You can return to ${client} and close this window.`} />;
  }
  if (reconnect) {
    return (
      <AuthLayout icon={ShieldCheck} title="Reconnect required">
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{reconnect}</div>
      </AuthLayout>
    );
  }
  // No consent details means nothing trustworthy to approve.
  if (error && !info) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access">
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      </AuthLayout>
    );
  }

  const tools = Array.isArray(info.tools) ? info.tools : [];
  const { data, agents, actions } = groupTools(tools);
  return (
    <AuthLayout icon={ShieldCheck} title="Authorize access" subtitle={`${client} wants to access ${appName} on your behalf`}>
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <p className="mb-3 text-sm font-medium text-foreground">{tools.length ? `${client} will be able to:` : "No tools requested"}</p>
      {tools.length > 0 && (
        <div className="space-y-4 text-sm mb-6">
          {data.length > 0 && (
            <ToolSection title={`Data (${data.length})`}>
              {(showAllData ? data : data.slice(0, COLLAPSED_DATA_ROWS)).map(({ entity, operations }) => (
                <ToolRow key={entity} title={entity}>
                  <OperationSummary operations={operations} />
                </ToolRow>
              ))}
              {data.length > COLLAPSED_DATA_ROWS && (
                <li className="px-3 py-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setShowAllData((shown) => !shown)}
                  >
                    {showAllData ? "Show less" : `Show all ${data.length}`}
                  </button>
                </li>
              )}
            </ToolSection>
          )}
          {agents.length > 0 && (
            <ToolSection title="Agents">
              {agents.map((tool) => (
                <ToolRow key={tool.name} title={tool.agent ? humanize(tool.agent) : tool.title || tool.name}>
                  {tool.description}
                </ToolRow>
              ))}
            </ToolSection>
          )}
          {actions.length > 0 && (
            <ToolSection title="Actions">
              {actions.map((tool) => (
                <ToolRow key={tool.name} title={tool.title || tool.name}>
                  {tool.description}
                </ToolRow>
              ))}
            </ToolSection>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="h-12 flex-1 font-medium" disabled={submitting} onClick={() => respond("deny")}>
          Deny
        </Button>
        <Button className="h-12 flex-1 font-medium" disabled={submitting} onClick={() => respond("approve")}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Approve
        </Button>
      </div>
    </AuthLayout>
  );
}
