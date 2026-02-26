# Prometheus

Open-source metrics collection and alerting system for infrastructure and application monitoring.

- **Source:** https://github.com/prometheus/prometheus
- **License:** Apache 2.0
- **Author/Company:** Prometheus Authors / CNCF
- **Language(s):** Go
- **Docs:** https://prometheus.io/docs

## Description

Prometheus is a time-series database and monitoring system that scrapes metrics from instrumented targets over HTTP. It stores all data locally on disk and provides a powerful query language (PromQL) for aggregation and analysis. Prometheus pairs naturally with Alertmanager for notifications and with Grafana for dashboards.

## Docker Image Environment Variables

Prometheus is configured entirely through its configuration file and CLI flags rather than environment variables. The compose file passes flags via the `command:` block.

| CLI Flag | Compose Value | Description |
|----------|---------------|-------------|
| `--config.file` | `/etc/prometheus/prometheus.yml` | Path to the scrape and alerting configuration file |
| `--storage.tsdb.path` | `/prometheus` | Directory where time-series data is written |
| `--storage.tsdb.retention.time` | `${PROMETHEUS_RETENTION:-15d}` | How long to keep data before automatic deletion |
| `--web.console.libraries` | `/usr/share/prometheus/console_libraries` | Path to console template libraries |
| `--web.console.templates` | `/usr/share/prometheus/consoles` | Path to console HTML templates |
| `--web.enable-lifecycle` | _(flag only)_ | Enables `POST /-/reload` and `POST /-/quit` HTTP endpoints |
| `--web.listen-address` | _(default: `0.0.0.0:9090`)_ | Address for the web UI and API |
| `--web.external-url` | _(unset)_ | Public URL used in alert annotations and links |
| `--storage.tsdb.retention.size` | _(unset)_ | Maximum TSDB size (e.g. `50GB`); deletes oldest blocks when exceeded |
| `--alertmanager.url` | _(unset)_ | Alertmanager endpoint(s) for firing alerts |
| `--log.level` | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |
| `--log.format` | `logfmt` | Log format (`logfmt`, `json`) |

## Volumes

| Path | Purpose |
|------|---------|
| `etc/prometheus/prometheus.yml` | Scrape configuration, rule files, and alerting targets (read-only) |
| `data/prometheus` | TSDB data directory — all scraped time-series are stored here |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${PROMETHEUS_PORT:-9090}` | TCP (HTTP) | Web UI, PromQL API, and metrics scrape target for self-monitoring |

## Operational Notes

- `etc/prometheus/prometheus.yml` must exist before starting the container. A minimal config with just a `global:` block and a `scrape_configs:` entry pointing at `localhost:9090` is sufficient to start.
- `--web.enable-lifecycle` is required to trigger configuration reloads without a container restart (`curl -XPOST http://localhost:9090/-/reload`). This is convenient but also allows unauthenticated reload if the port is exposed — restrict access appropriately.
- `PROMETHEUS_RETENTION` defaults to `15d`. Increase this (e.g. `90d`) or set `--storage.tsdb.retention.size` when disk space allows and longer history is needed.
- Prometheus has no built-in authentication. Place it behind a reverse proxy with auth (Traefik, Caddy) or restrict it to `vnet-backend` only.
- Alert rules are loaded from files listed under `rule_files:` in `prometheus.yml`; place them in `etc/prometheus/` and mount the whole directory instead of a single file for easier management.

## Latest Version

`prom/prometheus:latest`
