# Compose Service Backlog

---

## Service README & Version Automation

Each service under `compose/` needs:

1. ~~**`README.md`**~~ ✅ Done for all 31 services.

2. ~~**`default/compose.yaml` image tag**~~ ✅ All compose files use `${TAG:-<version>}` pattern.

3. ~~**`compose/scripts/update-version.ts`**~~ ✅ Script written.

4. **CI/CD job** — runs `update-version.ts` for every service on a weekly schedule, opens a PR if any version changed.

### Services needing README.md

- [x] traefik
- [x] caddy
- [x] coredns
- [x] dashy
- [x] postgres
- [x] redis
- [x] mssql
- [x] mysql
- [x] rabbitmq
- [x] vault
- [x] consul
- [x] etcd
- [x] vaultwarden
- [x] code-server
- [x] gitea
- [x] wireguard
- [x] defguard
- [x] headscale
- [x] pangolin
- [x] rustfs
- [x] rustdesk
- [x] filerun
- [x] n8n
- [x] windmill
- [x] temporal
- [x] kestra
- [x] prometheus
- [x] loki
- [x] grafana
- [x] grafana-oncall
- [x] posthog

---

## ✅ Completed — Template Generation & Swarm Support

- [x] `compose/scripts/render-compose.ts` — Deno template engine written and tested
- [x] `default/compose.yaml.tmpl` written for all 31 services with compose/swarm conditionals
- [x] `.cast/modules/docker/castfile` — full rewrite: `gen`, `gen:prod`, `gen:test`, `mkdirs`, `mkdirs:prod`, `mkdirs:test`, `context-create:prod`, `context-create:test`, compose + swarm `up`/`down`
- [x] `SERVICE_NAME` env var added to all 31 service castfiles
- [x] `prod-inventory.yaml` and `test-inventory.yaml` created for all 31 services
- [x] `inventories:` block added to all 31 service castfiles
- [x] `AGENTS.md` updated with template generation, swarm mode, docker context, and inventory conventions

---

## New Services to Evaluate

Self-hosted apps worth evaluating for inclusion in the homelab stack. Grouped by category.

---

## Identity & Access

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Authentik | Identity provider — SSO, OAuth2, SAML, LDAP | `ghcr.io/goauthentik/server` |
| Keycloak | Enterprise-grade IAM, OIDC/SAML/LDAP | `quay.io/keycloak/keycloak` |
| Authelia | Lightweight 2FA / SSO gateway for Traefik/Caddy | `authelia/authelia` |
| LLDAP | Simplified LDAP server with web UI | `lldap/lldap` |
| Pocket ID | Minimalist OIDC provider | `stonith404/pocket-id` |

---

## Reverse Proxy / Networking

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| nginx-proxy-manager | GUI for nginx reverse proxy + Let's Encrypt | `jc21/nginx-proxy-manager` |
| HAProxy | High-performance TCP/HTTP load balancer | `haproxy` |
| Nginx | Plain nginx for static sites or upstreams | `nginx:alpine` |
| Cloudflare Tunnel | Zero-trust tunnel without open ports | `cloudflare/cloudflared` |
| Netbird | WireGuard-based overlay mesh network | `netbirdio/management` |
| Tailscale | Managed WireGuard mesh (self-hosted relay) | `tailscale/tailscale` |

---

## Monitoring & Observability

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Alertmanager | Prometheus alert routing and grouping | `prom/alertmanager` |
| node-exporter | Host-level metrics exporter for Prometheus | `prom/node-exporter` |
| cAdvisor | Container resource metrics exporter | `gcr.io/cadvisor/cadvisor` |
| Uptime Kuma | Self-hosted uptime / status page monitor | `louislam/uptime-kuma` |
| Netdata | Real-time host and container metrics | `netdata/netdata` |
| Signoz | OpenTelemetry-native observability platform | `signoz/signoz` |
| OpenTelemetry Collector | Unified telemetry pipeline (traces/metrics/logs) | `otel/opentelemetry-collector-contrib` |
| Jaeger | Distributed tracing backend | `jaegertracing/all-in-one` |
| Tempo | Grafana Tempo distributed tracing | `grafana/tempo` |
| Mimir | Grafana Mimir long-term Prometheus storage | `grafana/mimir` |

