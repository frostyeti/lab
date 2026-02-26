# Temporal

Durable workflow orchestration engine for building reliable distributed applications.

- **Source:** https://github.com/temporalio/temporal
- **License:** MIT
- **Author/Company:** Temporal Technologies
- **Language(s):** Go
- **Docs:** https://docs.temporal.io

## Description

Temporal is a durable execution platform that makes it easy to build and operate resilient applications. It provides workflow orchestration with built-in retry logic, timeouts, and state persistence so application code survives process crashes, network partitions, and infrastructure failures. Temporal is widely used for long-running business processes, saga patterns, and distributed transaction coordination.

## Docker Image Environment Variables

### `temporalio/auto-setup`

| Variable | Default | Description |
|----------|---------|-------------|
| `DB` | `postgres12` | Database driver to use (`postgres12`, `postgres`, `cassandra`, `sqlite`) |
| `DB_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `temporal` | PostgreSQL username |
| `POSTGRES_PWD` | `temporal` | PostgreSQL password |
| `POSTGRES_SEEDS` | `temporal-db` | PostgreSQL hostname(s), comma-separated |
| `POSTGRES_TLS_ENABLED` | _(unset)_ | Enable TLS for PostgreSQL connection |
| `DYNAMIC_CONFIG_FILE_PATH` | `config/dynamicconfig/development-sql.yaml` | Path to dynamic config file inside container |
| `TEMPORAL_ADDRESS` | `0.0.0.0:7233` | Address the server listens on |
| `NUM_HISTORY_SHARDS` | `512` | Number of history shards; must be stable after first run |
| `SKIP_SCHEMA_SETUP` | _(unset)_ | Set to `true` to skip automatic schema migrations on startup |
| `SKIP_ADD_CUSTOM_SEARCH_ATTRIBUTES` | _(unset)_ | Set to `true` to skip adding default search attributes |
| `TEMPORAL_CLI_ADDRESS` | `localhost:7233` | Address used by the bundled `tctl` health check |

### `temporalio/ui`

| Variable | Default | Description |
|----------|---------|-------------|
| `TEMPORAL_ADDRESS` | `temporal:7233` | Temporal server gRPC address |
| `TEMPORAL_CORS_ORIGINS` | `http://localhost:8233` | Allowed CORS origins for the UI (comma-separated) |
| `TEMPORAL_UI_PORT` | `8080` | Port the UI HTTP server listens on inside the container |
| `TEMPORAL_OPEN_API_ENABLED` | _(unset)_ | Enable OpenAPI explorer at `/openapi` |
| `TEMPORAL_TLS_CA_PATH` | _(unset)_ | Path to CA certificate for TLS to server |
| `TEMPORAL_AUTH_ENABLED` | _(unset)_ | Enable SSO / OIDC authentication |
| `TEMPORAL_AUTH_PROVIDER_URL` | _(unset)_ | OIDC provider discovery URL |
| `TEMPORAL_AUTH_CLIENT_ID` | _(unset)_ | OIDC client ID |
| `TEMPORAL_AUTH_CLIENT_SECRET` | _(unset)_ | OIDC client secret |

### `postgres` (temporal-db)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `temporal` | Database superuser name |
| `POSTGRES_PASSWORD` | `temporal` | Database superuser password |
| `POSTGRES_DB` | `temporal` | Default database created on first start |

## Volumes

| Path | Purpose |
|------|---------|
| `etc/temporal` | Dynamic config directory mounted into the server at `/etc/temporal/config/dynamicconfig` |
| `data/temporal/db` | PostgreSQL data directory — persistent workflow and history storage |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${TEMPORAL_PORT:-7233}` | TCP (gRPC) | Temporal server — SDK/worker/client connections |
| `${TEMPORAL_UI_PORT:-8233}` | TCP (HTTP) | Temporal Web UI |

## Operational Notes

- `NUM_HISTORY_SHARDS` defaults to `512` in the auto-setup image. **This value must never change** after the first run — altering it requires a full database wipe and re-bootstrap.
- The `auto-setup` image runs schema migrations automatically on startup. On first boot against a fresh database this can take 30–60 seconds before the gRPC port is ready.
- `DYNAMIC_CONFIG_FILE_PATH` points to a file inside the mounted `etc/temporal` directory. Scaffold a minimal `development-sql.yaml` there before first run, or the server will error. An empty YAML file (`{}`) is sufficient to start.
- `POSTGRES_PWD` (not `POSTGRES_PASSWORD`) is the environment variable read by the Temporal server image for the PostgreSQL password.
- The UI's `TEMPORAL_CORS_ORIGINS` must include the public URL when accessed through a reverse proxy.
- Change `SECRET_KEY` / admin credentials before exposing to any network.

## Latest Version

`temporalio/auto-setup:latest` / `temporalio/ui:latest`
