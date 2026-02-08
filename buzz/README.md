# Buzz - AI Browser Sidekick

A Chrome extension powered by AI that helps you manage browser tabs and browse smarter. Built with [WXT](https://wxt.dev), React, TypeScript, and [Base44](https://base44.com).

## Features

- **AI Chat** - Conversational assistant that understands your browser context
- **Tab Management** - Close, group, focus, and organize tabs via chat or quick actions
- **Page Reading** - Read and summarize the content of any page
- **Quick Actions** - One-click screenshot, bookmark, share URL, close duplicates, and more
- **Element Picker** - Select page elements to add to the AI context

## Tech Stack

- **[WXT](https://wxt.dev)** - Next-gen browser extension framework
- **[React](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS
- **[Base44](https://base44.com)** - Backend platform (auth, agents, entities)

## Project Structure

```
buzz/
├── src/
│   ├── api/
│   │   └── base44Client.ts         # Base44 SDK client
│   └── entrypoints/
│       ├── background.ts           # Service worker
│       ├── content.ts              # Content script (element picker)
│       └── sidepanel/
│           ├── App.tsx             # Main React app (auth wrapper)
│           ├── index.css           # Styles
│           ├── index.html          # HTML template
│           ├── main.tsx            # React entry point
│           ├── components/
│           │   ├── index.ts        # Component exports
│           │   ├── Icons.tsx       # SVG icon components
│           │   ├── AuthScreen.tsx  # Authentication UI
│           │   └── MainApp.tsx     # Main chat interface
│           ├── hooks/
│           │   ├── index.ts        # Hook exports
│           │   ├── useBrowserContext.ts  # Browser tabs/groups state
│           │   └── useChat.ts      # AI conversation logic
│           ├── utils/
│           │   ├── index.ts        # Utility exports
│           │   ├── actions.ts      # Parse & execute AI actions
│           │   ├── messages.ts     # Message formatting helpers
│           │   └── quickActions.ts # One-click tool actions
│           └── types/
│               └── index.ts        # TypeScript interfaces
├── base44/                         # Backend configuration
│   ├── config.jsonc                # Project settings
│   ├── agents/
│   │   └── assistant.jsonc         # AI agent instructions
│   ├── entities/
│   │   └── saved-session.jsonc     # Data schemas
│   └── functions/                  # Serverless functions
├── public/                         # Static assets (icons)
├── wxt.config.ts                   # WXT configuration
├── tailwind.config.ts              # Tailwind configuration
└── package.json
```

### Code Organization

| Directory | Purpose |
|-----------|---------|
| `components/` | React UI components |
| `hooks/` | Custom React hooks for state management |
| `utils/` | Pure utility functions (no React) |
| `types/` | TypeScript type definitions |

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- npm, yarn, or pnpm
- A [Base44](https://base44.com) account

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd buzz
npm install
```

### 2. Link to Base44

Login to your Base44 account and link the project:

```bash
npx base44 login
npx base44 link
```

### 3. Push Backend Configuration

Deploy the agent and entity configurations to Base44:

```bash
npx base44 entities push
npx base44 agents push
npx base44 functions deploy
```

### 4. Start Development

```bash
npm run dev
```

This will:

- Build the extension in watch mode
- Automatically open Chrome with the extension loaded
- Hot reload on file changes

### 5. Manual Extension Loading (if needed)

If the extension doesn't auto-load:

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3` folder
5. Click the Buzz icon in the toolbar to open the side panel

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development with hot reload |
| `npm run dev:firefox` | Start development for Firefox |
| `npm run build` | Build for production (Chrome) |
| `npm run build:firefox` | Build for production (Firefox) |
| `npm run zip` | Build and create ZIP for distribution |
| `npm run zip:firefox` | Build and create ZIP for Firefox |

## Build Output

- **Chrome**: `.output/chrome-mv3/`
- **Firefox**: `.output/firefox-mv3/`

## AI Actions

Buzz can execute these actions via chat:

| Action | Description |
|--------|-------------|
| `close_tabs` | Close specific tabs by ID |
| `group_tabs` | Group tabs with a name and color |
| `open_url` | Open a URL in a new tab |
| `focus_tab` | Switch to a specific tab |
| `read_page` | Read the current page's content |

## Quick Action Tools

| Tool | Description |
|------|-------------|
| Screenshot | Capture visible tab |
| Bookmark | Bookmark current tab |
| Share | Copy URL to clipboard |
| Close Duplicates | Remove duplicate tabs |
| Select Element | Pick a page element for context |
| Read Page | Load page content for AI analysis |

## Base44 CLI Commands

```bash
npx base44 login            # Authenticate with Base44
npx base44 link             # Link to an existing project
npx base44 entities push    # Push entity schemas
npx base44 agents push      # Push agent configurations
npx base44 functions deploy # Deploy serverless functions
```

## Troubleshooting

### Extension not loading?

1. Make sure you've run `npm run build` or `npm run dev`
2. Check that you're loading from `.output/chrome-mv3` (not `src/`)
3. Check the Chrome extensions page for errors

### API errors?

1. Ensure you're logged in: `npx base44 whoami`
2. Verify the project is linked: check `base44/config.jsonc` for `appId`
3. Push the latest configs: `npx base44 agents push`

### Hot reload not working?

WXT's HMR works for most changes. If changes aren't reflecting:
1. Try refreshing the extension in `chrome://extensions`
2. Close and reopen the side panel

## License

MIT
