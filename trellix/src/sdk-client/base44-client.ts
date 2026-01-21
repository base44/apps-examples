import { createClient } from '@base44/sdk';

export const base44 = createClient({
  serverUrl: 'https://pr-2741.velino.org',
  appId: import.meta.env.VITE_BASE44_APP_ID,
});

export const { Board, Task, Team, TeamMember, TaskSubscription, ActivityLog } = base44.entities;
