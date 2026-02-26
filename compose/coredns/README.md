# CoreDNS

Fast, flexible DNS server with a plugin-based architecture.

- **Source:** https://github.com/coredns/coredns
- **License:** Apache-2.0
- **Author/Company:** CoreDNS Authors (CNCF project)
- **Language(s):** Go
- **Docs:** https://coredns.io/manual/toc/

## Description

CoreDNS is a DNS server written in Go that chains plugins to provide a wide range of DNS functionality. It can act as a recursive resolver, authoritative nameserver, DNS-over-TLS/HTTPS server, and internal service discovery DNS for Docker or Kubernetes environments. In a homelab context it is commonly used to serve custom local domain zones (e.g. `.local`, `.home.arpa`) and to forward external queries upstream to resolvers like Cloudflare or Google.

## Docker Image Environment Variables

CoreDNS does not use environment variables for configuration — all configuration is done via the `Corefile` and zone files mounted at `/etc/coredns`. The table below documents environment variables that can be referenced inside the `Corefile` using `{$VAR}` substitution.

| Variable | Default | Description |
|----------|---------|-------------|
| `UPSTREAM_DNS` | — | Upstream resolver address to reference in the Corefile (e.g. `8.8.8.8`) |
| `COREDNS_LOG_LEVEL` | — | Can be set and referenced in the Corefile's `log` plugin configuration |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/coredns` → `/etc/coredns` | Corefile and zone data files. The container is started with `-conf /etc/coredns/Corefile` |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `53` | UDP | Standard DNS query port (primary protocol) |
| `53` | TCP | DNS over TCP — used for large responses (>512 bytes) and zone transfers |

## Operational Notes

- A `Corefile` must exist at `${MNT_DIR}/etc/coredns/Corefile` before first run. A minimal example:
  ```
  .:53 {
      forward . 1.1.1.1 8.8.8.8
      cache 30
      log
      errors
  }
  ```
- Zone files referenced in the Corefile must also be placed in `${MNT_DIR}/etc/coredns/`.
- Only attached to `vnet-backend` — internal services query CoreDNS directly; it is not exposed to the host by default unless port `53` is bound (as it is here).
- Binding port 53 on the host may conflict with `systemd-resolved` on Ubuntu/Debian. Disable its stub listener: set `DNSStubListener=no` in `/etc/systemd/resolved.conf` and restart `systemd-resolved`.
- The healthcheck uses `dig @127.0.0.1 health.check` — CoreDNS responds to any query even for non-existent names, so this validates the server is responding.
- Use the `reload` plugin in the Corefile to enable hot-reloading of zone files without restarting the container.

## Latest Version

`coredns/coredns:latest`
