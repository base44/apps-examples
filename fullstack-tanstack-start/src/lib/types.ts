// Shared types + constants for the CRM. Pure data — safe to import anywhere
// (client or server), no side effects.

/** A logged-in user, as surfaced to the UI. */
export interface SessionUser {
  email: string;
  full_name: string | null;
  role: string;
}

/**
 * Base44 SDK config resolved AT RUNTIME on the server (from the Worker env the
 * deploy injects) and threaded to the browser through the root route context.
 * Never baked at build time — `--prebuilt` deploys would miss build-time env.
 * Only the app id is needed: the browser SDK runs same-origin (serverUrl: ""),
 * with the dispatcher reverse-proxying /api/apps/* to the platform.
 */
export interface Base44Config {
  appId: string;
}

/** Session resolved on the server for every request. */
export interface Session {
  /** SDK config for browser-side writes; null when no app id is resolvable. */
  base44: Base44Config | null;
  user: SessionUser | null;
}

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

/** Ordered pipeline stages with display metadata (drives the kanban board). */
export const STAGES: ReadonlyArray<{
  id: DealStage;
  label: string;
  /** Rough probability of closing — used for the weighted forecast. */
  probability: number;
}> = [
  { id: "lead", label: "Lead", probability: 0.1 },
  { id: "qualified", label: "Qualified", probability: 0.3 },
  { id: "proposal", label: "Proposal", probability: 0.5 },
  { id: "negotiation", label: "Negotiation", probability: 0.7 },
  { id: "won", label: "Won", probability: 1 },
  { id: "lost", label: "Lost", probability: 0 },
];

/** Stages that represent live opportunities (excludes won/lost). */
export const OPEN_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
];

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Contact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  title?: string;
  owner_email: string;
  created_date?: string;
  updated_date?: string;
}

export interface Deal {
  id: string;
  title: string;
  contact_id?: string;
  amount?: number;
  stage: DealStage;
  close_date?: string;
  owner_email: string;
  notes?: string;
  created_date?: string;
  updated_date?: string;
}

export interface Activity {
  id: string;
  deal_id?: string;
  contact_id?: string;
  type: ActivityType;
  summary: string;
  created_by?: string;
  created_date?: string;
}

/** Server-computed pipeline KPIs rendered on the dashboard. */
export interface DashboardStats {
  openValue: number;
  weightedValue: number;
  wonValue: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  winRate: number | null;
  byStage: Array<{ stage: DealStage; label: string; count: number; value: number }>;
  closingSoon: Deal[];
}
