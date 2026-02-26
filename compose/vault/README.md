# Vault

HashiCorp secrets management platform for storing and tightly controlling access to tokens, passwords, certificates, and encryption keys.

- **Source:** https://github.com/hashicorp/vault
- **License:** Business Source License 1.1 (BSL)
- **Author/Company:** HashiCorp
- **Language(s):** Go
- **Docs:** https://developer.hashicorp.com/vault/docs

## Description

Vault provides a unified interface to any secret, with tight access control and a detailed audit log. It can generate dynamic secrets (short-lived database credentials, cloud IAM tokens), encrypt data in transit, and issue PKI certificates on demand. Secrets are encrypted at rest using a master key that is split into shards via Shamir's Secret Sharing — the server starts sealed and must be unsealed with a quorum of key shards before it will serve any requests. This setup runs the Vault server plus a sidecar container that automatically unseals Vault after a restart using pre-loaded key shards.

## Docker Image Environment Variables

### vault (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `VAULT_ADDR` | `http://0.0.0.0:8200` | Address the Vault client CLI and health check use to reach the server |
| `VAULT_API_ADDR` | `http://0.0.0.0:8200` | Address advertised for client redirects in HA setups |
| `VAULT_CLUSTER_ADDR` | `http://0.0.0.0:8201` | Address used for server-to-server cluster communication |
| `VAULT_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `VAULT_LOG_FORMAT` | `standard` | Log format: `standard` or `json` |
| `VAULT_DEV_ROOT_TOKEN_ID` | _(unset)_ | Root token for dev mode (`vault server -dev`); do not use in production |
| `VAULT_LOCAL_CONFIG` | _(unset)_ | Inline HCL/JSON config passed directly (alternative to a config file) |
| `SKIP_SETCAP` | _(unset)_ | Set to `true` to skip `setcap` on the binary (needed in some restricted environments) |

### vault-unseal (sidecar)

| Variable | Default | Description |
|----------|---------|-------------|
| `VAULT_ADDR` | `http://vault:8200` | Address the sidecar uses to reach the Vault server |
| `VAULT_UNSEAL_KEY_1` | _(empty)_ | First Shamir unseal key shard (base64) |
| `VAULT_UNSEAL_KEY_2` | _(empty)_ | Second Shamir unseal key shard (base64) |
| `VAULT_UNSEAL_KEY_3` | _(empty)_ | Third Shamir unseal key shard (base64) |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/vault/vault.hcl` → `/vault/config/vault.hcl` (ro) | Server configuration file (storage backend, listener, telemetry) |
| `${MNT_DIR}/data/vault` → `/vault/data` | Persistent storage backend data (Integrated Storage / Raft or file backend) |
| `${MNT_DIR}/log/vault` → `/vault/logs` | Audit log output (if file audit device is configured) |
| `${MNT_DIR}/etc/vault/unseal.sh` → `/unseal.sh` (ro) | Shell script executed by the unseal sidecar to submit key shards |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${VAULT_PORT:-8200}` | TCP | HTTPS API, UI, and CLI |
| `8201` | TCP | Internal cluster (HA peer) communication (not exposed) |

## Operational Notes

- The container requires `IPC_LOCK` capability to prevent secrets from being swapped to disk (`mlock`). This is set automatically in the compose file.
- **First-run initialization:** Vault starts uninitialized. Run `docker exec vault vault operator init` to generate key shards and the root token. Store all output in a secure location (e.g. kpv/KeePass) immediately — the root token and unseal keys cannot be recovered if lost.
- After initialization, populate `VAULT_UNSEAL_KEY_1`, `VAULT_UNSEAL_KEY_2`, `VAULT_UNSEAL_KEY_3` (injected at runtime via `kpv`) and restart the stack. The `vault-unseal` sidecar will automatically unseal Vault on every subsequent restart.
- The unseal sidecar uses `restart: on-failure` and exits cleanly once Vault is unsealed; Docker will not restart it again until the next `docker compose up`.
- The healthcheck probes `vault status` — Vault reports healthy even when sealed so Traefik routing is not blocked, but operations will fail until unsealed.
- For production, configure the Integrated Storage (Raft) backend in `vault.hcl` pointing to `/vault/data`.

## Latest Version

`hashicorp/vault:latest`
