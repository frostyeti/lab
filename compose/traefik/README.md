# Traefik

Cloud-native reverse proxy and load balancer with automatic service discovery.

- **Source:** https://github.com/traefik/traefik
- **License:** MIT
- **Author/Company:** Traefik Labs
- **Language(s):** Go
- **Docs:** https://doc.traefik.io/traefik/

## Description

Traefik is a modern HTTP reverse proxy and load balancer that integrates directly with Docker to automatically discover and route traffic to containers via labels. It supports automatic TLS certificate provisioning via Let's Encrypt, multiple entrypoints, middlewares for auth/rate-limiting/redirects, and a built-in dashboard. It is well-suited as the single ingress point for a homelab or production Docker environment.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAEFIK_API_INSECURE` | `false` | Enable the API/dashboard on port 8080 without TLS (set via CLI flag `--api.insecure=true` in this compose) |
| `TRAEFIK_LOG_LEVEL` | `ERROR` | Log verbosity: `DEBUG`, `INFO`, `WARN`, `ERROR` (set via `--log.level=INFO` in this compose) |
| `TRAEFIK_PROVIDERS_DOCKER` | `false` | Enable Docker provider (set via `--providers.docker=true`) |
| `TRAEFIK_PROVIDERS_DOCKER_EXPOSEDBYDEFAULT` | `true` | Auto-expose all Docker containers; set `false` to require explicit `traefik.enable=true` label |
| `TRAEFIK_ENTRYPOINTS_WEB_ADDRESS` | — | Address for the `web` entrypoint (e.g. `:80`) |
| `TRAEFIK_ENTRYPOINTS_WEBSECURE_ADDRESS` | — | Address for the `websecure` entrypoint (e.g. `:443`) |
| `TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_EMAIL` | — | Email for Let's Encrypt ACME registration |
| `TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_TLSCHALLENGE` | `false` | Use TLS-ALPN-01 challenge for certificate provisioning |
| `TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_DNSCHALLENGE_PROVIDER` | — | DNS provider for DNS-01 challenge (e.g. `cloudflare`) |
| `TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_STORAGE` | — | Path to the ACME JSON storage file (e.g. `/etc/traefik/acme.json`) |
| `TRAEFIK_PING` | `false` | Enable the `/ping` healthcheck endpoint (set via `--ping=true`) |
| `TRAEFIK_PROVIDERS_DOCKER_NETWORK` | — | Default Docker network Traefik uses to reach containers |
| `TRAEFIK_PROVIDERS_FILE_DIRECTORY` | — | Directory to watch for dynamic configuration files |
| `TRAEFIK_PROVIDERS_FILE_WATCH` | `true` | Watch the file provider directory for changes |
| `TRAEFIK_ACCESSLOG` | `false` | Enable access logs |
| `TRAEFIK_METRICS_PROMETHEUS` | `false` | Enable Prometheus metrics endpoint |

> Most configuration in this deployment is passed as CLI `command:` flags rather than environment variables. See `/etc/traefik/traefik.yml` for file-based config.

## Volumes

| Path | Purpose |
|------|---------|
| `/var/run/docker.sock` (ro) | Docker socket — required for the Docker provider to discover containers and their labels |
| `${MNT_DIR}/etc/traefik` → `/etc/traefik` | Static and dynamic configuration files, TLS certificates, and ACME storage (`acme.json`) |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `80` | TCP | `web` entrypoint — plain HTTP, typically used to redirect to HTTPS |
| `443` | TCP | `websecure` entrypoint — HTTPS / TLS termination |
| `8080` | TCP | Traefik API and dashboard (insecure, development only) |

## Operational Notes

- `acme.json` must exist and have permissions `600` before first run when using Let's Encrypt: `touch acme.json && chmod 600 acme.json`.
- The dashboard is exposed insecurely on port `8080` via `--api.insecure=true`. Remove this flag and protect it with middleware in production.
- `--providers.docker.exposedbydefault=false` means containers require `traefik.enable=true` label to be routed.
- Both `vnet-frontend` and `vnet-backend` networks must exist before starting (`cast @compose @setup up`).
- To use Let's Encrypt DNS-01 challenge, set the appropriate DNS provider API keys as environment variables (e.g. `CF_DNS_API_TOKEN` for Cloudflare).
- HTTP to HTTPS redirects require a middleware — add `--entrypoints.web.http.redirections.entrypoint.to=websecure` to the command.

## Latest Version

`traefik:v3.0`
