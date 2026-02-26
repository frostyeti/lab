# rustdesk

Self-hosted open-source remote desktop server (relay and rendezvous).

- **Source:** https://github.com/rustdesk/rustdesk-server
- **License:** AGPL-3.0
- **Author/Company:** RustDesk
- **Language(s):** Rust
- **Docs:** https://rustdesk.com/docs/en/self-host/

## Description

RustDesk Server provides the relay (hbbr) and ID/rendezvous (hbbs) services needed to run a fully self-hosted RustDesk remote desktop infrastructure. Clients connect to hbbs to discover each other by ID and establish a peer-to-peer connection; if a direct connection cannot be made, traffic is relayed through hbbr. This setup gives you complete control over your remote desktop sessions without relying on RustDesk's public infrastructure.

## Docker Image Environment Variables

The `rustdesk/rustdesk-server` image is configured via command-line flags rather than environment variables. Both containers use the same image with different `command` values.

### hbbs (ID/rendezvous server)

| Flag | Example | Description |
|------|---------|-------------|
| `-r <host>:<port>` | `-r rustdesk.example.com:21117` | Public hostname and port of the relay server (hbbr) — embedded in client config |
| `-k <key>` | `-k _` | Require clients to use a specific public key (use `_` to auto-generate) |
| `-p <port>` | `-p 21116` | Override the default listen port |

### hbbr (relay server)

| Flag | Example | Description |
|------|---------|-------------|
| `-k <key>` | `-k _` | Same key as hbbs — enforces encrypted relay connections |
| `-p <port>` | `-p 21117` | Override the default relay listen port |

### Runtime environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUSTDESK_HOST` | `rustdesk.local` | Public hostname passed to hbbs via the `-r` flag to tell clients where to find the relay |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/rustdesk` → `/root` (hbbs) | Persistent state: server keypair (`id_ed25519`, `id_ed25519.pub`) and peer database |
| `${MNT_DIR}/data/rustdesk` → `/root` (hbbr) | Shared volume — both containers read the same keypair so encryption is consistent |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `21115` | TCP | hbbs NAT type test |
| `21116` | TCP | hbbs ID registration and heartbeat |
| `21116` | UDP | hbbs ID/rendezvous peer lookup |
| `21117` | TCP | hbbr relay traffic between peers |
| `21118` | TCP | hbbs WebSocket support (web client) |
| `21119` | TCP | hbbr WebSocket support (web client) |

## Operational Notes

- **Public hostname required:** Set `RUSTDESK_HOST` to the public DNS name or IP of the server. Clients must be able to reach this address on port 21117. If the hostname is wrong, peer-to-peer connections will fail to establish.
- **Key pair:** On first start, hbbs generates an Ed25519 keypair under `/root`. The public key (`id_ed25519.pub`) must be pasted into each RustDesk client under **Settings → Network → Key**. The volume is shared between hbbs and hbbr so they use the same key.
- **Firewall:** All six ports (21115–21119 TCP, 21116 UDP) must be reachable from the internet if clients are outside your LAN.
- **Client configuration:** In the RustDesk client, go to **Settings → Network** and set the ID server to `<host>:21116` and the relay server to `<host>:21117`. Leave the API server blank unless you are running the Pro version.
- **Pro vs OSS:** This compose uses the open-source server image. It does not include the web console, user management, or audit log features of RustDesk Server Pro.

## Latest Version

`rustdesk/rustdesk-server:latest`
