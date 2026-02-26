# Kestra

Open-source orchestration and scheduling platform for data pipelines and workflows.

- **Source:** https://github.com/kestra-io/kestra
- **License:** Apache 2.0
- **Author/Company:** Kestra Technologies
- **Language(s):** Java, TypeScript
- **Docs:** https://kestra.io/docs

## Description

Kestra is a declarative workflow orchestration platform that lets you define pipelines as YAML files and run them on a schedule or trigger. It supports hundreds of plugins for databases, cloud providers, messaging systems, and scripting languages. Kestra's standalone mode bundles the scheduler, executor, worker, and web UI into a single process, making it suitable for self-hosted homelab deployments.

## Docker Image Environment Variables

### `kestra/kestra`

Kestra is configured via the `KESTRA_CONFIGURATION` environment variable containing an inline YAML block. The compose file sets the full configuration there; individual settings below are the most commonly adjusted keys within that block.

| Variable | Default (compose) | Description |
|----------|-------------------|-------------|
| `KESTRA_CONFIGURATION` | _(inline YAML)_ | Full server configuration as a YAML string; overrides any config file |
| `datasources.postgres.url` | `jdbc:postgresql://kestra-db:5432/kestra` | JDBC URL for the PostgreSQL backend |
| `datasources.postgres.username` | `kestra` | PostgreSQL username |
| `datasources.postgres.password` | `kestra` | PostgreSQL password |
| `kestra.server.basic-auth.enabled` | `false` | Enable HTTP Basic Auth on the UI/API |
| `kestra.server.basic-auth.username` | _(unset)_ | Basic auth username (required when enabled) |
| `kestra.server.basic-auth.password` | _(unset)_ | Basic auth password (required when enabled) |
| `kestra.repository.type` | `postgres` | Repository backend (`postgres`, `elasticsearch`) |
| `kestra.storage.type` | `local` | Storage backend (`local`, `s3`, `gcs`, `azure`) |
| `kestra.storage.local.base-path` | `/app/storage` | Base path for local storage backend |
| `kestra.queue.type` | `postgres` | Queue backend (`postgres`, `kafka`) |
| `kestra.tasks.tmp-dir.path` | `/tmp/kestra-wd/tmp` | Temp directory used by script tasks |
| `JAVA_OPTS` | _(unset)_ | Extra JVM options (e.g. `-Xmx4g` to increase heap) |
| `KESTRA_PLUGINS` | _(unset)_ | Comma-separated list of extra plugin JARs to install at startup |

### `postgres` (kestra-db)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `kestra` | Database user |
| `POSTGRES_PASSWORD` | `kestra` | Database password |
| `POSTGRES_DB` | `kestra` | Database name |

## Volumes

| Path | Purpose |
|------|---------|
| `data/kestra/storage` | Persistent storage for flow inputs, outputs, and internal state |
| `data/kestra/db` | PostgreSQL data directory |
| `/var/run/docker.sock` (ro) | Allows Kestra to launch Docker-based task workers on the host |
| `/tmp/kestra-wd` | Shared working directory between Kestra and Docker task containers |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${KESTRA_PORT:-8080}` | TCP (HTTP) | Kestra Web UI and REST API |
| `8081` | TCP (HTTP) | Health check endpoint (`/health`) |

## Operational Notes

- The Docker socket is mounted read-only so Kestra can spin up per-task containers. The Kestra process must be able to reach the socket; on Linux hosts this typically requires adding the container user to the `docker` group or running as root.
- `/tmp/kestra-wd` must exist on the host and be writable. Script task containers are launched with this directory bind-mounted so data can be passed between steps.
- `kestra.server.basic-auth.enabled` is `false` by default — enable it and set credentials before exposing the UI to any network.
- The `server standalone` command runs all Kestra components (scheduler, executor, worker, webserver) in a single process. For production scale-out, replace with separate `server scheduler`, `server executor`, and `server worker` containers.
- Kestra performs database migrations on every startup; first boot against a fresh database may be slow.
- To install additional plugins (e.g. `kestra-plugin-scripts-python`), set `KESTRA_PLUGINS` or add them to the plugin registry in the configuration YAML.

## Latest Version

`kestra/kestra:latest`
