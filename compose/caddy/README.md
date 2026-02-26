# Caddy (caddy-docker-proxy)

Automatic Caddy reverse proxy configured entirely from Docker container labels.

- **Source:** https://github.com/lucaslorentz/caddy-docker-proxy
- **License:** MIT
- **Author/Company:** Lucas Lorentz
- **Language(s):** Go
- **Docs:** https://github.com/lucaslorentz/caddy-docker-proxy#readme

## Description

caddy-docker-proxy wraps the Caddy web server and watches the Docker daemon for container events. When a container starts or stops, it reads `caddy.*` labels and hot-reloads Caddy's configuration with zero downtime. It supports automatic HTTPS via Let's Encrypt or ZeroSSL, HTTP/3 (QUIC) out of the box, and acts as a drop-in replacement for Traefik in label-driven homelab setups. All Caddy directives are expressible as container labels.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CADDY_INGRESS_NETWORKS` | — | Comma-separated Docker network names Caddy will use to reach upstream containers. Set to `vnet-frontend` here to restrict routing to the frontend network. |
| `CADDY_DOCKER_CADDYFILE_PATH` | `/etc/caddy/Caddyfile` | Path to a static Caddyfile merged with the label-generated config |
| `CADDY_DOCKER_LABEL_PREFIX` | `caddy` | Prefix for Docker labels that caddy-docker-proxy reads (default: `caddy`) |
| `CADDY_DOCKER_PROXY_SERVICE_TASKS` | `false` | Route to individual task IPs in Docker Swarm mode instead of the VIP |
| `CADDY_DOCKER_PROCESS_CADDYFILE` | `false` | Pre-process the Caddyfile with environment variable substitution |
| `CADDY_DOCKER_POLLING_INTERVAL` | `30s` | Interval for polling Docker events when event stream is unavailable |
| `CADDY_DOCKER_NO_UPSTREAM_HEALTHCHECK` | `false` | Disable Caddy's passive upstream health checks |
| `XDG_DATA_HOME` | `/data` | Base directory for Caddy's data (certificates, OCSP staples) |
| `XDG_CONFIG_HOME` | `/config` | Base directory for Caddy's runtime config and autosave |

## Volumes

| Path | Purpose |
|------|---------|
| `/var/run/docker.sock` (ro) | Docker socket — required to watch container events and read labels |
| `${MNT_DIR}/data/caddy` → `/data` | Persistent storage for TLS certificates, OCSP staples, and other Caddy data |
| `${MNT_DIR}/etc/caddy` → `/config` | Caddy runtime config directory and autosave JSON; optionally place a static `Caddyfile` here |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `80` | TCP | HTTP — Caddy automatically redirects to HTTPS for managed domains |
| `443` | TCP | HTTPS — TLS termination with automatic certificate provisioning |
| `443` | UDP | HTTP/3 (QUIC) — required for HTTP/3 support alongside TCP 443 |

## Operational Notes

- The `data/` volume must be persistent across restarts — Caddy stores its managed TLS certificates there. Losing it forces certificate re-issuance and may hit Let's Encrypt rate limits.
- `CADDY_INGRESS_NETWORKS=vnet-frontend` restricts Caddy to only route to containers on that network; containers on `vnet-backend` are not directly reachable, which is the intended security posture.
- To enable routing to a container, add labels: `caddy: "myapp.example.com"` and `caddy.reverse_proxy: "{{upstreams 8080}}"`.
- Setting `caddy: "false"` on a container disables routing for that container — used in development to bypass the proxy.
- Port 2019 (Caddy admin API) is exposed only inside the container; the healthcheck queries `http://localhost:2019/metrics`.
- HTTP/3 requires both TCP and UDP port 443 to be published (already configured in this compose).
- Both `vnet-frontend` and `vnet-backend` networks must exist before starting (`cast @compose @setup up`).

## Latest Version

`lucaslorentz/caddy-docker-proxy:ci-alpine`
