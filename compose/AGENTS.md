# Compose Directory — Agent Patterns

Reference for AI agents and humans working in this directory. Covers every convention used across all services so new services are consistent.

---

## Scripting Language Preference

**Prefer Deno and TypeScript for all scripts.** When writing automation, init scripts, helper tools, or anything that runs outside a container, use `.ts` files executed with `deno run`. Fall back to POSIX `sh` only for trivial one-liners that have no business logic.

### `uses: shell` vs `uses: bash`

Cast's `uses: shell` is a **cross-platform shell emulator** — it executes commands line by line and supports `&&`, `||`, and `|` operators but does **not** support shell builtins like `if`/`fi`, `for`/`do`/`done`, `while`, functions, or variable substitution beyond simple `$VAR`.

Use `uses: bash` whenever the task script contains:
- `if`/`else`/`fi` conditionals
- `for`/`while` loops
- Multi-line scripts with shell logic

Use `uses: shell` only for single commands or `&&`-chained commands with no control flow:

```yaml
# OK with uses: shell — single command
run: docker compose -f ./default/compose.yaml up -d

# OK with uses: shell — simple &&
run: docker context use default && docker compose -f ./default/compose.yaml logs -f

# MUST use uses: bash — has if/for
run: |
  if [ -f ./config.yaml ]; then
    echo "found"
  fi
```

---

## Directory Layout

Every service follows the same three-tier layout:

```
compose/
└── <service>/
    ├── castfile                  # imports docker module; sets MNT_DIR, SERVICE_NAME
    ├── prod-inventory.yaml       # SSH inventory for prod host
    ├── test-inventory.yaml       # SSH inventory for test host
    ├── default/
    │   ├── compose.yaml.tmpl     # template — source of truth for all envs
    │   ├── compose.yaml          # generated from tmpl (compose mode)
    │   └── .env                  # non-secret config, proxy flags
    ├── prod/
    │   ├── compose.yaml          # generated from tmpl with prod .env
    │   └── .env                  # MNT_DIR=/mnt/docker, proxy enabled
    └── test/
        ├── compose.yaml          # generated from tmpl with test .env
        └── .env
```

`default/` compose files are standalone — they work with no external dependencies beyond the two docker networks.

---

## Service Castfile

Every service castfile must follow this exact template:

```yaml
imports:
  - docker

env:
  MNT_DIR: "${MNT_DIR:-../../.mnt}"
  SERVICE_NAME: "myservice"

inventories:
  - ./prod-inventory.yaml
  - ./test-inventory.yaml
```

- `imports: [docker]` pulls in all tasks from `.cast/modules/docker/castfile`.
- `MNT_DIR` defaults to `../../.mnt` which resolves to `compose/.mnt` — a gitignored local scratch directory. Override in CI or production by setting `MNT_DIR=/mnt/docker` in the environment or the prod `.env`.
- `SERVICE_NAME` is the service's canonical name (matches the directory name). Used as the Docker Swarm stack name when `DEPLOY_MODE=swarm`.
- `inventories:` points to the per-service SSH inventory files for prod and test hosts.
- Add a `tasks:` block **only** when you need `up:before` / `up:after` hooks (e.g. scaffolding config dirs, running migrations). Do not redefine tasks that the docker module already provides.

### Adding a Before Hook

Use `up:before` to scaffold directories or seed config before the container starts:

```yaml
imports:
  - docker

env:
  MNT_DIR: "${MNT_DIR:-../../.mnt}"
  SERVICE_NAME: "myservice"

inventories:
  - ./prod-inventory.yaml
  - ./test-inventory.yaml

tasks:
  up:before:
    desc: "Scaffold config dirs"
    uses: bash
    run: |
      mkdir -p ${MNT_DIR}/etc/myservice
      mkdir -p ${MNT_DIR}/data/myservice
      if [ ! -f "${MNT_DIR}/etc/myservice/config.yaml" ]; then
        cp ./default/etc/config.yaml ${MNT_DIR}/etc/myservice/config.yaml
      fi
```

---

## The Docker Module

Location: `.cast/modules/docker.yaml`

Provides the following tasks for every service that imports it:

