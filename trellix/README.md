# Trellix - Task and Project Manager

A Trello-style task and project management app powered by the [Base44](https://base44.com) backend.

🔗 **[View Live Demo](https://trellix-example-64ad1623.base44.app/)**

## Get Started

> **Note:** Node.js 20.19.0 or higher and a [Base44 account](https://app.base44.com) are required. Commands use `npx` with no global CLI install.

1. From the repo root, go to the app and install dependencies.

   ```bash
   cd trellix
   npm install
   ```

2. Log in and link the project.

   ```bash
   npx base44 login
   npx base44 link
   ```

   This links your local project to a new or existing Base44 project. The command creates `base44/.app.jsonc` with your app ID. That file isn't in the repo. It's created when you run link.

3. Create the app's `.env.local` from the app ID that link wrote to `base44/.app.jsonc`.

   ```bash
   echo "VITE_BASE44_APP_ID=$(grep '"id"' base44/.app.jsonc | cut -d'"' -f4)" > .env.local
   ```

4. Push entities and start the dev server.

   ```bash
   npx base44 entities push
   npm run dev
   ```

   The app runs at **http://localhost:5173/**.

## Features

- **Boards**: Create and manage Kanban boards with custom colors.
- **Tasks**: Add tasks with status, priority, due dates, and labels.
- **Teams**: Collaborative workspaces with roles: admin, member, viewer.
- **Authentication**: Email/password with OTP and Google OAuth.
- **AI assistant**: In-app assistant when configured.

## Project structure

```
trellix/
├── base44/                    # Base44 backend configuration
│   ├── config.jsonc           # Project configuration
│   ├── agents/                # AI agent instructions (optional)
│   └── entities/              # JSONC schemas (DB + typed SDK)
│       ├── board.jsonc         # Kanban boards: name, description, color
│       ├── task.jsonc          # Tasks: title, status, priority, due date, labels
│       ├── team.jsonc          # Teams for collaborative workspaces
│       ├── team-member.jsonc   # Membership with roles (admin/member/viewer)
│       ├── task-subscription.jsonc  # Task notification subscriptions
│       └── activity-log.jsonc  # Audit log for task actions
├── src/
│   ├── App.tsx                # Root component with routing
│   ├── App.css                # Global styles
│   ├── types.ts               # TypeScript type definitions
│   ├── sdk-client/            # Base44 SDK client
│   │   └── base44-client.ts   # createClient + entity exports
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
- **[Base44](https://base44.com)**: Backend for auth and data.
- **[CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)**: Custom styles with no framework.

## Available commands

Run these npm commands from the project root.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:5173`. |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Preview production build locally. |
| `npm run lint` | Run ESLint. |

## Base44 integration

How this app connects to Base44. SDK setup, entities, and config. Trellix uses [Base44](https://base44.com) for the following.

- **[Authentication](https://docs.base44.com/developers/references/sdk/docs/interfaces/auth)**: Email/password auth with OTP verification.
- **[Database](https://docs.base44.com/developers/backend/resources/entities/overview)**: Entity-based data storage with CRUD operations.

## Troubleshooting

Possible issues and how to fix them.

### App won't start or shows a blank page

1. Make sure you've created `.env.local` with `VITE_BASE44_APP_ID` in step 3 of Get Started.
2. Run `npm run dev` from the `trellix` folder and check the terminal for errors.
3. Confirm Node.js is v20.19.0 or higher: `node -v`.

### API or login errors

1. Ensure you're logged in by running `npx base44 whoami`.
2. Verify the project is linked by checking that `base44/.app.jsonc` exists and contains your app ID.
3. Push entities again with `npx base44 entities push`.

### Build fails

Run `npm run lint` to check for type or lint errors. Fix any reported issues and try `npm run build` again.

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/developers/references/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
