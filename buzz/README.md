# Buzz - AI Browser Sidekick

A Chrome extension powered by AI that helps you manage browser tabs and browse smarter.

## Getting started

> **Note:** Node.js 18+ and a [Base44 account](https://app.base44.com) are required. Commands use `npx` (no global CLI install).

1. From the repo root, go to the app and install dependencies:

   ```bash
   cd buzz
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

4. Push backend configuration (entities and agents):

   ```bash
   npx base44 entities push
   npx base44 agents push
   ```

5. Start development:

   ```bash
   npm run dev
   ```

   This builds the extension in watch mode, opens Chrome with it loaded, and hot-reloads on changes.

6. Optional: Manual extension loading:

   - Open `chrome://extensions` in Chrome
   - Enable **Developer mode**, click **Load unpacked**, and select `.output/chrome-mv3`
   - Open the Buzz icon in the toolbar to use the side panel

## Features

- **AI Chat**: Conversational assistant that understands your browser context.
- **Tab Management**: Close, group, focus, and organize tabs via chat or quick actions.
- **Page Reading**: Read and summarize the content of any page.
- **Quick Actions**: One-click screenshot, bookmark, share URL, close duplicates, and more.
- **Element Picker**: Select page elements to add to the AI context.

## Project structure

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
│           ├── components/         # React UI components
│           │   ├── index.ts        # Component exports
│           │   ├── Icons.tsx       # SVG icon components
│           │   ├── AuthScreen.tsx  # Authentication UI
│           │   └── MainApp.tsx     # Main chat interface
│           ├── hooks/              # Custom React hooks for state management
│           │   ├── index.ts        # Hook exports
│           │   ├── useBrowserContext.ts  # Browser tabs/groups state
│           │   └── useChat.ts      # AI conversation logic
│           ├── utils/              # Pure utility functions (no React)
│           │   ├── index.ts        # Utility exports
│           │   ├── actions.ts      # Parse & execute AI actions
│           │   ├── messages.ts     # Message formatting helpers
│           │   └── quickActions.ts # One-click tool actions
│           └── types/               # TypeScript type definitions
│               └── index.ts        # TypeScript interfaces
├── base44/                         # Backend configuration
│   ├── config.jsonc                # Project settings
│   ├── agents/
│   │   └── assistant.jsonc         # AI agent instructions
│   └── entities/
│       └── saved-session.jsonc     # Data schemas
├── public/                         # Static assets (icons)
├── wxt.config.ts                   # WXT configuration
├── tailwind.config.ts              # Tailwind configuration
└── package.json
```

## Base44 integration

How this app connects to Base44: SDK setup, agents, and config. Buzz uses [Base44](https://base44.com) for:

- **Authentication**: Email/password auth with OTP verification.
- **AI agent**: Conversational assistant; conversations and messages via the agents API.
- **Data**: Saved-session entity for session state (see `base44/entities/saved-session.jsonc`).

## Tech stack

- **[WXT](https://wxt.dev)**: Browser extension framework.
- **[React](https://react.dev)**: UI library.
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe JavaScript.
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first CSS.
- **[Base44](https://base44.com)**: Backend (auth, agents, entities).

## Scripts

npm commands you can run from the project root:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development with hot reload (Chrome; output in `.output/chrome-mv3/`) |
| `npm run dev:firefox` | Start development for Firefox |
| `npm run build` | Build for production (Chrome) |
| `npm run build:firefox` | Build for production (Firefox) |
| `npm run zip` | Build and create ZIP for distribution |
| `npm run zip:firefox` | Build and create ZIP for Firefox |

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

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
