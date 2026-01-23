# Trellix

A Trello-style task and project management app built with React and powered by [Base44](https://base44.com) Backend-as-a-Service.

🔗 **[View Live Demo](https://trellix-example-64ad1623.base44.app/)**

## Project structure

```
trellix/
├── base44/                    # Base44 BaaS configuration
│   ├── config.jsonc           # Project configuration
│   └── entities/              # Entity schema definitions
├── src/
│   ├── App.tsx                # Root component with routing
│   ├── App.css                # Global styles
│   ├── types.ts               # TypeScript type definitions
│   ├── sdk-client/            # Base44 SDK client setup
│   ├── components/            # Reusable UI components
│   │   ├── board/             # Board-related components
│   │   ├── sidebar/           # Navigation sidebar
│   │   └── task/              # Task card and modal
│   └── pages/                 # Page components
│       ├── auth.tsx           # Authentication page
│       ├── board-list.tsx     # Board listing/grid
│       ├── board-view.tsx     # Kanban board view
│       └── profile.tsx        # User profile
├── public/                    # Static assets
└── dist/                      # Build output
```

## Base44 integration

Trellix uses [Base44](https://base44.com) as its Backend-as-a-Service, eliminating the need for a custom backend. Base44 provides:

- **Authentication:** Email/password auth with OTP verification
- **Database:** Entity-based data storage with CRUD operations
- **Hosting:** Build and deployment configuration

### SDK client

The Base44 SDK is initialized in `src/sdk-client/base44-client.ts`:

```typescript
import { createClient } from '@base44/sdk';

export const base44 = createClient({
  serverUrl: 'https://pr-2741.velino.org',
  appId: import.meta.env.VITE_BASE44_APP_ID,
});

export const { Board, Task, Team, TeamMember, TaskSubscription, ActivityLog } = base44.entities;
```

**Authentication examples:**

```typescript
await base44.auth.register({ email, password });
await base44.auth.loginViaEmailPassword(email, password);
await base44.auth.verifyOtp({ email, otpCode });
const user = await base44.auth.me();
await base44.auth.updateMe({ full_name: 'John' });
base44.auth.logout();
```

**Entity CRUD examples:**

```typescript
const boards = await Board.list();
const board = await Board.create({ name: 'My Board', color: 'blue' });
const filtered = await Board.filter({ name: 'My Board' });
const updated = await Board.update(id, { name: 'New Name' });
await Board.delete(id);
```

### Entity definitions

Entities are defined as JSONC schemas in `base44/entities/`. Base44 uses these to generate the database structure and provide typed SDK methods.

| Entity | Description |
| --- | --- |
| `board.jsonc` | Kanban boards with name, description, and color |
| `task.jsonc` | Tasks with title, status, priority, due date, labels |
| `team.jsonc` | Teams for collaborative workspaces |
| `team-member.jsonc` | Team membership with roles (admin/member/viewer) |
| `task-subscription.jsonc` | Task notification subscriptions |
| `activity-log.jsonc` | Audit log for task actions |

**Example entity schema (`task.jsonc`):**

```jsonc
{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["todo", "in_progress", "done"],
      "default": "todo"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium"
    },
    "board_id": { "type": "string" },
    "assignee_email": { "type": "string" },
    "due_date": { "type": "string", "format": "date" },
    "labels": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["title"]
}
```

### Project configuration

The `base44/config.jsonc` file defines project metadata and hosting/build settings:

```jsonc
{
  "name": "Trellix",
  "description": "Task and project management solution",
  "site": {
    "installCommand": "npm install",
    "buildCommand": "npm run build",
    "serveCommand": "npm run dev",
    "outputDirectory": "./dist"
  }
}
```

## Development

See the [Getting started](../README.md#getting-started) guide in the top-level README for setup instructions.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Base44 BaaS
- **Styling:** CSS (custom)
