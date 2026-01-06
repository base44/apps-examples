# Trellix

Example task management app built on the Base44 Backend-as-a-Service platform.

All backend resources and configurations are in the `base44/` directory which is a standalone Backend as a Service project that is **decoupled from any client project**.. The rest (client, UI) is optional.

## Structure

```
base44/
├── config.jsonc        # Project config (name, project settings, hosting settings)
├── entities/           # Database schemas
├── functions/          # Deno edge functions
└── agents/             # AI agent configurations
```

## Resources

| Directory | Purpose |
|-----------|---------|
| `entities/` | JSON schemas defining data models. Each `.jsonc` file = one collection. |
| `functions/` | Deno functions with `function.jsonc` config (triggers: event, schedule, http). |
| `agents/` | AI agent definitions with entity permissions and prompts. |

## Standalone

The `base44/` directory is fully independent. The parent project (Vite, Next, etc.) is optional and only relevant if using the **hosting** feature in `config.jsonc`.

## CLI

All resources are managed via the Base44 CLI

```bash
base44 login              # Authenticate
base44 deploy             # Deploy backend + hosting
base44 entities pull      # Sync schemas from remote
base44 entities push      # Push local schemas
base44 functions          # List functions
...
```

## Config Format

All config files use `.jsonc` (JSON with Comments) for inline documentation.
