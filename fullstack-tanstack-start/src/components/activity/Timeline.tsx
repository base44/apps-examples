import type { Activity, ActivityType } from "../../lib/types.js";
import { formatRelative } from "../../lib/format.js";

const ICONS: Record<ActivityType, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🗓️",
  note: "📝",
};

export function Timeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 14 }}>
        No activity logged yet. Add the first one on the right.
      </p>
    );
  }

  return (
    <div className="timeline">
      {activities.map((a) => (
        <div className="tl-item" key={a.id}>
          <span className="marker">{ICONS[a.type] ?? "•"}</span>
          <div className="head">
            <span className="type">{a.type}</span>
            <span className="when">{formatRelative(a.created_date)}</span>
          </div>
          <div className="body">{a.summary}</div>
          {a.created_by ? <div className="who">by {a.created_by}</div> : null}
        </div>
      ))}
    </div>
  );
}
