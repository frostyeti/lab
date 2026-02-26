# PostHog

Open-source product analytics, session recording, and feature flag platform.

- **Source:** https://github.com/PostHog/posthog
- **License:** MIT (core), Enterprise (some features)
- **Author/Company:** PostHog Inc.
- **Language(s):** Python (Django), TypeScript (Node.js), Go
- **Docs:** https://posthog.com/docs

## Description

PostHog is an all-in-one open-source product analytics suite that can be self-hosted. It provides event capture, funnels, retention analysis, user paths, session recordings, feature flags, A/B testing, and a data warehouse. PostHog uses ClickHouse as its OLAP backend for fast analytical queries, Kafka for high-throughput event ingestion, and PostgreSQL for application metadata. The plugin server processes events in real time and handles integrations with third-party services.

## Docker Image Environment Variables

### `posthog/posthog` (web, worker, plugins)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `changeme-replace-with-50-char-secret-key` | Django secret key — **must be a long random string in production** |
| `DATABASE_URL` | `postgres://posthog:posthog@posthog-db:5432/posthog` | PostgreSQL connection URL |
| `REDIS_URL` | `redis://posthog-redis:6379/` | Redis connection URL |
| `CLICKHOUSE_HOST` | `posthog-clickhouse` | ClickHouse hostname |
| `CLICKHOUSE_DATABASE` | `posthog` | ClickHouse database name |
| `CLICKHOUSE_USER` | `default` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | _(unset)_ | ClickHouse password |
| `CLICKHOUSE_SECURE` | `false` | Use TLS for ClickHouse connection |
| `KAFKA_HOSTS` | `posthog-kafka:9092` | Kafka broker(s), comma-separated |
| `SITE_URL` | `http://posthog.local` | Public URL of the PostHog instance |
| `DISABLE_SECURE_SSL_REDIRECT` | `true` | Disable HTTP→HTTPS redirect (set to `false` behind a TLS proxy) |
| `IS_BEHIND_PROXY` | `true` | Trust `X-Forwarded-For` and `X-Forwarded-Proto` headers |
| `TRUST_ALL_PROXIES` | `true` | Trust all reverse proxy headers; narrow this in production |
| `POSTHOG_SKIP_ASYNC_MIGRATIONS_SETUP` | `0` | Skip automatic async migration setup (`0` = run, `1` = skip) |
| `EMAIL_HOST` | _(unset)_ | SMTP host for outbound email |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_HOST_USER` | _(unset)_ | SMTP username |
| `EMAIL_HOST_PASSWORD` | _(unset)_ | SMTP password |
| `EMAIL_USE_TLS` | `true` | Use TLS for SMTP |
| `DEFAULT_FROM_EMAIL` | `noreply@posthog.com` | From address for outbound email |
| `MULTI_TENANCY` | `false` | Enable multi-tenancy (hosted cloud mode) |
| `SELF_CAPTURE` | `false` | Capture PostHog's own usage into itself |
| `ASYNC_EVENT_ACTION_MAPPING` | `false` | Process action matching asynchronously |
| `STATSD_HOST` | _(unset)_ | StatsD host for internal metrics |

### `postgres` (posthog-db)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `posthog` | Database name |
| `POSTGRES_USER` | `posthog` | Database user |
| `POSTGRES_PASSWORD` | `posthog` | Database password |

### `bitnami/kafka` (posthog-kafka)

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_CFG_ZOOKEEPER_CONNECT` | `posthog-zookeeper:2181` | ZooKeeper connection string |
| `KAFKA_CFG_LISTENERS` | `PLAINTEXT://:9092` | Listener bindings inside the container |
| `KAFKA_CFG_ADVERTISED_LISTENERS` | `PLAINTEXT://posthog-kafka:9092` | Advertised addresses returned to clients |
| `ALLOW_PLAINTEXT_LISTENER` | `yes` | Allow unencrypted connections (acceptable for internal-only use) |

### `clickhouse/clickhouse-server` (posthog-clickhouse)

No environment variables set in the compose file; ClickHouse uses default credentials (`default` user, no password). Configure via `config.xml` / `users.xml` for hardened deployments.

### `zookeeper` (posthog-zookeeper)

No environment variables set; uses ZooKeeper defaults.

## Volumes

| Path | Purpose |
|------|---------|
| `data/posthog` | PostHog application data — uploaded assets (`/var/lib/posthog`) |
| `data/posthog-db` | PostgreSQL data directory |
| `data/posthog-redis` | Redis persistence |
| `data/posthog-clickhouse` | ClickHouse data and metadata (`/var/lib/clickhouse`) |
| `data/posthog-zookeeper` | ZooKeeper data directory |
| `data/posthog-kafka` | Kafka log segments (`/bitnami/kafka`) |
| `log/posthog-clickhouse` | ClickHouse server logs (`/var/log/clickhouse-server`) |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${POSTHOG_PORT:-8000}` | TCP (HTTP) | PostHog Web UI, REST API, and event ingestion endpoint |

## Operational Notes

- `SECRET_KEY` must be a cryptographically random string of at least 50 characters. Generate with `openssl rand -hex 32`. **Do not use the default.**
- First startup is slow (2–5 minutes) because PostHog runs Django database migrations and ClickHouse table setup. The `start_period: 120s` on the web healthcheck reflects this.
- ClickHouse requires the `nofile` ulimit to be raised to `262144` (set in the compose file). Ensure the Docker daemon and host also permit this limit.
- The `posthog-plugins` Node.js server is a separate container from the Python worker. Both must share the same `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `CLICKHOUSE_HOST`, and `KAFKA_HOSTS`.
- ZooKeeper is required by ClickHouse's Kafka table engine and ReplicatedMergeTree (even in single-node mode with this stack). Do not remove it.
- `DISABLE_SECURE_SSL_REDIRECT=true` and `IS_BEHIND_PROXY=true` are required when placing PostHog behind a reverse proxy. Set `TRUST_ALL_PROXIES=false` and specify trusted proxy CIDRs in production.
- `POSTHOG_SKIP_ASYNC_MIGRATIONS_SETUP=0` runs async ClickHouse migrations on startup. On first run this can take several minutes; subsequent restarts are fast.
- ClickHouse uses the `default` user with no password in this configuration — suitable for `vnet-backend` only. For production, set a password in ClickHouse `users.xml` and pass `CLICKHOUSE_USER`/`CLICKHOUSE_PASSWORD` to the PostHog containers.

## Latest Version

`posthog/posthog:latest`
