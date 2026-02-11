# Buzz - AI Browser Sidekick

An AI-powered browser extension for Chrome and Firefox. It helps you manage browser tabs and browse smarter. It is built with [WXT](https://wxt.dev).

## Get started

> **Note:** Node.js v20.19.0 or higher and a [Base44 account](https://app.base44.com) are required.

1. Install the Base44 CLI globally.

   ```bash
   npm install -g base44
   ```

2. From the repo root, go to the app and install its dependencies.

   ```bash
   cd buzz
   npm install
   ```

3. Log in and link the project.

   ```bash
   base44 login
   base44 link
   ```

   This links your local project to a new or existing Base44 project. The command creates `base44/.app.jsonc` with your app ID.

4. Create the app's `.env.local` from the app ID that link wrote to `base44/.app.jsonc`.

   ```bash
   echo "VITE_BASE44_APP_ID=$(grep '"id"' base44/.app.jsonc | cut -d'"' -f4)" > .env.local
   ```

5. Push your local entities and agents to Base44.

   ```bash
   base44 deploy
   ```

6. Start development.

   - **Chrome:** `npm run dev`
   - **Firefox:** `npm run dev:firefox`

   This builds the extension in watch mode, opens the browser with it loaded, and hot-reloads on changes.

7. Optional: Manual extension loading.

   - **Chrome:** Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `.output/chrome-mv3`.
   - **Firefox:** Open `about:debugging`, click **This Firefox**, **Load Temporary Add-on**, and select a file in `.output/firefox-mv2`.
   - Open the Buzz icon in the toolbar to use the side panel.

## Features

- **AI Chat**: Conversation UI in the side panel, powered by a [Base44 AI agent](https://docs.base44.com/developers/backend/resources/agents-config) that understands your browser context. AI actions you can run via chat:
  - `close_tabs`: Close specific tabs by ID.
  - `group_tabs`: Group tabs with a name and color.
  - `open_url`: Open a URL in a new tab.
  - `focus_tab`: Switch to a specific tab.
  - `read_page`: Read the current page's content.
- **Quick Actions**: One-click tools in the side panel without chat:
  - Screenshot: Capture visible tab.
  - Bookmark: Bookmark current tab.
  - Share: Copy URL to clipboard.
  - Close Duplicates: Remove duplicate tabs.
  - Select Element: Pick a page element for context.
  - Read Page: Load page content for AI analysis.
- **Tab Management**: Close, group, focus, and organize tabs via chat or quick actions.
- **Page Reading**: Read and summarize the content of any page.
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

## Tech stack

- **[Base44](https://base44.com)**: Backend for auth, agents, and entities.
- **[WXT](https://wxt.dev)**: Browser extension framework.
- **[React](https://react.dev)**: UI library.
- **[TypeScript](https://www.typescriptlang.org)**: Type-safe JavaScript.
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first CSS.

## Available commands

Run these npm commands from the project root.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development for Chrome. Output in `.output/chrome-mv3/`. |
| `npm run dev:firefox` | Start development for Firefox. Output in `.output/firefox-mv2/`. |
| `npm run build` | Build for production for Chrome. |
| `npm run build:firefox` | Build for production for Firefox. |
| `npm run zip` | Build and create ZIP for Chrome. |
| `npm run zip:firefox` | Build and create ZIP for Firefox. |

## Base44 integration

Buzz uses [Base44](https://base44.com) for SDK setup, agents, and config:

- **[Authentication](https://docs.base44.com/developers/references/sdk/docs/interfaces/auth)**: Email/password auth with OTP verification.
- **[AI agent](https://docs.base44.com/developers/backend/resources/agents-config)**: Conversational assistant for conversations and messages.
- **[Data](https://docs.base44.com/developers/backend/resources/entities/overview)**: Saved-session entity for session state.

## Troubleshooting

Here are possible issues and how to fix them.

### Extension not loading

1. Make sure you've run `npm run build` or `npm run dev`.
2. Check that you're loading from `.output/chrome-mv3`, not `src/`.
3. Check the Chrome extensions page for errors.

### API errors

1. Ensure you're logged in by running `base44 whoami`.
2. Verify the project is linked by checking that `base44/.app.jsonc` exists and contains your app ID.
3. Push the latest configs with `base44 deploy`.

For WXT-specific issues like hot reload, see the [WXT documentation](https://wxt.dev).

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/developers/references/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)
