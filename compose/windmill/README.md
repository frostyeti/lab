# windmill

Open-source developer platform for building internal tools, scripts, and workflows.

- **Source:** https://github.com/windmill-labs/windmill
- **License:** AGPL-3.0
- **Author/Company:** Windmill Labs
- **Language(s):** Rust, TypeScript, Python, Go
- **Docs:** https://www.windmill.dev/docs/intro

## Description

Windmill is a self-hosted platform that turns scripts (Python, TypeScript, Go, Bash, SQL) into shareable workflows, schedulable jobs, and interactive internal apps with auto-generated UIs. It separates concerns into a server (API, UI, scheduler) and one or more workers (execution engines), enabling horizontal scaling. Workers can spin up Docker containers for job isolation, making it suitable for data pipelines, DevOps automation, and internal tooling that requires arbitrary code execution.

## Docker Image Environment Variables

### windmill-db (`postgres:16-alpine`)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `windmill` | Database superuser name |
| `POSTGRES_PASSWORD` | `windmill` | Database superuser password |
| `POSTGRES_DB` | `windmill` | Database name to create on startup |

### windmill-server (`ghcr.io/windmill-labs/windmill`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://windmill:windmill@windmill-db:5432/windmill?sslmode=disable` | Full PostgreSQL connection string |
| `MODE` | `server` | Container role: `server` serves the API and UI |
| `BASE_URL` | `http://windmill.local` | Public base URL — used for OAuth redirects, email links, and the UI |
| `JSON_FMT` | `true` | Emit structured JSON logs instead of human-readable text |
| `NUM_WORKERS` | `0` | Workers to run in-process (0 = server-only; workers handled by separate container) |
| `DISABLE_SERVER` | `false` | Disable HTTP server (used when running a worker-only instance) |
| `METRICS_ADDR` | _(unset)_ | Address to expose Prometheus metrics (e.g. `0.0.0.0:9001`) |
| `RUST_LOG` | `info` | Rust log filter (e.g. `windmill=debug`) |
| `LICENSE_KEY` | _(unset)_ | Windmill Enterprise Edition license key |

### windmill-worker (`ghcr.io/windmill-labs/windmill`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://windmill:windmill@windmill-db:5432/windmill?sslmode=disable` | Full PostgreSQL connection string |
| `MODE` | `worker` | Container role: `worker` pulls and executes jobs |
| `WORKER_GROUP` | `default` | Worker group name — used to route jobs to specific worker pools |
| `NUM_WORKERS` | `2` | Number of parallel job execution threads in this worker container |
| `DISABLE_SERVER` | `true` | Worker containers do not run the HTTP server |
| `INIT_SCRIPT` | _(unset)_ | Shell commands run once at worker startup (e.g. install packages) |
| `WORKER_TAGS` | _(unset)_ | Comma-separated tags this worker accepts (e.g. `deno,python3`) |
| `JSON_FMT` | `true` | Structured JSON logging |
| `RUST_LOG` | `info` | Rust log filter |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/windmill/server` → `/tmp/windmill/cache` | Server-side cache for compiled scripts and dependencies |
| `${MNT_DIR}/data/windmill/worker` → `/tmp/windmill` | Worker scratch space: job working directories, pip/npm caches |
| `/var/run/docker.sock` → `/var/run/docker.sock` (ro) | Allows workers to spin up Docker containers for job execution |
| `${MNT_DIR}/data/windmill/db` → `/var/lib/postgresql/data` | PostgreSQL data directory |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${WINDMILL_PORT:-8300}` → `8000` | TCP | Windmill web UI and REST API |

## Operational Notes

- **Docker socket:** The worker mounts `/var/run/docker.sock` read-only. This allows Windmill to run jobs inside per-job Docker containers for language isolation. Ensure the Docker socket is accessible and the container user has permission.
- **Worker scaling:** Add more worker containers (with unique `container_name` values and the same `DATABASE_URL`) to increase job throughput. Each worker independently polls the job queue.
- **Worker groups:** Set `WORKER_GROUP` to segregate workers by capability (e.g. `gpu`, `high-memory`). Scripts can be pinned to a worker group in the Windmill UI.
- **BASE_URL:** Must match the public URL used to access Windmill. OAuth integrations and email links break if this is incorrect.
- **Database password:** Change `WINDMILL_DB_PASSWORD` before production use. The full `DATABASE_URL` is constructed from the individual `WINDMILL_DB_*` variables.
- **First login:** Default credentials are `admin@windmill.dev` / `changeme`. Change the password immediately after first login.
- **Enterprise Edition:** Set `LICENSE_KEY` in the server environment to unlock EE features (SSO, SAML, audit logs, dedicated worker groups).
- **Cache persistence:** Pinning the server cache volume (`/tmp/windmill/cache`) avoids re-downloading language runtimes on every container restart.

## Latest Version

`ghcr.io/windmill-labs/windmill:main`
