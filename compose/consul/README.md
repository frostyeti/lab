# Consul

HashiCorp service mesh and service discovery platform with distributed key-value storage.

- **Source:** https://github.com/hashicorp/consul
- **License:** Business Source License 1.1 (BSL)
- **Author/Company:** HashiCorp
- **Language(s):** Go
- **Docs:** https://developer.hashicorp.com/consul/docs

## Description

Consul provides service discovery (DNS and HTTP API), distributed key-value storage, health checking, and a service mesh with mutual TLS. Services register themselves with Consul and query it to find other services, eliminating hardcoded endpoints. It can also function as a configuration backend for Vault, Nomad, and other HashiCorp tools. This deployment runs a single-node server in bootstrap mode with the web UI enabled.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONSUL_BIND_INTERFACE` | `eth0` | Network interface to bind the cluster and RPC listener to |
| `CONSUL_CLIENT_INTERFACE` | `eth0` | Network interface to bind the client (HTTP/DNS) listener to |
| `CONSUL_LOCAL_CONFIG` | _(unset)_ | Inline JSON configuration passed directly to the agent |
| `CONSUL_HTTP_ADDR` | `http://127.0.0.1:8500` | Address used by the CLI to contact the agent HTTP API |
| `CONSUL_HTTP_TOKEN` | _(unset)_ | ACL token used by the CLI for authenticated requests |
| `CONSUL_DATACENTER` | `dc1` | Datacenter name this agent belongs to |
| `CONSUL_DOMAIN` | `consul` | DNS domain served by the Consul DNS interface |
| `CONSUL_TLS_SERVER_NAME` | _(unset)_ | SNI hostname used when connecting to Consul over TLS |
| `CONSUL_GRPC_ADDR` | _(unset)_ | Address for the gRPC API (used by Envoy proxies) |
| `CONSUL_CACERT` | _(unset)_ | Path to CA certificate file for TLS verification |
| `CONSUL_CLIENT_CERT` | _(unset)_ | Path to client certificate for mutual TLS |
| `CONSUL_CLIENT_KEY` | _(unset)_ | Path to client private key for mutual TLS |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/consul` → `/consul/data` | Persistent Raft data, snapshots, and key-value store |
| `${MNT_DIR}/etc/consul` → `/consul/config` | JSON/HCL configuration files loaded at startup |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${CONSUL_HTTP_PORT:-8500}` | TCP | HTTP API and web UI |
| `8600` | UDP | DNS interface for service discovery queries |
| `8600` | TCP | DNS interface (TCP fallback for large responses) |
| `8300` | TCP | RPC — server-to-server and client-to-server (not exposed) |
| `8301` | TCP/UDP | LAN gossip (Serf) — peer health (not exposed) |
| `8302` | TCP/UDP | WAN gossip — cross-datacenter federation (not exposed) |

## Operational Notes

- This node starts with `-bootstrap-expect=1` (single-node cluster). To form a multi-node cluster, change this value and add `-retry-join` flags pointing at other server nodes.
- `-client=0.0.0.0` combined with `CONSUL_CLIENT_INTERFACE` makes the HTTP API and DNS reachable from other containers and the host.
- Drop `.json` or `.hcl` configuration files into `${MNT_DIR}/etc/consul` to extend the configuration without modifying the command line (ACL config, TLS settings, telemetry, etc.).
- To enable ACLs, add a config file with `{ "acl": { "enabled": true, "default_policy": "deny" } }` and run `consul acl bootstrap` after the first start.
- Consul DNS can be forwarded from a host resolver (e.g. `systemd-resolved`) to resolve `.consul` names from the host: point DNS for `consul` domain to `127.0.0.1:8600`.

## Latest Version

`hashicorp/consul:latest`
