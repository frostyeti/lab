# Redis

In-memory data store used as a cache, message broker, and session store.

- **Source:** https://github.com/docker-library/redis
- **License:** BSD-3-Clause (Redis source); Redis Stack components may differ
- **Author/Company:** Redis Ltd.
- **Language(s):** C
- **Docs:** https://redis.io/docs/latest/

## Description

Redis is an in-memory key-value store that supports rich data structures including strings, hashes, lists, sets, sorted sets, streams, and more. It is widely used as a cache layer, session store, pub/sub message broker, and rate-limiting backend for web applications. This deployment runs Redis with append-only file (AOF) persistence enabled so data survives container restarts.

## Docker Image Environment Variables

The official Redis Docker image does not configure Redis primarily through environment variables — configuration is passed via the `command:` directive or a `redis.conf` file. The following variables are supported:

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_PASSWORD` | — | Not a native env var; use `--requirepass <password>` in the `command:` to set a password. Alternatively reference it via `${REDIS_PASSWORD}` in a custom `redis.conf`. |
| `REDIS_REPLICATION_MODE` | — | Not native; set replication mode (`master`/`slave`) in `redis.conf` or via command flags. |
| `ALLOW_EMPTY_PASSWORD` | — | Not used by the official image; accepted by Bitnami's Redis image if switching to that variant. |

> **Note:** This deployment uses `command: redis-server --appendonly yes`, which enables AOF persistence. Additional flags (e.g. `--requirepass`, `--maxmemory`, `--maxmemory-policy`) can be appended to this command.

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/redis` → `/data` | Persistent storage for AOF (`appendonly.aof`) and RDB (`dump.rdb`) snapshot files |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `6379` | TCP | Redis protocol — all client connections (RESP protocol) |

## Operational Notes

- AOF persistence is enabled via `--appendonly yes`. This provides better durability than RDB snapshots alone but uses more disk I/O. For cache-only use cases where data loss on restart is acceptable, remove this flag.
- **No password is set by default.** Add `--requirepass yourpassword` to the `command:` before exposing Redis to any network. Any application on `vnet-backend` can connect without authentication in the current configuration.
- Only attached to `vnet-backend` — never expose Redis on `vnet-frontend`.
- The healthcheck uses `redis-cli ping` which returns `PONG` when the server is ready.
- To use a `redis.conf` file instead of command flags, mount it and change the command to: `redis-server /usr/local/etc/redis/redis.conf`.
- To limit memory usage (important for a shared host), add `--maxmemory 512mb --maxmemory-policy allkeys-lru` to the command.
- Redis 7 introduced multi-part AOF; the `/data` directory may contain an `appendonlydir/` subdirectory rather than a single file.

## Latest Version

`redis:7-alpine`
