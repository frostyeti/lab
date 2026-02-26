# pangolin

Self-hosted tunneled reverse proxy with identity-aware access control and WireGuard-based tunnels.

- **Source:** https://github.com/fosrl/pangolin
- **License:** AGPL-3.0
- **Author/Company:** FOSRL
- **Language(s):** Go, TypeScript
- **Docs:** https://docs.pangolin.sh/

## Description

Pangolin is a self-hosted network tunnel and reverse proxy that lets you expose services running behind NAT or firewalls without opening inbound ports. It pairs with Gerbil, a lightweight WireGuard-based tunnel agent that runs on remote nodes and connects back to the Pangolin control plane. Pangolin handles authentication, access policies, and routing while Gerbil establishes the encrypted WireGuard tunnels from the edge nodes.

## Docker Image Environment Variables

### pangolin (`fosrl/pangolin`)

pangolin is configured via `/app/config/config.yaml`. It does not read environment variables for its own configuration — all settings live in the config file mounted at `/app/config`.

Key fields in `config.yaml`:

| Config Key | Example | Description |
|------------|---------|-------------|
| `app.base_url` | `https://pangolin.example.com` | Public base URL for the dashboard |
| `app.secret` | _(random string)_ | Session secret — generate a random value |
| `app.admin_email` | `admin@example.com` | Initial admin account email |
| `app.admin_password` | _(string)_ | Initial admin account password |
| `server.external_port` | `3001` | Port pangolin listens on |
| `server.wireguard_port` | `7844` | WireGuard tunnel listen port |
| `database.path` | `/app/data/db.sqlite` | SQLite database path |
| `email.smtp_host` | _(unset)_ | SMTP server for email notifications |
| `email.smtp_port` | `587` | SMTP port |
| `email.smtp_user` | _(unset)_ | SMTP username |
| `email.smtp_pass` | _(unset)_ | SMTP password |
| `email.no_reply` | _(unset)_ | From address for outbound mail |

### gerbil (`fosrl/gerbil`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PANGOLIN_ENDPOINT` | `pangolin.local` | Hostname or IP of the Pangolin control plane that Gerbil registers with |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/pangolin` → `/app/config` | Configuration directory — `config.yaml` must be present before first start |
| `${MNT_DIR}/data/pangolin` → `/app/data` | Persistent state: SQLite database, generated keys |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${PANGOLIN_PORT:-3001}` → `3001` | TCP | Web dashboard and REST API |
| `7844` → `7844` | UDP | WireGuard tunnel endpoint for Gerbil agents |
| `7844` → `7844` | TCP | TCP fallback for WireGuard tunnel (for restricted networks) |

## Operational Notes

- **Config file required:** Pangolin will not start without `/app/config/config.yaml`. Create the config file in `${MNT_DIR}/etc/pangolin/` before first boot. Refer to the official docs for the full schema.
- **Gerbil capabilities:** The gerbil container requires `NET_ADMIN` and `SYS_MODULE` capabilities and `net.ipv4.ip_forward=1` to manage WireGuard interfaces on the host network.
- **Remote agents:** Gerbil does not need to run on the same host as Pangolin. In a production setup, deploy a separate Gerbil instance on each remote node, pointing `PANGOLIN_ENDPOINT` at the public Pangolin address.
- **Port 7844:** Must be reachable from remote Gerbil agents. If Pangolin is behind a firewall, ensure UDP 7844 (and TCP 7844 as fallback) is port-forwarded or allowed through.
- **Initial admin:** Set `app.admin_email` and `app.admin_password` in `config.yaml` before first start. These seed the admin account; you can change the password in the UI afterwards.
- **HTTPS:** Terminate TLS at a reverse proxy (Traefik/Caddy) and set `app.base_url` to the HTTPS URL. Pangolin itself listens on plain HTTP internally.

## Latest Version

`fosrl/pangolin:latest`
