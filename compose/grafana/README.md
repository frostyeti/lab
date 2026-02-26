# Grafana

Open-source observability and data visualization platform for metrics, logs, and traces.

- **Source:** https://github.com/grafana/grafana
- **License:** AGPL-3.0
- **Author/Company:** Grafana Labs
- **Language(s):** Go, TypeScript
- **Docs:** https://grafana.com/docs/grafana/latest/

## Description

Grafana is the leading open-source platform for building observability dashboards. It connects to dozens of data sources — Prometheus, Loki, InfluxDB, PostgreSQL, Elasticsearch, and many more — and allows users to build rich, interactive dashboards and set up alerting rules. Grafana also serves as the frontend for the LGTM stack (Loki, Grafana, Tempo, Mimir) and integrates with Grafana OnCall and Grafana Incident for end-to-end incident management.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GF_SERVER_ROOT_URL` | `http://grafana.local` | Public URL used in links, alerts, and OAuth redirects |
| `GF_SECURITY_ADMIN_USER` | `admin` | Initial admin username |
| `GF_SECURITY_ADMIN_PASSWORD` | `changeme` | Initial admin password — **change before first exposure to any network** |
| `GF_USERS_ALLOW_SIGN_UP` | `false` | Whether anonymous users can self-register |
| `GF_ANALYTICS_REPORTING_ENABLED` | `false` | Send anonymous usage stats to Grafana Labs |
| `GF_ANALYTICS_CHECK_FOR_UPDATES` | `false` | Check for Grafana updates on the login screen |
| `GF_INSTALL_PLUGINS` | _(empty)_ | Comma-separated list of plugins to install at startup (e.g. `grafana-clock-panel,grafana-piechart-panel`) |
| `GF_SERVER_HTTP_PORT` | `3000` | HTTP port the server listens on inside the container |
| `GF_DATABASE_TYPE` | `sqlite3` | Database backend (`sqlite3`, `mysql`, `postgres`) |
| `GF_DATABASE_HOST` | _(unset)_ | Database host:port when using MySQL or PostgreSQL |
| `GF_DATABASE_NAME` | `grafana` | Database name |
| `GF_DATABASE_USER` | _(unset)_ | Database user |
| `GF_DATABASE_PASSWORD` | _(unset)_ | Database password |
| `GF_SESSION_PROVIDER` | `file` | Session store (`file`, `memory`, `redis`, `mysql`, `postgres`) |
| `GF_AUTH_ANONYMOUS_ENABLED` | `false` | Allow unauthenticated read-only access |
| `GF_AUTH_ANONYMOUS_ORG_ROLE` | `Viewer` | Role assigned to anonymous users |
| `GF_AUTH_GENERIC_OAUTH_ENABLED` | `false` | Enable Generic OAuth / OIDC authentication |
| `GF_SMTP_ENABLED` | `false` | Enable outbound email for alerts and invites |
| `GF_SMTP_HOST` | _(unset)_ | SMTP host:port (e.g. `smtp.example.com:587`) |
| `GF_SMTP_USER` | _(unset)_ | SMTP username |
| `GF_SMTP_PASSWORD` | _(unset)_ | SMTP password |
| `GF_SMTP_FROM_ADDRESS` | `admin@grafana.localhost` | From address for outbound email |
| `GF_LOG_LEVEL` | `info` | Log verbosity (`debug`, `info`, `warn`, `error`, `critical`) |
| `GF_PATHS_DATA` | `/var/lib/grafana` | Root data directory inside the container |
| `GF_PATHS_PROVISIONING` | `/etc/grafana/provisioning` | Provisioning directory for dashboards and data sources |

## Volumes

| Path | Purpose |
|------|---------|
| `data/grafana` | Persistent Grafana data — SQLite database, sessions, and plugin binaries |
| `etc/grafana/provisioning` | Provisioning directory — place `datasources/`, `dashboards/`, `alerting/` subdirectories here for automatic configuration on startup |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${GRAFANA_PORT:-3000}` | TCP (HTTP) | Grafana Web UI and API |

## Operational Notes

- Change `GF_SECURITY_ADMIN_PASSWORD` before starting for the first time. After the admin user is created, this variable is only used to reset the password on restart if `GF_SECURITY_ADMIN_PASSWORD_RESET` is `true`.
- `GF_SERVER_ROOT_URL` must match the public-facing URL exactly (including scheme and path prefix if behind a sub-path proxy) for OAuth redirects and alert links to work correctly.
- Provisioning files under `etc/grafana/provisioning/datasources/` and `etc/grafana/provisioning/dashboards/` are applied automatically at startup. Changes to provisioned resources are re-applied on each container restart.
- By default Grafana uses an embedded SQLite database stored in `data/grafana`. For high-availability or heavier load, configure `GF_DATABASE_TYPE=postgres` pointing at a shared PostgreSQL instance.
- `GF_INSTALL_PLUGINS` downloads plugins at container start; this adds startup time and requires internet access. For air-gapped deployments, pre-install plugins into `data/grafana/plugins/` on the host instead.
- The default SQLite backend is not suitable for concurrent writes from multiple Grafana instances.

## Latest Version

`grafana/grafana:latest`