---

## Databases & Storage

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| MinIO | S3-compatible object storage | `minio/minio` |
| SeaweedFS | Distributed file + object storage | `chrislusf/seaweedfs` |
| ClickHouse | OLAP columnar database | `clickhouse/clickhouse-server` |
| ScyllaDB | High-throughput Cassandra-compatible DB | `scylladb/scylla` |
| CockroachDB | Distributed SQL, Postgres-compatible | `cockroachdb/cockroach` |
| TimescaleDB | Time-series Postgres extension | `timescale/timescaledb` |
| Dragonfly | Redis-compatible in-memory store | `docker.dragonflydb.io/dragonflydb/dragonfly` |
| Kafka | Distributed event streaming | `confluentinc/cp-kafka` |
| Redpanda | Kafka-compatible, no-JVM streaming | `redpandadata/redpanda` |
| NATS | Lightweight pub/sub + JetStream | `nats` |

---

## CI/CD & Dev Tools

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Woodpecker CI | Lightweight Drone-compatible CI | `woodpeckerci/woodpecker-server` |
| Forgejo | Gitea fork (soft-fork with active community) | `codeberg.org/forgejo/forgejo` |
| Drone CI | Container-native CI/CD | `drone/drone` |
| Jenkins | Mature, plugin-rich CI server | `jenkins/jenkins:lts` |
| Harbor | Container image registry with scanning | `goharbor/harbor-core` |
| Zot | OCI-native container registry | `ghcr.io/project-zot/zot-linux-amd64` |
| Nexus OSS | Universal artifact repository (Maven/NPM/Docker) | `sonatype/nexus3` |
| SonarQube | Code quality and security scanning | `sonarqube:community` |
| Renovate | Automated dependency update PRs | `renovate/renovate` |
| Dagger | Portable CI pipelines in code | (CLI, not a service) |

---

## Automation & Workflows

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Activepieces | No-code automation (Zapier alternative) | `activepieces/activepieces` |
| Automatisch | Open-source Zapier alternative | `automatisch/automatisch` |
| Huginn | Agent-based automation and scraping | `ghcr.io/huginn/huginn` |
| Node-RED | Flow-based IoT/event programming | `nodered/node-red` |
| Trigger.dev | Background jobs + event-driven workflows | `ghcr.io/triggerdotdev/trigger.dev` |

---

## Communication & Collaboration

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Mattermost | Slack-compatible team chat | `mattermost/mattermost-team-edition` |
| Matrix Synapse | Decentralised chat / Element backend | `matrixdotorg/synapse` |
| Element Web | Matrix web client | `vectorim/element-web` |
| Rocket.Chat | Full-featured team chat | `rocketchat/rocket.chat` |
| Zulip | Threaded team messaging | `zulip/docker-zulip` |
| Listmonk | Self-hosted newsletter & mailing list | `listmonk/listmonk` |

---

## Media & Files

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Nextcloud | File sync, calendar, contacts, office | `nextcloud` |
| Seafile | File sync with versioning and sharing | `seafileltd/seafile-mc` |
| Immich | Google Photos alternative (photos/videos) | `ghcr.io/immich-app/immich-server` |
| PhotoPrism | AI-powered photo library | `photoprism/photoprism` |
| Jellyfin | Media server (movies, TV, music) | `jellyfin/jellyfin` |
| Plex | Media server (requires account) | `plexinc/pms-docker` |
| Navidrome | Music streaming server | `deluan/navidrome` |
| Kavita | eBook / manga / comic server | `kizaing/kavita` |
| Paperless-ngx | Document management with OCR | `ghcr.io/paperless-ngx/paperless-ngx` |
| Stirling-PDF | PDF tools web app | `frooodle/s-pdf` |

