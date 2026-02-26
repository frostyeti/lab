# Homelab Recommendations

A reference guide for running a self-hosted homelab with **cast**, **Deno**, **Docker Compose**, **Cloudflare**, and **Traefik/Caddy**.

---

## Table of Contents

1. [Repository Layout](#repository-layout)
2. [Reverse Proxy: Traefik vs caddy-docker-proxy](#reverse-proxy-traefik-vs-caddy-docker-proxy)
3. [Zero-Downtime Deployments](#zero-downtime-deployments)
4. [Secrets Management with kpv](#secrets-management-with-kpv)
5. [Cloudflare Integration](#cloudflare-integration)
6. [DNS with CoreDNS](#dns-with-coredns)
7. [Networking](#networking)
8. [Volume Strategy](#volume-strategy)
9. [Deno for Automation and Tooling](#deno-for-automation-and-tooling)
10. [Cast Task Runner Patterns](#cast-task-runner-patterns)
11. [Observability](#observability)
12. [Backup Strategy](#backup-strategy)
13. [Security Hardening](#security-hardening)

---

## Repository Layout

Keep infrastructure as code in a single git repository. Sensitive values never live in the repo — only in kpv vaults.

```
lab/
├── castfile                  # Root task runner entrypoint
├── .cast/modules/docker/     # Reusable docker up/down module
├── compose/                  # All docker compose services
│   ├── castfile              # Service orchestration
│   ├── setup/                # Network bootstrap
│   └── <service>/
│       ├── castfile          # Imports docker module, sets MNT_DIR
│       ├── default/          # Local dev (bind-mounts to ../.mnt)
│       ├── prod/             # Production (.env points MNT_DIR=/mnt/docker)
│       └── test/             # Test environment
├── eng/
│   ├── castfile              # Engineering tasks
│   └── script/               # Vault-switching shell helpers
└── docs/
```

**Rules:**
- `.env` files in `prod/` and `test/` set `MNT_DIR=/mnt/docker/<service>` and contain no secrets — credentials come from kpv at runtime.
- `default/` uses `MNT_DIR=../../.mnt` so the working tree stays self-contained without any mount dependencies.

---

## Reverse Proxy: Traefik vs caddy-docker-proxy

Both are good choices. Pick based on your priorities:

| Feature | Traefik v3 | caddy-docker-proxy |
|---|---|---|
| TLS via ACME | Yes (Let's Encrypt / ZeroSSL) | Yes (automatic via Caddy) |
| Docker label routing | Yes | Yes |
| Zero-downtime on container replace | Yes (healthcheck-gated) | Yes (graceful Caddy reload) |
| Dashboard UI | Yes (port 8080) | Caddy admin API only |
| Config file fallback | Yes (`traefik.yml`) | Yes (`Caddyfile`) |
| Middleware ecosystem | Rich | Growing |
| HTTP/3 (QUIC) | Yes | Yes |
| Certificate sharing across replicas | Via ACME storage | Via shared `/data` volume |

**Recommendation:** Use **Traefik** when you want a rich dashboard, complex middleware chains (rate-limiting, auth, headers), or Kubernetes migration path. Use **caddy-docker-proxy** when you want the simplest possible zero-config HTTPS with minimal moving parts and prefer Caddyfile semantics.

This repo ships both. The `TRAEFIK_ENABLE` / `CADDY_ENABLE` labels on each service control which proxy is active without requiring a compose file change.

---

## Zero-Downtime Deployments

### With Traefik

Traefik polls container healthchecks before routing traffic. To get zero downtime:

1. Add a `healthcheck` to every service compose file (all services in this repo have one).
2. Traefik only adds a backend once the container is **healthy**.
3. On `docker compose up -d` with a new image, Docker starts the new container, waits for healthy, then stops the old one.

```yaml
# traefik labels that gate on healthcheck
labels:
  traefik.http.services.myapp.loadbalancer.healthcheck.path: "/health"
  traefik.http.services.myapp.loadbalancer.healthcheck.interval: "10s"
```

For true rolling deploys without any gap, run **two replicas** with a shared external load balancer entry:

```yaml
deploy:
  replicas: 2
  update_config:
    order: start-first     # start new before stopping old
    failure_action: rollback
```

### With caddy-docker-proxy

caddy-docker-proxy triggers a **graceful Caddy reload** on every Docker event. Caddy drains in-flight requests before swapping upstreams, achieving zero downtime automatically. No additional configuration is required beyond having healthchecks so Docker itself manages container lifecycle correctly.

### General Pattern

```bash
# Pull new image
docker compose -f ./prod/compose.yaml pull

# Recreate with zero-downtime (requires healthcheck + start-first)
docker compose -f ./prod/compose.yaml up -d --no-deps <service>
```

---

## Secrets Management with kpv

[kpv](https://github.com/frostyeti/kpv) stores secrets in KeePass `.kdbx` vaults and exports them as environment variables.

### Vault Structure

Maintain two vaults:
- `prod.kdbx` — production credentials
- `test.kdbx` — test/staging credentials

### Loading Secrets

```bash
# Load prod secrets into current shell
eval $(cast @eng load-prod)

# Then run prod services — .env files will pick up the exported vars
cast @compose up:prod
```

### In CI/CD

```bash
# Unlock vault with a master password from a CI secret
kpv env --vault prod --password "$KPV_MASTER_PASSWORD" | while IFS= read -r line; do
  export "$line"
done
```

### What to Store in kpv

- Database passwords (`POSTGRES_PASSWORD`, `MSSQL_SA_PASSWORD`, etc.)
- RabbitMQ credentials
- Cloudflare API tokens
- TLS certificate private keys (if self-managed)
- Any third-party API keys

**Never** commit secrets to `.env` files. The `.env` files in `prod/` and `test/` should only contain non-secret configuration (hostnames, feature flags, `MNT_DIR`).

---

## Cloudflare Integration

### DNS-01 ACME Challenge (Recommended for internal services)

Both Traefik and Caddy support Cloudflare DNS challenge, enabling TLS for services not exposed to the internet.

**Traefik:**
```yaml
# In traefik static config (etc/traefik/traefik.yml)
certificatesResolvers:
  letsencrypt:
    acme:
      email: you@example.com
      storage: /etc/traefik/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
```

```bash
# Required env vars (store in kpv)
CF_API_EMAIL=you@example.com
CF_DNS_API_TOKEN=<cloudflare-api-token>
```

**Caddy (via caddy-docker-proxy):**

Build a custom caddy image with the cloudflare module:
```dockerfile
FROM caddy:2-builder AS builder
RUN xcaddy build \
    --with github.com/lucaslorentz/caddy-docker-proxy/v2 \
    --with github.com/caddy-dns/cloudflare
FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
CMD ["caddy", "docker-proxy"]
```

### Cloudflare Tunnel (Zero Trust)

For exposing services without opening firewall ports, use Cloudflare Tunnel (`cloudflared`). This is strongly recommended for any service accessible from the internet.

```yaml
# compose/cloudflared/default/compose.yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - vnet-frontend
```

### Recommended Cloudflare Settings

- Enable **proxied** (orange cloud) for all public hostnames to get DDoS protection and CDN.
- Set **SSL/TLS mode to Full (Strict)** — requires a valid cert on your origin (Traefik/Caddy handles this).
- Enable **Brotli** compression in the Speed settings.
- Use **Page Rules** or **Transform Rules** to redirect HTTP → HTTPS at the edge.
- Enable **Bot Fight Mode** for public-facing services.

---

## DNS with CoreDNS

CoreDNS handles internal DNS resolution for your homelab domain (e.g. `*.home.local`).

### Minimal Corefile

```
.:53 {
    forward . 1.1.1.1 8.8.8.8
    cache 30
    log
    errors
}

home.local:53 {
    file /etc/coredns/home.local.db
    log
    errors
}
```

### Zone File (`home.local.db`)

```
$ORIGIN home.local.
$TTL 3600
@    IN  SOA  ns1.home.local. admin.home.local. 2024010101 3600 900 604800 300
@    IN  NS   ns1.home.local.
ns1  IN  A    172.21.0.1

; Service records — point to your homelab host IP
traefik   IN  A  192.168.1.100
dashy     IN  A  192.168.1.100
postgres  IN  A  192.168.1.100
```

**Tip:** Combine CoreDNS with a wildcard record pointing to your reverse proxy IP so any new service automatically resolves:
```
*  IN  A  192.168.1.100
```

---

## Networking

This homelab uses two bridge networks with non-overlapping subnets:

| Network | Subnet | Purpose |
|---|---|---|
| `vnet-frontend` | `172.20.0.0/16` | Reverse proxies, public-facing services |
| `vnet-backend` | `172.21.0.0/17` | Databases, message queues, internal services |

**Rules:**
- Databases and message queues attach **only** to `vnet-backend`. They are never directly reachable from the frontend network.
- Reverse proxies (Traefik, Caddy) attach to **both** networks so they can route frontend requests to backend services.
- Application services attach to whichever networks they need.

### Adding a New Service

```bash
# Create networks if not already present
cast @compose @setup up

# Then bring up your new service
cast @compose @myservice up
```

---

## Volume Strategy

Mount paths follow a consistent convention:

```
${MNT_DIR}/
├── data/<service>/    # Persistent data (databases, queues)
├── etc/<service>/     # Configuration files
└── log/<service>/     # Log files (optional, prefer stdout)
```

### Per-Environment MNT_DIR

| Environment | MNT_DIR | Backend |
|---|---|---|
| `default` (dev) | `../../.mnt` | Local filesystem |
| `prod` | `/mnt/docker` | NFS share |
| `test` | `/mnt/docker-test` | NFS share (separate) |

### NFS Mount Setup

```bash
# /etc/fstab on the homelab host
nas.home.local:/docker      /mnt/docker       nfs4  defaults,_netdev,noatime  0 0
nas.home.local:/docker-test /mnt/docker-test  nfs4  defaults,_netdev,noatime  0 0
```

**For production:** Use a NAS (TrueNAS, Synology, etc.) with ZFS for the backing storage. Enable snapshots on the NFS datasets for point-in-time recovery.

---

## Deno for Automation and Tooling

Deno is well-suited for homelab automation scripts because it ships as a single binary with TypeScript support and a secure-by-default permission model.

### Recommended Uses

**Health check aggregator:**
```typescript
// scripts/health.ts
const services = ["http://traefik:8080/ping", "http://dashy.local/"];
const results = await Promise.all(
  services.map(async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return { url, status: res.status, ok: res.ok };
    } catch (e) {
      return { url, status: 0, ok: false, error: String(e) };
    }
  })
);
console.table(results);
```

**Secret rotation helper:**
```typescript
// scripts/rotate-secret.ts
import { $ } from "jsr:@david/dax";
const service = Deno.args[0];
const newPassword = crypto.randomUUID();
await $`kpv set --vault prod --entry ${service}/password --value ${newPassword}`;
console.log(`Rotated password for ${service}`);
```

**Cast integration** — add Deno scripts as cast tasks:
```yaml
tasks:
  health:
    uses: shell
    run: deno run --allow-net scripts/health.ts
```

### Deno Deploy for Dashboards

For lightweight status pages or webhook receivers, Deno Deploy provides free hosting with edge runtime — useful for a public status page that shows homelab service health without exposing the homelab directly.

---

## Cast Task Runner Patterns

### Module Inheritance

The `docker` module in `.cast/modules/docker/castfile` provides `up`, `down`, `up:prod`, `down:prod`, `up:test`, `down:test`, and `logs*` tasks. Every service castfile imports it:

```yaml
# compose/<service>/castfile
imports:
  - docker
env:
  MNT_DIR: "${MNT_DIR:-../../.mnt}"
```

Override any task locally by redefining it in the service castfile — the local definition takes precedence.

### Pre/Post Hooks

Use `up:before` / `up:after` hooks to scaffold directories or run migrations:

```yaml
tasks:
  up:before:
    uses: shell
    run: |
      mkdir -p ${MNT_DIR}/etc/myservice
      mkdir -p ${MNT_DIR}/data/myservice

  up:after:
    uses: shell
    run: |
      # Wait for healthy then run migrations
      docker compose -f ./default/compose.yaml exec myservice migrate up
```

### Environment Switching Pattern

```bash
# Load prod vault, then run any cast task in prod mode
eval $(cast @eng load-prod) && cast @compose up:prod
```

### Useful Root-level Tasks

```yaml
tasks:
  status:
    uses: shell
    run: docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

  prune:
    uses: shell
    run: docker system prune -f --volumes
```

---

## Observability

### Logging

Prefer **stdout/stderr** from containers — avoid writing logs inside containers to disk. Centralize with one of:

- **Loki + Grafana** (recommended for homelab — lightweight, integrates with Docker)
- **Graylog** — more feature-rich, heavier
- **Vector** — fast log router, good for forwarding to multiple sinks

```yaml
# Loki Docker driver (install once per host)
# docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions

# In compose files, add logging driver:
logging:
  driver: loki
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
    loki-external-labels: "service={{.Name}},env=${HOMELAB_ENV}"
```

### Metrics

- **Prometheus + Grafana** for metrics — Traefik, RabbitMQ, PostgreSQL, Redis all expose Prometheus endpoints.
- Use **node-exporter** for host metrics.
- Traefik exposes metrics at `/metrics` on the admin port.

### Tracing

For distributed tracing across services, add **Jaeger** or **Tempo** (part of the Grafana LGTM stack).

---

## Backup Strategy

### Database Backups

```bash
# PostgreSQL — dump to MNT_DIR
docker exec postgres pg_dumpall -U postgres | gzip > ${MNT_DIR}/backups/postgres/$(date +%Y%m%d).sql.gz

# MySQL
docker exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} --all-databases | gzip > ${MNT_DIR}/backups/mysql/$(date +%Y%m%d).sql.gz

# MSSQL
docker exec mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" \
  -Q "BACKUP DATABASE [mydb] TO DISK = '/var/opt/mssql/backup/mydb.bak'"
```

Add these as cast tasks and schedule with `cron` or a Deno script with `Deno.cron`.

### Volume Backups

Use **restic** for incremental encrypted backups of `${MNT_DIR}` to a remote S3-compatible target (Backblaze B2 is inexpensive):

```bash
restic -r s3:s3.us-west-002.backblazeb2.com/mybucket backup /mnt/docker
```

### Restore Testing

Schedule a weekly restore test to a separate `test` environment to verify backup integrity. Automate with a Deno script that:
1. Restores the latest backup to `/mnt/docker-test`
2. Starts the test stack (`cast @compose up:test`)
3. Runs smoke tests
4. Tears down (`cast @compose down:test`)
5. Reports results

---

## Security Hardening

### Container Security

- **Never run containers as root.** Add `user: "1000:1000"` where the image supports it.
- Mount config volumes **read-only** where possible (`:ro`).
- Use **read-only root filesystems** with explicit tmpfs for writable paths:

```yaml
read_only: true
tmpfs:
  - /tmp
  - /run
```

- Pin image tags to specific digests in production (not `:latest`):
  ```
  image: postgres:16.2-alpine@sha256:<digest>
  ```

### Network Isolation

- Databases must only be on `vnet-backend`. Verify with `docker network inspect`.
- Do not expose database ports (`5432`, `3306`, `1433`, `6379`) on `0.0.0.0` in production — bind to `127.0.0.1` or remove port mappings entirely and use the internal network.

```yaml
# Restrict port binding to localhost only
ports:
  - "127.0.0.1:5432:5432"
```

### Traefik Security Middlewares

Define reusable middleware in Traefik and attach to all routers:

```yaml
# In traefik dynamic config
http:
  middlewares:
    secure-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        contentTypeNosniff: true
        frameDeny: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"

    rate-limit:
      rateLimit:
        average: 100
        burst: 50
```

### Secrets in Environment

- Do not use `environment:` with inline plaintext secrets in compose files.
- Use `env_file:` pointing to a `.env` populated by `kpv` at deploy time.
- Rotate secrets quarterly and log rotation in your vault's history.

### Cloudflare WAF

Enable the **Cloudflare WAF** (free tier) for all proxied hostnames. For the management interface (Traefik dashboard, RabbitMQ UI), use **Cloudflare Access** (Zero Trust) to require authentication before reaching your origin.
