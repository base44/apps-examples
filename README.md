# Base44 Example Apps

This repository contains example apps built with the [Base44](https://base44.com) backend. Use these examples to learn how Base44 works and as starting points for your own projects.

## Get started

You need [Node.js](https://nodejs.org/) v20.19.0 or higher and a [Base44 account](https://app.base44.com). Clone this repository, then open an app's folder and follow the **Get started** section in that app's README.

| App | Description | Technologies | Live demo |
| --- | --- | --- | --- |
| [Trellix](./trellix/) | Trello-style task and project management. | React, Vite | [Trellix live demo](https://trellix-example-64ad1623.base44.app/). |
| [Buzz](./buzz/) | AI browser sidekick extension for Chrome and Firefox. | WXT, React | N/A |
| [Base44 Estates](./fullstack-react-router/) | Real-estate agency site: public SSR listings with edge caching, RLS-protected inquiries and favorites, an AI concierge. | React Router 7 (SSR), full-stack hosting | N/A |
| [Base44 CRM](./fullstack-tanstack-start/) | Private team sales CRM: owner-scoped RLS, pipeline kanban, SSR dashboards, an AI sales copilot. | TanStack Start (SSR), full-stack hosting | N/A |
| [Meridian](./fullstack-astro/) | Coffee-roaster storefront: edge-cached catalog, dynamic product pages, authenticated checkout and orders, an AI shopping concierge. | Astro 6 (SSR), full-stack hosting | N/A |

> **Full-stack hosting (preview).** The three `fullstack-*` apps run their server code on Base44 full-stack hosting and pin preview builds of the SDK and CLI via npm aliases (`@base44-preview/sdk`, `@base44-preview/cli`) in their `package.json`. They move to `@base44/sdk` and `base44` at GA. See each app's README for what it showcases (SSR edge caching, RLS, agents).

## See also

- [Base44 Documentation](https://docs.base44.com)
- [Base44 SDK Reference](https://docs.base44.com/developers/references/sdk)
- [Base44 CLI Overview](https://docs.base44.com/developers/references/cli/get-started/overview)

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT).
