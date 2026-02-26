# Dashy

Self-hosted startpage and homelab dashboard with a rich web UI.

- **Source:** https://github.com/Lissy93/dashy
- **License:** MIT
- **Author/Company:** Alicia Sykes (Lissy93)
- **Language(s):** Vue.js (JavaScript/TypeScript)
- **Docs:** https://dashy.to/docs/

## Description

Dashy is a highly customizable, self-hosted dashboard for organizing homelab services into a visual startpage. It supports hundreds of built-in status-check widgets, icon packs, themes, and layout options. The entire configuration lives in a single YAML file (`conf.yml`), making it easy to version-control. It can display live service health, weather, RSS feeds, and more alongside quick-launch links.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment mode. Set to `production` for optimal performance; `development` enables hot-reload but is slower. |
| `DASHY_PORT` | `4000` | Host port mapped to container port 80. Set via the `ports` binding `${DASHY_PORT:-4000}:80`. |
| `DASHY_HOST` | `dashy.local` | Hostname used by the Traefik/Caddy proxy labels for routing. |
| `TRAEFIK_ENABLE` | `false` | Set to `true` to activate Traefik routing via container labels. |
| `CADDY_ENABLE` | `false` | Set to the target hostname (e.g. `dashy.local`) to activate caddy-docker-proxy routing. |
| `GID` | — | Group ID to run the Node process as inside the container. |
| `UID` | — | User ID to run the Node process as inside the container. |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/dashy/conf.yml` → `/app/public/conf.yml` (ro) | Main Dashy configuration file defining all sections, items, widgets, and theme settings. Mounted read-only. |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${DASHY_PORT:-4000}:80` | TCP | Dashy web UI (Node/Express serving the Vue SPA) |

## Operational Notes

- `conf.yml` must exist before the container starts. Copy the sample config from the Dashy docs or create a minimal one:
  ```yaml
  pageInfo:
    title: Homelab
  sections: []
  ```
- The config file is mounted read-only (`:ro`). To edit it, modify the host file and either reload the page or restart the container (Dashy watches for changes in `development` mode only).
- When running behind Traefik, set `TRAEFIK_ENABLE=true` and remove the `ports:` binding to avoid port conflicts; the proxy handles all ingress.
- When running behind caddy-docker-proxy, set `CADDY_ENABLE=dashy.yourdomain.com` (the actual hostname, not `true`).
- Dashy runs on `vnet-frontend` only — it has no database dependency and does not need backend network access.
- The built-in status checker can probe other services on `vnet-frontend`; services on `vnet-backend` are not reachable from Dashy.

## Latest Version

`lissy93/dashy:latest`
