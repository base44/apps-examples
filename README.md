# Base44 Example Apps

This repository contains example apps built with [Base44](https://base44.com). Use these examples to learn how Base44 works and as starting points for your own projects.

## Prerequisites

Before you begin, make sure you have:

- [Node.js](https://nodejs.org/) v18 or later
- A Base44 account at [app.base44.com](https://app.base44.com)
- The Base44 CLI installed globally:

```bash
npm install -g base44 --registry https://registry.npmjs.org
```

## Getting started

Follow these steps to run any example app locally.

### Clone the repository

```bash
git clone <repository-url>
cd apps-examples
```

### Navigate to an example

```bash
cd trellix
```

### Install dependencies

```bash
npm install
```

### Log in to Base44

```bash
base44 login
```

Follow the prompts to authenticate with your Base44 account.

### Link the project

```bash
base44 link
```

This command creates a new Base44 project and generates a `base44/.env.local` file containing your `BASE44_CLIENT_ID`.

### Create the root environment file

Copy the `BASE44_CLIENT_ID` value from `base44/.env.local` and create a `.env.local` file in the project root:

```bash
# View the generated ID
cat base44/.env.local

# Create the root .env.local file
echo "VITE_BASE44_APP_ID=<your-BASE44_CLIENT_ID>" > .env.local
```

### Push the entities

```bash
base44 entities push
```

This uploads the entity schemas to your Base44 project.

### Start the development server

```bash
npm run dev
```

The app is now running at `http://localhost:5173/`.

## Available examples

| Example | Description |
|---------|-------------|
| [trellix](./trellix/) | A Trello-style task and project management app |

## Project structure

Each example follows a similar structure:

```
example-app/
├── base44/
│   ├── config.jsonc       # Project configuration
│   ├── entities/          # Entity schema definitions
│   └── .env.local         # Generated credentials (not committed)
├── src/                   # App source code
├── .env.local             # App ID for Vite (not committed)
└── package.json
```

## Learn more

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/sdk)
