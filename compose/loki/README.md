# Loki

Horizontally scalable, multi-tenant log aggregation system inspired by Prometheus.

- **Source:** https://github.com/grafana/loki
- **License:** AGPL-3.0
- **Author/Company:** Grafana Labs
- **Language(s):** Go
- **Docs:** https://grafana.com/docs/loki/latest/

## Description

Loki is a log aggregation system designed to be cost-effective and easy to operate. Unlike other logging systems it only indexes labels (not the full log content), which drastically reduces storage costs. Log data is compressed and stored in object storage or on local disk, and is queried via LogQL — a query language modeled on PromQL. Loki integrates natively with Grafana and is the standard log backend in the Grafana LGTM observability stack.

## Docker Image Environment Variables

Loki is configured via a YAML configuration file rather than environment variables. The compose file passes the config path as a CLI flag via `command:`.

| CLI Flag / Variable | Compose Value | Description |
|---------------------|---------------|-------------|
| `-config.file` | `/etc/loki/loki.yml` | Path to the Loki configuration file |
| `-config.expand-env` | _(unset)_ | Set to `true` to expand `${VAR}` references inside the config file |
| `-target` | _(default: `all`)_ | Component(s) to run (`all`, `ingester`, `querier`, `distributor`, etc.) |
| `-log.level` | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |
| `-log.format` | `logfmt` | Log format (`logfmt`, `json`) |
| `-print-config-stderr` | _(unset)_ | Print the resolved config to stderr on startup (useful for debugging) |

Key `loki.yml` configuration sections:

| Section | Description |
|---------|-------------|
| `auth_enabled` | Multi-tenancy toggle; set to `false` for single-tenant homelab use |
| `server.http_listen_port` | HTTP port (default `3100`) |
| `ingester.wal.dir` | Write-ahead log directory inside the container |
| `storage_config.boltdb_shipper` | Index storage config when using filesystem backend |
| `storage_config.filesystem.directory` | Root directory for chunk storage |
| `limits_config.retention_period` | How long to retain log streams (requires `compactor.retention_enabled: true`) |
| `compactor.working_directory` | Working dir for the compactor; enable retention by setting `retention_enabled: true` |

## Volumes

| Path | Purpose |
|------|---------|
| `etc/loki/loki.yml` | Loki configuration file (read-only) |
| `data/loki` | Persistent data directory — chunks, index (BoltDB/TSDB), and WAL |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${LOKI_PORT:-3100}` | TCP (HTTP) | Loki HTTP API — log push (`/loki/api/v1/push`), query, and health (`/ready`) |

## Operational Notes

- `etc/loki/loki.yml` **must** exist before first run. A minimal single-binary filesystem config:
  ```yaml
  auth_enabled: false
  server:
    http_listen_port: 3100
  common:
    path_prefix: /loki
    storage:
      filesystem:
        chunks_directory: /loki/chunks
        rules_directory: /loki/rules
    replication_factor: 1
    ring:
      kvstore:
        store: inmemory
  schema_config:
    configs:
      - from: 2024-01-01
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: index_
          period: 24h
  ```
- Logs are pushed to Loki by Promtail, Alloy, or the Docker logging driver (`loki` driver). Grafana queries Loki via its built-in Loki data source.
- Loki has no built-in authentication when `auth_enabled: false`. Restrict access to `vnet-backend` or use a reverse proxy with auth.
- Log retention requires setting `compactor.retention_enabled: true` and `limits_config.retention_period` (e.g. `30d`) in `loki.yml`.
- The `/ready` endpoint returns HTTP 200 only after Loki has fully initialised — use it for health checks and dependency conditions.

## Latest Version

`grafana/loki:latest`
