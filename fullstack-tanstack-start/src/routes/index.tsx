import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "../lib/crm.js";
import { requireUser } from "../lib/guard.js";
import { EmptyState } from "../components/EmptyState.js";
import {
  formatCompactCurrency,
  formatCurrency,
  formatRelative,
  stageAccent,
} from "../lib/format.js";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context, location }) => requireUser(context.session, location.href),
  loader: () => getDashboard(),
  component: Dashboard,
});

function Dashboard() {
  const { stats, dealCount } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const isManager = session.user?.role === "admin";

  const maxStageValue = Math.max(1, ...stats.byStage.map((s) => s.value));

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1>Pipeline</h1>
          <p className="sub">
            {isManager
              ? "Team-wide view — every rep's deals."
              : "Your deals, scoped to you by row-level security."}
          </p>
        </div>
        <Link to="/deals" className="btn btn-primary">
          Open board →
        </Link>
      </div>

      {dealCount === 0 ? (
        <div className="card">
          <EmptyState
            emoji="📊"
            title="No deals yet"
            message="Add deals to the board (or run the seed snippet in the README) and your pipeline KPIs will appear here — computed server-side on every request."
            action={
              <Link to="/deals" className="btn btn-primary">
                Go to the board
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="card kpi">
              <div className="label">Open pipeline</div>
              <div className="value accent">{formatCompactCurrency(stats.openValue)}</div>
              <div className="hint">{stats.openCount} open deals</div>
            </div>
            <div className="card kpi">
              <div className="label">Weighted forecast</div>
              <div className="value">{formatCompactCurrency(stats.weightedValue)}</div>
              <div className="hint">probability-adjusted</div>
            </div>
            <div className="card kpi">
              <div className="label">Won revenue</div>
              <div className="value teal">{formatCompactCurrency(stats.wonValue)}</div>
              <div className="hint">{stats.wonCount} deals closed</div>
            </div>
            <div className="card kpi">
              <div className="label">Win rate</div>
              <div className="value">
                {stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`}
              </div>
              <div className="hint">
                {stats.wonCount} won · {stats.lostCount} lost
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card card-pad">
              <div className="section-title">Deals by stage</div>
              {stats.byStage.map((s) => (
                <div className="funnel-row" key={s.stage}>
                  <span className="stage">
                    <span className="dot" style={{ background: stageAccent(s.stage) }} />
                    {s.label}
                  </span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{
                        width: `${(s.value / maxStageValue) * 100}%`,
                        background: stageAccent(s.stage),
                      }}
                    />
                  </span>
                  <span className="amount">{formatCompactCurrency(s.value)}</span>
                  <span className="count">{s.count}</span>
                </div>
              ))}
            </div>

            <div className="card card-pad">
              <div className="section-title">Closing soon</div>
              {stats.closingSoon.length === 0 ? (
                <p className="muted" style={{ fontSize: 14 }}>
                  No open deals with a close date in the next 30 days.
                </p>
              ) : (
                <div className="stack" style={{ gap: 2 }}>
                  {stats.closingSoon.map((d) => (
                    <Link
                      key={d.id}
                      to="/deals/$id"
                      params={{ id: d.id }}
                      className="kv"
                      style={{ alignItems: "center" }}
                    >
                      <span className="stack" style={{ gap: 2 }}>
                        <span className="cell-strong">{d.title}</span>
                        <span className="muted" style={{ fontSize: 12.5 }}>
                          closes {formatRelative(d.close_date)}
                        </span>
                      </span>
                      <span className="v">{formatCurrency(d.amount)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