| Task | Action |
|---|---|
| `gen` | Generate `default/compose.yaml` from `default/compose.yaml.tmpl` (compose mode) |
| `gen:prod` | Generate `prod/compose.yaml` from template using `prod/.env` |
| `gen:test` | Generate `test/compose.yaml` from template using `test/.env` |
| `mkdirs` | Create local bind-mount directories for default env |
| `mkdirs:prod` | Create bind-mount directories on prod server via SSH |
| `mkdirs:test` | Create bind-mount directories on test server via SSH |
| `context-create:prod` | Create/update `prod` Docker context (requires `PROD_DOCKER_HOST`) |
| `context-create:test` | Create/update `test` Docker context (requires `TEST_DOCKER_HOST`) |
| `up` | `docker compose -f ./default/compose.yaml up -d` with `./default/.env` |
| `down` | `docker compose -f ./default/compose.yaml down` |
| `up:prod` | Deploy to prod — compose or swarm depending on `DEPLOY_MODE` |
| `down:prod` | Stop prod — compose down or `docker stack rm` |
| `up:test` | Deploy to test — compose or swarm depending on `DEPLOY_MODE` |
| `down:test` | Stop test — compose down or `docker stack rm` |
| `logs` | `docker compose -f ./default/compose.yaml logs -f` |
| `logs:prod` | prod logs |
| `logs:test` | test logs |

All deploy tasks load the matching `.env` file via `dotenv:`.

### Usage

```bash
# From repo root — target a specific service module
cast @compose @postgres up
cast @compose @postgres down
cast @compose @postgres logs

# Production
cast @compose @postgres up:prod
cast @compose @postgres down:prod

# Test
cast @compose @postgres up:test
```

---

## Running Everything

```bash
# 1. Create docker networks (idempotent)
cast @compose @setup up

# 2. Start individual services
cast @compose @traefik up
cast @compose @postgres up
cast @compose @redis up

# 3. Or start all at once from compose/castfile
cast @compose up

# Tear down
cast @compose down
cast @compose @setup down   # removes networks (only if no containers use them)
```

---

## MNT_DIR and Bind Mounts

All volume paths in compose files use `${MNT_DIR}` with **no inline default**. The castfile sets the default:

```
MNT_DIR resolves to:
  default env  →  ../../.mnt   (relative to compose/<service>/, i.e. compose/.mnt)
  prod .env    →  /mnt/docker  (NFS share)
  test .env    →  /mnt/docker-test
```

Volume conventions inside a compose file:

```yaml
volumes:
  - ${MNT_DIR}/data/<service>:/container/data/path      # persistent data
  - ${MNT_DIR}/etc/<service>:/container/config/path     # config files
  - ${MNT_DIR}/log/<service>:/container/log/path        # logs (if not stdout)
```

**Never** use named Docker volumes (`volume_name:`) — all mounts are bind mounts so data is always visible on the host and trivially backed up.

---

## Docker Networks

| Network | Subnet | Purpose |
|---|---|---|
| `vnet-frontend` | `172.20.0.0/16` | Reverse proxies, public-facing services |
| `vnet-backend` | `172.21.0.0/17` | Databases, queues, internal-only services |

Rules:
- Databases and message queues: `vnet-backend` only.
- Reverse proxies (Traefik, Caddy): both networks.
- Application services: whichever networks they need to reach.
- Never attach databases to `vnet-frontend`.

Both networks are declared `external: true` in every compose file:

```yaml
networks:
  vnet-frontend:
    external: true
  vnet-backend:
    external: true
```

Create networks with:
```bash
cast @compose @setup up
```

---

## Healthchecks

Every service **must** have a `healthcheck` block. Use the native probe for each service type:

```yaml
# HTTP service (wget available in alpine)
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:<port>/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 15s

# PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres}"]
  interval: 30s
  timeout: 5s
  retries: 5
  start_period: 30s

# Redis
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s

# RabbitMQ
healthcheck:
  test: ["CMD", "rabbitmq-diagnostics", "ping"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 30s

# MySQL
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD:-root}"]
  interval: 30s
  timeout: 5s
  retries: 5
  start_period: 30s

# Traefik
healthcheck:
  test: ["CMD", "traefik", "healthcheck", "--ping"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s

# Generic TCP check (use when no HTTP or CLI probe is available)
healthcheck:
  test: ["CMD-SHELL", "nc -z localhost <port> || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 15s
```

Healthchecks are required for zero-downtime deployments: Traefik and caddy-docker-proxy both gate routing on container health.

---

## Proxy Integration: Traefik vs caddy-docker-proxy

Both proxies are supported. Each service compose file carries labels for **both** proxies simultaneously. The active proxy is selected via `.env` variables — the inactive proxy simply ignores labels it doesn't own.

### Label Pattern (include in every proxied service)

