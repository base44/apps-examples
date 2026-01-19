import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || 'trellix',
});

export const { Board, Task, Team, TeamMember, TaskSubscription, ActivityLog } = base44.entities;
