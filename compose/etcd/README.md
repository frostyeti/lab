# etcd

Distributed, reliable key-value store for the most critical data in distributed systems.

- **Source:** https://github.com/etcd-io/etcd
- **License:** Apache License 2.0
- **Author/Company:** Cloud Native Computing Foundation (CNCF)
- **Language(s):** Go
- **Docs:** https://etcd.io/docs/

## Description

etcd is a strongly consistent, distributed key-value store built on the Raft consensus algorithm. It is the primary data store for Kubernetes (cluster state, secrets, config) and is also used as a coordination backend for distributed locking, leader election, and service discovery. Clients interact with it via a gRPC/HTTP API (`etcdctl` or client libraries). This deployment runs a single-node cluster using the Bitnami image.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ETCD_NAME` | `etcd0` | Human-readable name for this cluster member |
| `ETCD_DATA_DIR` | `/bitnami/etcd/data` | Directory where etcd stores its WAL and snapshot data |
| `ETCD_LISTEN_CLIENT_URLS` | `http://0.0.0.0:2379` | URLs etcd listens on for client traffic |
| `ETCD_ADVERTISE_CLIENT_URLS` | `http://etcd:2379` | URLs this member advertises to clients |
| `ETCD_LISTEN_PEER_URLS` | `http://0.0.0.0:2380` | URLs etcd listens on for peer (cluster) traffic |
| `ETCD_INITIAL_ADVERTISE_PEER_URLS` | `http://etcd:2380` | URLs this member advertises to peers during initial cluster bootstrap |
| `ETCD_INITIAL_CLUSTER` | `etcd0=http://etcd:2380` | Initial cluster membership (`name=peer-url` pairs, comma-separated) |
| `ETCD_INITIAL_CLUSTER_STATE` | `new` | `new` for a fresh cluster; `existing` when joining a running cluster |
| `ETCD_INITIAL_CLUSTER_TOKEN` | `homelab-etcd` | Unique token to prevent cross-cluster contamination |
| `ALLOW_NONE_AUTHENTICATION` | `yes` | Bitnami flag: `yes` disables client auth (development only) |
| `ETCD_ROOT_PASSWORD` | _(unset)_ | Bitnami: when set alongside `ALLOW_NONE_AUTHENTICATION=no`, enables root user auth |
| `ETCD_LOG_LEVEL` | `info` | Log verbosity: `debug`, `info`, `warn`, `error`, `panic`, `fatal` |
| `ETCD_AUTO_COMPACTION_RETENTION` | _(unset)_ | Auto-compact the keyspace after this interval (e.g. `1h`) to limit MVCC history growth |
| `ETCD_QUOTA_BACKEND_BYTES` | `2147483648` | Maximum backend database size (default 2 GiB); raise for large datasets |
| `ETCD_SNAPSHOT_COUNT` | `100000` | Number of committed transactions that trigger a snapshot to disk |
| `ETCD_HEARTBEAT_INTERVAL` | `100` | Leader heartbeat interval in milliseconds |
| `ETCD_ELECTION_TIMEOUT` | `1000` | Follower election timeout in milliseconds |
| `ETCD_MAX_REQUEST_BYTES` | `1572864` | Maximum client request size in bytes (default 1.5 MiB) |
| `ETCD_CERT_FILE` | _(unset)_ | Path to TLS certificate for client-facing endpoints |
| `ETCD_KEY_FILE` | _(unset)_ | Path to TLS private key for client-facing endpoints |
| `ETCD_TRUSTED_CA_FILE` | _(unset)_ | CA certificate for verifying client certificates |
| `ETCD_CLIENT_CERT_AUTH` | `false` | Require clients to present a certificate signed by the CA |
| `ETCD_PEER_CERT_FILE` | _(unset)_ | TLS certificate for peer communication |
| `ETCD_PEER_KEY_FILE` | _(unset)_ | TLS private key for peer communication |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/etcd` → `/bitnami/etcd/data` | Persistent WAL (write-ahead log), snapshots, and key-value data |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${ETCD_CLIENT_PORT:-2379}` | TCP | Client API (gRPC and HTTP) |
| `2380` | TCP | Peer communication for cluster consensus (Raft) |

## Operational Notes

- `ALLOW_NONE_AUTHENTICATION=yes` disables authentication entirely. For production, set `ALLOW_NONE_AUTHENTICATION=no` and `ETCD_ROOT_PASSWORD` (Bitnami) or configure TLS client certificates.
- The `ETCD_INITIAL_CLUSTER_STATE=new` value is only used on the very first boot. If you delete the data directory and restart, the cluster will re-initialize from scratch. Change to `existing` when adding a member to an already-running cluster.
- etcd's backend (bbolt) grows monotonically due to MVCC. Enable `ETCD_AUTO_COMPACTION_RETENTION=1h` (or similar) in production to prevent unbounded disk growth.
- When the backend size exceeds `ETCD_QUOTA_BACKEND_BYTES`, etcd enters a maintenance-only mode. Run `etcdctl defrag` after compaction to reclaim space.
- `etcdctl` inside the container respects `ETCDCTL_API=3` (v3 API); v2 API is deprecated and removed in etcd 3.6+.

## Latest Version

`bitnami/etcd:latest`
