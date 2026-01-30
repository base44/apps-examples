# CLAUDE.md

This file provides guidance for AI assistants working with this codebase.

## Project Overview

This is the **Base44 Example Apps** repository - a collection of example applications demonstrating Base44 Backend-as-a-Service (BaaS). The main example is **Trellix**, a Trello-style task management app.

## Repository Structure

```
apps-examples/
├── CLAUDE.md              # This file
├── README.md              # Root getting started guide
└── trellix/               # Main example app (Trello clone)
    ├── base44/            # Base44 BaaS configuration
    │   ├── config.jsonc   # Project metadata and hosting config
    │   ├── entities/      # Database entity schemas (JSONC)
    │   └── agents/        # AI assistant configuration
    ├── src/               # React application source
    │   ├── App.tsx        # Root component with routing
    │   ├── types.ts       # TypeScript type definitions
    │   ├── sdk-client/    # Base44 SDK initialization
    │   ├── components/    # Reusable UI components
    │   └── pages/         # Page components (auth, boards, profile)
    └── package.json       # Dependencies and scripts
```

## Quick Commands

All commands run from within the `trellix/` directory:

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

### Base44 CLI Commands

```bash
# Login to Base44
base44 login

# Link project (creates base44/.app.jsonc with credentials)
base44 link

# Push entity schemas to Base44
base44 entities push
```

## Tech Stack

- **Frontend:** React 18, TypeScript 5.2, Vite 5.3
- **Backend:** Base44 BaaS (handles auth, database, hosting)
- **Styling:** Plain CSS (no framework)
- **Package Manager:** npm

## Key Patterns

### Base44 SDK Usage

The SDK client is initialized in `src/sdk-client/base44-client.ts`:

```typescript
import { createClient } from '@base44/sdk';
export const base44 = createClient({ appId: import.meta.env.VITE_BASE44_APP_ID });
export const { Board, Task, Team, ... } = base44.entities;
```

### Entity Operations

```typescript
// CRUD operations on entities
await Board.list();
await Board.create({ name: 'Board', color: 'blue' });
await Board.filter({ name: 'Board' });
await Board.update(id, { name: 'New Name' });
await Board.delete(id);
```

### Authentication

```typescript
// Email/password auth
await base44.auth.register({ email, password });
await base44.auth.loginViaEmailPassword(email, password);
await base44.auth.verifyOtp({ email, otpCode });

// OAuth
base44.auth.loginWithProvider('google');

// User management
const user = await base44.auth.me();
await base44.auth.updateMe({ full_name: 'John' });
base44.auth.logout();
```

## Entity Schemas

Entities are defined in `trellix/base44/entities/` as JSONC files:

| Entity | Purpose |
|--------|---------|
| `board.jsonc` | Kanban boards (name, description, color) |
| `task.jsonc` | Tasks (title, status, priority, due_date, labels, board_id) |
| `team.jsonc` | Team workspaces |
| `team-member.jsonc` | Team membership with roles |
| `task-subscription.jsonc` | Notification subscriptions |
| `activity-log.jsonc` | Audit logging |

## Important Files

- `trellix/.env.local` - Contains `VITE_BASE44_APP_ID` (not in repo, must be created)
- `trellix/base44/.app.jsonc` - Generated credentials file (gitignored, contains secrets)
- `trellix/src/types.ts` - TypeScript type definitions for all entities

## Gotchas

1. **Environment file required:** The app needs `.env.local` with `VITE_BASE44_APP_ID` to run
2. **Base44 account required:** You need a Base44 account and must run `base44 link` before development
3. **Entity push required:** After cloning, run `base44 entities push` to set up the database
4. **No test suite:** This example app does not include tests

## Development Workflow

1. Make changes to React components in `src/`
2. For database schema changes, edit files in `base44/entities/` then run `base44 entities push`
3. Run `npm run lint` before committing
4. Run `npm run build` to verify the production build works
