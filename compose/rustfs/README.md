# rustfs

High-performance S3-compatible object storage server written in Rust.

- **Source:** https://github.com/rustfs/rustfs
- **License:** Apache-2.0
- **Author/Company:** RustFS
- **Language(s):** Rust
- **Docs:** https://rustfs.com/docs/

## Description

RustFS is an S3-compatible object storage server implemented in Rust, designed as a high-performance, self-hostable alternative to MinIO. It exposes the standard S3 API on port 9000 and a web-based management console on port 9001, making it a drop-in replacement for any S3-compatible workload including backups, artifact storage, and application blob storage.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUSTFS_ACCESS_KEY` | `minioadmin` | S3 access key (equivalent to AWS access key ID) — **change in production** |
| `RUSTFS_SECRET_KEY` | `minioadmin` | S3 secret key (equivalent to AWS secret access key) — **change in production** |
| `RUSTFS_VOLUMES` | `/data` | Comma-separated list of data volume paths |
| `RUSTFS_ADDRESS` | `:9000` | S3 API listen address |
| `RUSTFS_CONSOLE_ADDRESS` | `:9001` | Web console listen address |
| `RUSTFS_REGION` | `us-east-1` | Default region returned in S3 responses |
| `RUSTFS_DOMAIN` | _(unset)_ | Domain for virtual-hosted-style bucket access (e.g. `s3.example.com`) |
| `RUSTFS_TLS_CERT` | _(unset)_ | Path to TLS certificate file for built-in HTTPS |
| `RUSTFS_TLS_KEY` | _(unset)_ | Path to TLS private key file for built-in HTTPS |
| `RUSTFS_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/rustfs` → `/data` | Object storage data directory — all buckets and objects are stored here |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${RUSTFS_PORT:-9000}` → `9000` | TCP | S3-compatible API endpoint |
| `${RUSTFS_CONSOLE_PORT:-9001}` → `9001` | TCP | Web management console |

## Operational Notes

- **Default credentials:** The default `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` pair (`minioadmin` / `minioadmin`) must be changed before exposing this service. Set strong values in your `.env` file.
- **S3 client configuration:** Point any S3 client at `http://<host>:9000` with the configured access key and secret. The API is compatible with AWS SDKs and tools like `aws s3`, `rclone`, and `mc` (MinIO client).
- **Console access:** The web console at port 9001 allows bucket creation, object browsing, policy management, and user/access-key administration.
- **Health check:** The container health check polls `/minio/health/live` — this endpoint is MinIO-compatible and indicates the server is ready to serve requests.
- **Multi-volume / erasure coding:** To use erasure coding for redundancy, set `RUSTFS_VOLUMES` to a space-separated list of paths and provide multiple mount points.
- **Traefik routing:** The compose labels define separate Traefik routers for the API (`RUSTFS_HOST`) and the console (`RUSTFS_CONSOLE_HOST`). Set both in your `.env` when using a reverse proxy.

## Latest Version

`rustfs/rustfs:latest`
