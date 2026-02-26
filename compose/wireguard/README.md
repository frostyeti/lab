# WireGuard (wg-easy)

WireGuard VPN server with a simple, self-hosted web UI for managing peers.

- **Source:** https://github.com/wg-easy/wg-easy
- **License:** CC BY-NC-SA 4.0
- **Author/Company:** wg-easy contributors
- **Language(s):** JavaScript (Node.js)
- **Docs:** https://github.com/wg-easy/wg-easy/blob/master/README.md

## Description

wg-easy wraps a WireGuard server with a web-based management UI, making it straightforward to create, delete, and download peer configuration files without touching the command line. It manages the WireGuard interface, generates client configs (including QR codes for mobile), and shows real-time transfer statistics per peer. WireGuard itself is a modern, high-performance VPN protocol built into the Linux kernel that uses state-of-the-art cryptography (Noise protocol, Curve25519, ChaCha20-Poly1305).

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WG_HOST` | _(required)_ | Public hostname or IP address clients use to reach this server; written into peer config files |
| `PASSWORD_HASH` | _(unset)_ | Bcrypt hash of the web UI password; leave empty to disable UI password (not recommended) |
| `PORT` | `51821` | Port the web UI HTTP server listens on inside the container |
| `WG_PORT` | `51820` | WireGuard UDP port clients connect to (must match the exposed host port) |
| `WG_DEFAULT_ADDRESS` | `10.8.0.x` | VPN subnet for peers; `x` is replaced with the peer's assigned index |
| `WG_DEFAULT_DNS` | `1.1.1.1` | DNS server pushed to peer configs; use the VPN gateway IP for local DNS |
| `WG_MTU` | `1420` | MTU for the WireGuard interface; lower if experiencing fragmentation (try `1280` for problematic networks) |
| `WG_ALLOWED_IPS` | `0.0.0.0/0, ::/0` | CIDR ranges routed through the VPN; `0.0.0.0/0` = full tunnel, use specific ranges for split tunnel |
| `WG_PERSISTENT_KEEPALIVE` | `0` | Keepalive interval in seconds; `25` is set here to keep NAT mappings alive for mobile clients |
| `WG_PRE_UP` | _(unset)_ | Shell commands executed before the WireGuard interface is brought up |
| `WG_POST_UP` | _(unset)_ | Shell commands executed after the WireGuard interface is brought up (e.g. iptables NAT rules) |
| `WG_PRE_DOWN` | _(unset)_ | Shell commands executed before the WireGuard interface is taken down |
| `WG_POST_DOWN` | _(unset)_ | Shell commands executed after the WireGuard interface is taken down |
| `LANG` | `en` | Web UI language code (e.g. `en`, `de`, `fr`, `nl`) |
| `UI_TRAFFIC_STATS` | `false` | Show per-peer traffic statistics in the UI |
| `UI_CHART_TYPE` | `0` | Chart type for traffic stats: `0`=none, `1`=line, `2`=area, `3`=bar |
| `MAX_AGE` | `0` | Session cookie max age in milliseconds; `0` = session cookie (expires on browser close) |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/wireguard` → `/etc/wireguard` | WireGuard interface config (`wg0.conf`), peer private keys, and wg-easy's peer database (`wg0.json`) |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `51820` | UDP | WireGuard VPN tunnel — clients connect here |
| `${WG_UI_PORT:-51821}` | TCP | wg-easy web management UI (HTTP) |

## Operational Notes

- **`WG_HOST` is mandatory.** Set it to the public IP or DNS name your clients will use. Without it, generated peer configs will have no endpoint and clients cannot connect.
- **Generate `PASSWORD_HASH` before first start.** Use `docker run --rm ghcr.io/wg-easy/wg-easy wgpw 'YOUR_PASSWORD'` to produce a bcrypt hash, then set it as `PASSWORD_HASH`. A blank hash disables authentication on the UI.
- The container requires `NET_ADMIN` and `SYS_MODULE` capabilities and the `net.ipv4.ip_forward=1` sysctl. These are set in the compose file. On some hosts (e.g. Proxmox LXC), kernel module loading may be restricted — ensure the host kernel has `wireguard` built in.
- All peer private keys are stored in plain text in `/etc/wireguard/wg0.json`. Treat the data volume as a secret and restrict access accordingly.
- The healthcheck runs `wg show` inside the container; the WireGuard interface must be up for this to pass. If the container is healthy but clients cannot connect, check firewall rules on the host — port `51820/udp` must be open.
- For split-tunnel setups (only route specific subnets through VPN), change `WG_ALLOWED_IPS` to the desired CIDR(s) before creating any peers — existing peer configs are not automatically updated.
- The web UI runs over plain HTTP. Use the Traefik or Caddy labels to put it behind a reverse proxy with TLS if exposing remotely.

## Latest Version

`ghcr.io/wg-easy/wg-easy:latest`