---

## Knowledge & Notes

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Outline | Team wiki and knowledge base | `outlinewiki/outline` |
| BookStack | Simple wiki with book/chapter/page structure | `lscr.io/linuxserver/bookstack` |
| Wiki.js | Modern wiki with many backends | `requarks/wiki` |
| Trilium Notes | Hierarchical personal note-taking | `zadam/trilium` |
| Memos | Lightweight micro-notes / Twitter-like journal | `neosmemo/memos` |
| Affine | Docs + whiteboard collaborative workspace | `ghcr.io/toeverything/affine-graphql` |

---

## Project Management & Support

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Plane | Open-source Jira alternative | `makeplane/plane-backend` |
| Linear-like (Huly) | All-in-one project / HR platform | `hardcoreeng/huly` |
| Vikunja | Task manager / to-do list | `vikunja/api` |
| Gitness | Gitea+CI+projects by Harness | `harness/gitness` |
| Penpot | Open-source Figma alternative (design tool) | `penpotapp/backend` |
| Chatwoot | Customer support / live chat | `chatwoot/chatwoot` |
| Zammad | Helpdesk ticketing system | `zammad/zammad-docker-compose` |

---

## Security & Secrets

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Infisical | Open-source secrets manager (Vault alternative) | `infisical/infisical` |
| CyberArk Conjur | Enterprise secrets management | `cyberark/conjur` |
| Casdoor | Auth server + user management UI | `casbin/casdoor` |
| Crowdsec | Collaborative intrusion prevention | `crowdsecurity/crowdsec` |
| Fail2ban | Log-based intrusion prevention | (sidecar pattern) |
| Wazuh | SIEM + EDR security platform | `wazuh/wazuh-manager` |

---

## AI / LLM

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Ollama | Local LLM runner (llama, mistral, etc.) | `ollama/ollama` |
| Open WebUI | Chat UI for Ollama and OpenAI-compatible APIs | `ghcr.io/open-webui/open-webui` |
| LocalAI | OpenAI-compatible local inference server | `localai/localai` |
| AnythingLLM | RAG + LLM workspace | `mintplexlabs/anythingllm` |
| Flowise | LangChain visual workflow builder | `flowiseai/flowise` |
| Dify | LLM app builder with RAG and agents | `langgenius/dify-api` |

---

## Infrastructure & Homelab Utilities

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Portainer | Docker / Swarm / Kubernetes web GUI | `portainer/portainer-ce` |
| Dozzle | Real-time Docker log viewer | `amir20/dozzle` |
| Watchtower | Automated Docker image update daemon | `containrrr/watchtower` |
| Diun | Docker image update notifier | `crazymax/diun` |
| Heimdall | Application dashboard | `lscr.io/linuxserver/heimdall` |
| Homer | Static YAML-configured dashboard | `b4bz/homer` |
| IT-Tools | Handy developer tools web app | `corentinth/it-tools` |
| Glances | System monitoring web UI | `nicolargo/glances` |
| Homarr | Modern homelab dashboard | `ghcr.io/ajnart/homarr` |
| Ntfy | Push notifications self-hosted server | `binwiederhier/ntfy` |
| Gotify | Self-hosted push notifications | `gotify/server` |

---

## DNS & DHCP

| App | Description | Docker Hub / Image |
|-----|-------------|-------------------|
| Pi-hole | DNS sinkhole / ad blocker | `pihole/pihole` |
| Blocky | DNS proxy and blocker, Prometheus-native | `spx01/blocky` |
| AdGuard Home | DNS-level ad blocker with DHCP | `adguard/adguardhome` |
| Technitium DNS | Full-featured authoritative/recursive DNS | `technitium/dns-server` |
| Kea DHCP | ISC Kea DHCP server | `josenk/kea` |

---

_Add checkboxes and assignees here as services graduate from evaluation to implementation._
