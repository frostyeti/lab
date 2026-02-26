# defguard

Open-source WireGuard VPN and network access control platform with SSO and MFA.

- **Source:** https://github.com/DefGuard/defguard
- **License:** Apache-2.0
- **Author/Company:** DefGuard
- **Language(s):** Rust, TypeScript
- **Docs:** https://defguard.gitbook.io/defguard

## Description

defguard is a self-hosted zero-trust network access (ZTNA) platform built around WireGuard. It provides a web UI for managing VPN users, devices, and networks, with built-in SSO via OpenID Connect, multi-factor authentication (TOTP/WebAuthn), and enrollment workflows. The gateway component runs on each network node and connects back to the core via gRPC to apply WireGuard configuration changes in real time.

## Docker Image Environment Variables

### defguard-db (`postgres:16-alpine`)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `defguard` | Database superuser name |
| `POSTGRES_PASSWORD` | `defguard` | Database superuser password |
| `POSTGRES_DB` | `defguard` | Database name to create on startup |

### defguard core (`ghcr.io/defguard/defguard`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFGUARD_DB_HOST` | `defguard-db` | PostgreSQL hostname |
| `DEFGUARD_DB_PORT` | `5432` | PostgreSQL port |
| `DEFGUARD_DB_USER` | `defguard` | Database user |
| `DEFGUARD_DB_PASSWORD` | `defguard` | Database password |
| `DEFGUARD_DB_NAME` | `defguard` | Database name |
| `DEFGUARD_SECRET_KEY` | `changemeinproduction` | Secret key for signing sessions and tokens — **must be changed** |
| `DEFGUARD_URL` | `http://localhost:8000` | Public base URL of the defguard instance (used in enrollment links) |
| `DEFGUARD_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `DEFGUARD_GRPC_PORT` | `50055` | gRPC listen port for gateway connections |
| `DEFGUARD_ADMIN_GROUPNAME` | `defguard-admin` | LDAP/group name that grants admin access |
| `DEFGUARD_OPENID_ENABLED` | `false` | Enable built-in OpenID Connect provider |
| `DEFGUARD_LDAP_URL` | _(unset)_ | LDAP server URL for external directory sync |
| `DEFGUARD_SMTP_SERVER` | _(unset)_ | SMTP hostname for email notifications |
| `DEFGUARD_SMTP_PORT` | `587` | SMTP port |
| `DEFGUARD_SMTP_USER` | _(unset)_ | SMTP username |
| `DEFGUARD_SMTP_PASSWORD` | _(unset)_ | SMTP password |
| `DEFGUARD_SMTP_FROM` | _(unset)_ | From address for outbound email |

### defguard-gateway (`ghcr.io/defguard/gateway`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFGUARD_GRPC_URL` | `defguard:50055` | Address of the defguard core gRPC endpoint |
| `DEFGUARD_TOKEN` | `changeme` | Authentication token generated in the defguard UI for this gateway — **must be set** |
| `DEFGUARD_USERSPACE` | `false` | Use userspace WireGuard (`boringtun`) instead of kernel module |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/defguard/core` → `/app/data` | Core application data: keys, enrollment tokens, generated WireGuard configs |
| `${MNT_DIR}/data/defguard/db` → `/var/lib/postgresql/data` | PostgreSQL data directory |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${DEFGUARD_PORT:-8000}` → `8000` | TCP | Web UI and REST API |
| `50055` → `50055` | TCP | gRPC endpoint for gateway connections |
| `51820` → `51820` | UDP | WireGuard VPN tunnel |

## Operational Notes

- **Gateway token:** After first start, navigate to the defguard UI → Networks → add a gateway. defguard will generate a one-time token. Set `DEFGUARD_TOKEN` in your `.env` and restart the gateway container.
- **Secret key:** `DEFGUARD_SECRET_KEY` must be changed before production use. All existing sessions are invalidated when this key changes.
- **Kernel module:** The gateway requires `NET_ADMIN` and `SYS_MODULE` capabilities and IPv4/IPv6 forwarding sysctls. Set `DEFGUARD_USERSPACE=true` if the host kernel does not have the WireGuard module loaded.
- **gRPC exposure:** Port 50055 is exposed on the host. In production, restrict it to the internal network or place behind a firewall; only gateways need to reach it.
- **Database dependency:** The core service waits for a healthy PostgreSQL container before starting. Allow 30–60 s on first boot while the DB initialises.
- **Default credentials:** First-run admin credentials are printed to the container log.

## Latest Version

`ghcr.io/defguard/defguard:latest`
