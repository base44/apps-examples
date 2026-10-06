import { createClient } from "@base44/sdk";

declare const __APP_ID__: string;

export const base44 = createClient({ appId: __APP_ID__, appBaseUrl: location.origin, requiresAuth: true });

export type AgentRun = { id: string; directive: string; status: string; model?: string; host?: string; created_date: string };
export type AgentEvent = { id: string; seq: number; kind: string; content?: string; call_id?: string };
