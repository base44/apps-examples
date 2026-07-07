import type { ReactNode } from "react";

interface Props {
  emoji: string;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, message, action }: Props) {
  return (
    <div className="empty">
      <div className="emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
