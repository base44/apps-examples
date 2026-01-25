# Base44 Example Apps

This repository contains example apps built with [Base44](https://base44.com) Backend-as-a-Service. Use these examples to learn how Base44 Backend-as-a-Service works and as starting points for your own projects.

## Getting started

Follow these steps to run any example app locally.

> **Note:** Before you begin, make sure you have [Node.js](https://nodejs.org/) v18 or later, a Base44 account at [app.base44.com](https://app.base44.com), and the Base44 CLI installed globally: `npm install -g base44 --registry https://registry.npmjs.org`.

1. Clone this repository and navigate to it:

    ```bash
    cd apps-examples
    ```

2. Navigate to an example app. For example:

    ```bash
    cd trellix
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Log in to Base44:

    ```bash
    base44 login
    ```

    Follow the prompts to authenticate with your Base44 account.

5. Link the project:

    ```bash
    base44 link
    ```

    This command creates a new Base44 project and generates a `base44/.env.local` file containing your `BASE44_CLIENT_ID`.

6. Create the root environment file from the generated credentials:

    ```bash
    sed 's/BASE44_CLIENT_ID/VITE_BASE44_APP_ID/' base44/.env.local > .env.local
    ```

7. Push the entities:

    ```bash
    base44 entities push
    ```

    This uploads the entity schemas to your Base44 project.

8. Start the development server:

    ```bash
    npm run dev
    ```

    The app is now running at `http://localhost:5173/`.

## Available examples

| App | Description | Live demo |
| --- | --- | --- |
| [trellix](./trellix/) | A Trello-style task and project management app | [Try it](https://trellix-example-64ad1623.base44.app/) |

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/sdk)
