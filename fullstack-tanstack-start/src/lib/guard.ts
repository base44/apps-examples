// Route guard: bounce anonymous visitors to /login, remembering where they
// were headed. Used in the beforeLoad of every private route.

import { redirect } from "@tanstack/react-router";
import type { Session } from "./types.js";

export function requireUser(session: Session, fromHref: string): void {
  if (!session.user) {
    throw redirect({ to: "/login", search: { from: fromHref } });
  }
}
