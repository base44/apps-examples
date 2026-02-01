# Trellix - AI Agent Guide

This file provides detailed guidance for AI assistants working with this Trellix app.

## Project Overview

Trellix is a Trello-style task management app built with React and Base44 Backend-as-a-Service (BaaS).

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check and build for production
npm run lint         # Lint the codebase
```

### Base44 CLI

```bash
base44 login              # Login to Base44
base44 link               # Link project (creates base44/.app.jsonc)
base44 entities push      # Push entity schemas to Base44
```

## Project Structure

```
trellix/
├── base44/                # Base44 BaaS configuration
│   ├── config.jsonc       # Project metadata and hosting
│   ├── entities/          # Database entity schemas (JSONC)
│   └── agents/            # AI assistant configuration (Trix)
├── src/
│   ├── App.tsx            # Root component with routing
│   ├── types.ts           # TypeScript type definitions
│   ├── sdk-client/        # Base44 SDK initialization
│   ├── components/        # Reusable UI components
│   └── pages/             # Page components
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `base44/entities/*.jsonc` | Database schema definitions |
| `base44/agents/assistant.jsonc` | Trix AI assistant config |
| `src/sdk-client/base44-client.ts` | SDK client initialization |
| `src/types.ts` | TypeScript types for all entities |
| `.env.local` | Contains `VITE_BASE44_APP_ID` (must create) |

## Entities

| Entity | Purpose |
|--------|---------|
| Board | Kanban boards (name, description, color) |
| Task | Tasks (title, status, priority, due_date, labels, board_id) |
| Team | Team workspaces |
| TeamMember | Team membership with roles |
| TaskSubscription | Notification subscriptions |
| ActivityLog | Audit logging |

## Gotchas

1. **Environment file required:** Create `.env.local` with `VITE_BASE44_APP_ID`
2. **Base44 account required:** Run `base44 link` before development
3. **Entity push required:** Run `base44 entities push` after cloning
4. **No test suite:** This example app does not include tests
