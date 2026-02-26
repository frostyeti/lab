# headscale

Self-hosted open-source implementation of the Tailscale control plane.

- **Source:** https://github.com/juanfont/headscale
- **License:** BSD-3-Clause
- **Author/Company:** Juan Font / headscale contributors
- **Language(s):** Go
- **Docs:** https://headscale.net/

## Description

headscale reimplements the Tailscale coordination server so you can run your own Tailscale-compatible control plane without relying on Tailscale's hosted infrastructure. All standard Tailscale clients (Linux, macOS, Windows, iOS, Android) connect to headscale instead, forming a private WireGuard mesh network. The companion headscale-ui container provides a lightweight browser-based dashboard for managing users, devices, and pre-auth keys.

## Docker Image Environment Variables

### headscale (`headscale/headscale`)

headscale is configured primarily via `/etc/headscale/config.yaml`. The only runtime environment variable the image reads directly is:

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADSCALE_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |

Key fields in `config.yaml` (not env vars, but important to know):

| Config Key | Example | Description |
|------------|---------|-------------|
| `server_url` | `https://headscale.example.com` | Public URL clients use to reach this server |
| `listen_addr` | `0.0.0.0:8080` | HTTP listen address |
| `metrics_listen_addr` | `0.0.0.0:9090` | Prometheus metrics listen address |
| `grpc_listen_addr` | `0.0.0.0:50443` | gRPC listen address |
| `private_key_path` | `/var/lib/headscale/private.key` | Server private key location |
| `noise.private_key_path` | `/var/lib/headscale/noise_private.key` | Noise protocol private key |
| `ip_prefixes` | `[100.64.0.0/10]` | IP ranges assigned to clients |
| `dns.magic_dns` | `true` | Enable MagicDNS for hostname resolution |
| `dns.base_domain` | `headscale.net` | Domain suffix for MagicDNS names |
| `db.type` | `sqlite` | Database backend: `sqlite` or `postgres` |
| `db.sqlite.path` | `/var/lib/headscale/db.sqlite` | SQLite database path |
| `oidc.issuer` | _(unset)_ | OpenID Connect issuer URL for SSO login |
| `oidc.client_id` | _(unset)_ | OIDC client ID |
| `oidc.client_secret` | _(unset)_ | OIDC client secret |
| `acls` | _(unset)_ | Path to HuJSON ACL policy file |

### headscale-ui (`ghcr.io/gurucomputing/headscale-ui`)

headscale-ui is a static SPA; all configuration is done in the browser UI by providing the headscale API URL and an API key.

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/headscale` → `/etc/headscale` | Configuration directory — place `config.yaml` here before first start |
| `${MNT_DIR}/data/headscale` → `/var/lib/headscale` | Persistent state: SQLite database, private keys, certificates |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${HEADSCALE_PORT:-8085}` → `8080` | TCP | headscale HTTP/HTTPS API and client registration |
| `9090` → `9090` | TCP | Prometheus metrics endpoint |
| `${HEADSCALE_UI_PORT:-8086}` → `80` | TCP | headscale-ui web dashboard |

## Operational Notes

- **Config file required:** headscale will not start without `/etc/headscale/config.yaml`. Copy the example config from the headscale repo or the official docs before first boot: `headscale generate config > config.yaml`.
- **server_url:** Set `server_url` in `config.yaml` to the public URL (including port or domain) that clients will use — this is embedded in client registration responses and must be reachable from all devices.
- **API key for UI:** After startup, create an API key with `docker exec headscale headscale apikeys create`. Paste it into the headscale-ui settings along with the headscale server URL.
- **Pre-auth keys:** Generate per-user pre-auth keys with `docker exec headscale headscale preauthkeys create --user <name>` and use them in `tailscale up --login-server=... --authkey=...`.
- **DERP:** By default headscale uses Tailscale's public DERP relay servers. To run a self-hosted DERP, configure `derp.server.enabled: true` in `config.yaml`.
- **Metrics:** The `/metrics` endpoint on port 9090 is used by the container healthcheck and is suitable for Prometheus scraping.

## Latest Version

`headscale/headscale:latest`