```yaml
services:
  myservice:
    labels:
      # ── Traefik ──────────────────────────────────────────────────────────
      traefik.enable: "${TRAEFIK_ENABLE:-false}"
      traefik.http.routers.myservice.rule: "Host(`${MYSERVICE_HOST:-myservice.local}`)"
      traefik.http.routers.myservice.entrypoints: "websecure"
      traefik.http.routers.myservice.tls: "true"
      traefik.http.routers.myservice.tls.certresolver: "letsencrypt"
      traefik.http.services.myservice.loadbalancer.server.port: "<container_port>"
      traefik.http.services.myservice.loadbalancer.healthcheck.path: "/health"
      traefik.http.services.myservice.loadbalancer.healthcheck.interval: "10s"

      # ── caddy-docker-proxy ───────────────────────────────────────────────
      # CADDY_ENABLE must be set to the hostname (e.g. myservice.local) to activate,
      # or "false" to disable. caddy-docker-proxy ignores non-hostname values.
      caddy: "${CADDY_ENABLE:-false}"
      caddy.reverse_proxy: "{{upstreams <container_port>}}"
```

### Switching Proxies via .env

**default/.env** — no proxy, direct port binding:
```env
TRAEFIK_ENABLE=false
CADDY_ENABLE=false
MYSERVICE_HOST=myservice.local
MYSERVICE_PORT=8080
```

**prod/.env** — Traefik active:
```env
TRAEFIK_ENABLE=true
CADDY_ENABLE=false
MYSERVICE_HOST=myservice.example.com
```

**test/.env** — caddy-docker-proxy active:
```env
TRAEFIK_ENABLE=false
CADDY_ENABLE=myservice.test.local
MYSERVICE_HOST=myservice.test.local
```

### How Zero-Downtime Works

**Traefik:** Only adds a container as an upstream once its Docker healthcheck reports `healthy`. On `docker compose up -d` with a new image, the new container becomes healthy before Traefik routes to it, then the old container is drained and removed.

**caddy-docker-proxy:** Triggers a graceful Caddy config reload on every Docker event. Caddy drains in-flight requests before swapping upstreams. No additional config needed beyond a working healthcheck.

**Direct port (`PROXY_TYPE=none`):** For development, expose the port directly. The `ports:` binding uses `${MYSERVICE_PORT:-8080}:80` so it can be overridden per environment.

---

## .env File Conventions

### default/.env — always include these keys

```env
# Proxy selection
TRAEFIK_ENABLE=false
CADDY_ENABLE=false

# Hostname (used by proxy labels)
MYSERVICE_HOST=myservice.local

# Direct port for dev (only bound when PROXY_TYPE=none)
MYSERVICE_PORT=8080
```

### prod/.env — NFS mount + proxy enabled, no secrets

```env
MNT_DIR=/mnt/docker
TRAEFIK_ENABLE=true
CADDY_ENABLE=false
MYSERVICE_HOST=myservice.example.com
```

Secrets (passwords, tokens) are **never** in `.env` files. They are injected at runtime by kpv:
```bash
eval $(cast @eng load-prod)
cast @compose @myservice up:prod
```

---

## Template Generation

Every service has a `default/compose.yaml.tmpl` that is the **single source of truth** for all environments. The three environment-specific `compose.yaml` files are generated from it by `compose/scripts/render-compose.ts`.

### Generating compose files

```bash
# From a service directory — generate all three environments
cast gen           # → default/compose.yaml  (DEPLOY_MODE=compose)
cast gen:prod      # → prod/compose.yaml     (loads prod/.env first)
cast gen:test      # → test/compose.yaml     (loads test/.env first)
```

### Template syntax

Templates use Go `text/template` syntax via Deno:

```
{{ .env.MY_VAR }}              — environment variable
{{ default "fallback" .data.key }} — optional values.yaml key with fallback
{{- if eq .env.DEPLOY_MODE "swarm" }} ... {{- end }}   — swarm-only block
{{- if ne .env.DEPLOY_MODE "swarm" }} ... {{- end }}   — compose-only block
```

Trim markers: `{{-` trims preceding whitespace/newlines, `-}}` trims the trailing newline.

### compose.yaml.tmpl patterns

