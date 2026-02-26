# n8n

Extendable workflow automation tool with a visual node-based editor.

- **Source:** https://github.com/n8n-io/n8n
- **License:** Sustainable Use License (source-available)
- **Author/Company:** n8n GmbH
- **Language(s):** TypeScript
- **Docs:** https://docs.n8n.io/

## Description

n8n is a self-hostable workflow automation platform that lets you connect apps, APIs, and services using a visual node-based editor. It supports hundreds of pre-built integrations (Slack, GitHub, databases, HTTP, etc.) and allows writing custom logic in JavaScript or Python. Workflows can be triggered by webhooks, schedules, events, or manually, making it suitable for ETL pipelines, notification bots, data sync, and general-purpose automation.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_HOST` | `n8n.local` | Public hostname of this n8n instance — used in webhook URLs and the UI |
| `N8N_PORT` | `5678` | Internal HTTP port n8n listens on |
| `N8N_PROTOCOL` | `http` | Protocol for webhook and editor URLs: `http` or `https` |
| `WEBHOOK_URL` | `http://n8n.local/` | Full base URL for incoming webhooks — should match `N8N_PROTOCOL://N8N_HOST/` |
| `N8N_ENCRYPTION_KEY` | `changeme32charslongencryptionkey` | AES key used to encrypt stored credentials — **must be changed and kept stable** |
| `EXECUTIONS_DATA_PRUNE` | `true` | Delete old execution history automatically |
| `EXECUTIONS_DATA_MAX_AGE` | `168` | Hours of execution history to retain when pruning (168 = 7 days) |
| `DB_TYPE` | `postgresdb` | Database backend: `postgresdb`, `mysqldb`, or `sqlite` |
| `DB_POSTGRESDB_HOST` | `postgres` | PostgreSQL hostname |
| `DB_POSTGRESDB_PORT` | `5432` | PostgreSQL port |
| `DB_POSTGRESDB_DATABASE` | `n8n` | Database name |
| `DB_POSTGRESDB_USER` | `n8n` | Database user |
| `DB_POSTGRESDB_PASSWORD` | `n8n` | Database password |
| `N8N_BASIC_AUTH_ACTIVE` | `false` | Enable HTTP basic auth in front of the editor |
| `N8N_BASIC_AUTH_USER` | _(unset)_ | Basic auth username |
| `N8N_BASIC_AUTH_PASSWORD` | _(unset)_ | Basic auth password |
| `N8N_USER_MANAGEMENT_DISABLED` | `false` | Disable the built-in user/role management system |
| `N8N_DEFAULT_LOCALE` | `en` | UI locale (e.g. `de`, `fr`, `es`) |
| `N8N_METRICS` | `false` | Expose Prometheus metrics at `/metrics` |
| `N8N_LOG_LEVEL` | `info` | Log verbosity: `silent`, `error`, `warn`, `info`, `debug`, `verbose` |
| `N8N_LOG_OUTPUT` | `console` | Log destination: `console`, `file`, or `console,file` |
| `EXECUTIONS_PROCESS` | `main` | Execution mode: `main` (in-process) or `own` (subprocess per execution) |
| `QUEUE_BULL_REDIS_HOST` | _(unset)_ | Redis hostname for queue mode (multiple workers) |
| `N8N_EMAIL_MODE` | `smtp` | Email transport for user invites/resets |
| `N8N_SMTP_HOST` | _(unset)_ | SMTP server hostname |
| `N8N_SMTP_PORT` | `465` | SMTP port |
| `N8N_SMTP_USER` | _(unset)_ | SMTP username |
| `N8N_SMTP_PASS` | _(unset)_ | SMTP password |
| `N8N_SMTP_SENDER` | _(unset)_ | From address for system emails |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/n8n` → `/home/node/.n8n` | Persistent data: workflow definitions, credentials (encrypted), execution history, and user settings |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${N8N_PORT:-5678}` → `5678` | TCP | Web editor UI and webhook endpoint |

## Operational Notes

- **Encryption key stability:** `N8N_ENCRYPTION_KEY` is used to encrypt all stored credentials. If it changes, all stored credentials become unreadable. Set it once to a random 32+ character string and never change it.
- **Webhook URL:** `WEBHOOK_URL` must be publicly reachable if you use webhook triggers from external services. Set it to the actual public URL (e.g. `https://n8n.example.com/`).
- **External PostgreSQL:** This compose file points n8n at an external PostgreSQL instance (`N8N_DB_HOST`). Ensure the database and user exist before starting. To use the bundled SQLite instead, set `DB_TYPE=sqlite`.
- **User management:** n8n includes built-in multi-user support with owner/member roles. The first account created becomes the owner.
- **Queue mode:** For high-throughput workloads, switch to queue mode by adding a Redis service and setting `EXECUTIONS_PROCESS=queue` plus `QUEUE_BULL_REDIS_HOST`.
- **Execution pruning:** `EXECUTIONS_DATA_PRUNE=true` with `EXECUTIONS_DATA_MAX_AGE=168` keeps the database from growing unbounded. Adjust the age to suit your debugging needs.

## Latest Version

`n8nio/n8n:latest`
