# Trellix

A Trello-style task and project management app powered by the [Base44](https://base44.com) backend.

🔗 **[View Live Demo](https://trellix-example-64ad1623.base44.app/)**

## Getting started

> **Note:** Node.js 18+ and a [Base44 account](https://app.base44.com) are required. Commands use `npx` (no global CLI install).

1. From the repo root, go to the app and install dependencies:

   ```bash
   cd trellix
   npm install
   ```

2. Log in and link the project:

   ```bash
   npx base44 login
   npx base44 link
   ```

   This creates a Base44 project and writes `base44/.app.jsonc` with your app id.

3. Create the env file from the generated app id:

   ```bash
   echo "VITE_BASE44_APP_ID=$(grep '"id"' base44/.app.jsonc | cut -d'"' -f4)" > .env.local
   ```

4. Push entities and start the dev server:

   ```bash
   npx base44 entities push
   npm run dev
   ```

   The app runs at **http://localhost:5173/**.

## Features

- **Boards**: Create and manage Kanban boards with custom colors.
- **Tasks**: Add tasks with status, priority, due dates, and labels.
- **Teams**: Collaborative workspaces with roles (admin, member, viewer).
- **Authentication**: Email/password with OTP and Google OAuth.
- **AI assistant**: In-app assistant (when configured).

## Project structure

```
trellix/
├── base44/                    # Base44 backend configuration
│   ├── config.jsonc           # Project configuration
│   ├── agents/                # AI agent instructions (optional)
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

## Tech stack

- **[React](https://react.dev)**: UI library.
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe JavaScript.
- **[Vite](https://vitejs.dev)**: Build tool and dev server.
- **[Base44](https://base44.com)**: Backend (auth, data, hosting).
- **[CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)**. Custom styles (no framework).

## Scripts

npm commands you can run from the project root:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Base44 integration

How this app connects to Base44: SDK setup, entities, and config. Trellix uses [Base44](https://base44.com) for:

- **Authentication**: Email/password auth with OTP verification.
- **Database**: Entity-based data storage with CRUD operations.
- **Hosting**: Build and deployment configuration.

### SDK client

The Base44 SDK is initialized in `src/sdk-client/base44-client.ts`:

```typescript
import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
});

export const { Board, Task, Team, TeamMember, TaskSubscription, ActivityLog } = base44.entities;
```

**Authentication examples:**

```typescript
// Email/password authentication
await base44.auth.register({ email, password });
await base44.auth.loginViaEmailPassword(email, password);
await base44.auth.verifyOtp({ email, otpCode });

// Google OAuth authentication
base44.auth.loginWithProvider('google');

// User management
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

## Troubleshooting

### App won't start or shows a blank page?

1. Make sure you created `.env.local` with `VITE_BASE44_APP_ID` (step 3 in Getting started).
2. Run `npm run dev` from the `trellix` folder and check the terminal for errors.
3. Confirm Node.js is v18 or later: `node -v`.

### API or login errors?

1. Ensure you're logged in: `npx base44 whoami`
2. Verify the project is linked: check that `base44/.app.jsonc` exists and contains your app id.
3. Push entities again: `npx base44 entities push`

### Build fails?

Run `npm run lint` to check for type or lint errors. Fix any reported issues and try `npm run build` again.

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