**restart / deploy block** (placed after the service's `networks:` list):

```yaml
    {{- if ne .env.DEPLOY_MODE "swarm" }}
    restart: unless-stopped
    {{- end }}
    {{- if eq .env.DEPLOY_MODE "swarm" }}
    deploy:
      mode: replicated
      replicas: {{ default "1" .data.replicas }}
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    {{- end }}
```

For multi-service stacks (e.g. app + db): only the main app service gets the `deploy:` block. Sidecar/DB services only get the `restart:` conditional.

### Optional values.yaml

Place a `default/values.yaml` next to the template to supply swarm-specific defaults:

```yaml
replicas: 2
```

These are available as `{{ .data.replicas }}` in the template.

---

## Swarm Mode

Set `DEPLOY_MODE=swarm` in a service's `.env` or environment before running `gen:prod` / `up:prod` to produce swarm-compatible compose files and use `docker stack deploy`.

```env
# prod/.env
MNT_DIR=/mnt/docker
DEPLOY_MODE=swarm
TRAEFIK_ENABLE=true
```

```bash
cast gen:prod      # generates swarm-flavored prod/compose.yaml
cast up:prod       # runs docker stack deploy -c ./prod/compose.yaml <SERVICE_NAME>
cast down:prod     # runs docker stack rm <SERVICE_NAME>
```

The `SERVICE_NAME` env var from the castfile is used as the stack name.

---

## Docker Context Setup

Before deploying to remote hosts, create Docker contexts pointing at the SSH endpoints:

```bash
PROD_DOCKER_HOST=ssh://deploy@10.0.0.1 cast context-create:prod
TEST_DOCKER_HOST=ssh://deploy@10.0.0.2 cast context-create:test
```

This calls `docker context create` (or `docker context update` if it already exists).

Remote `up:prod` / `down:prod` tasks use `docker -c prod compose ...` syntax to target the context without permanently switching via `docker context use`.

---

## Inventory Files

Each service directory contains two SSH inventory files used by `mkdirs:prod` and `mkdirs:test` (and any future SSH tasks):

```
compose/<service>/
├── prod-inventory.yaml
└── test-inventory.yaml
```

Format:

```yaml
# prod-inventory.yaml
hosts:
  prod-server:
    host: 10.0.0.1
    user: deploy
    tags: [prod]
    identity_file: ~/.ssh/id_ed25519
```

```yaml
# test-inventory.yaml
hosts:
  test-server:
    host: 10.0.0.2
    user: deploy
    tags: [test]
    identity_file: ~/.ssh/id_ed25519
```

SSH tasks reference hosts by tag: `hosts: [prod]` or `hosts: [test]`.

---

## Adding a New Service — Checklist

1. **Create directory structure:**
   ```bash
   mkdir -p compose/<service>/{default,prod,test}
   touch compose/<service>/{default,prod,test}/.env
   ```

2. **Write `compose/<service>/castfile`:**
   ```yaml
   imports:
     - docker
   env:
     MNT_DIR: "${MNT_DIR:-../../.mnt}"
     SERVICE_NAME: "<service>"
   inventories:
     - ./prod-inventory.yaml
     - ./test-inventory.yaml
   ```

3. **Write `compose/<service>/prod-inventory.yaml` and `test-inventory.yaml`** using the format in the Inventory Files section above.

4. **Write `compose/<service>/default/compose.yaml.tmpl`** following the patterns above:
   - Bind mounts using `${MNT_DIR}/data/<service>` and `${MNT_DIR}/etc/<service>`
   - Healthcheck using the appropriate probe
   - Both Traefik and caddy labels
   - `restart: unless-stopped` inside `{{- if ne .env.DEPLOY_MODE "swarm" }}` conditional
   - `deploy:` block inside `{{- if eq .env.DEPLOY_MODE "swarm" }}` conditional (main service only)
   - Correct network(s) declared `external: true`

5. **Generate compose files:**
   ```bash
   cd compose/<service>
   cast gen        # → default/compose.yaml
   cast gen:prod   # → prod/compose.yaml
   cast gen:test   # → test/compose.yaml
   ```

6. **Write `compose/<service>/default/.env`** with `TRAEFIK_ENABLE=false`, `CADDY_ENABLE=false`, a `HOST` var, and a `PORT` var.

7. **Register in `compose/castfile`** under `modules:`:
   ```yaml
   modules:
     myservice:
       path: ./myservice
       import: docker
   ```

8. **Add to orchestration tasks** in `compose/castfile` (`up`, `down`, `up:prod`, etc.).

---

## Sidecar / Init Container Pattern

For services that need setup before the main container (e.g. Vault auto-unseal, DB migrations), use a companion service with `depends_on` and healthcheck conditions:

```yaml
services:
  myservice-init:
    image: alpine:3
    container_name: myservice-init
    restart: "no"
    command: sh /scripts/init.sh
    volumes:
      - ${MNT_DIR}/etc/myservice:/config
    depends_on:
      myservice:
        condition: service_healthy

  myservice:
    image: myservice:latest
    container_name: myservice
    # ... rest of config
```

The init container runs once after the main container is healthy, then exits. Docker Compose does not restart it (`restart: "no"`).

---

## compose/castfile — Module Registration

When adding a new service, register it in `compose/castfile`:

```yaml
modules:
  # existing services...
  myservice:
    path: ./myservice
    import: docker

tasks:
  up:
    uses: shell
    run: |
      cast @setup up
      # ... existing services ...
      cast @myservice up
```
