# RabbitMQ

Open-source message broker implementing AMQP, MQTT, and STOMP protocols.

- **Source:** https://github.com/rabbitmq/rabbitmq-server
- **License:** Mozilla Public License 2.0
- **Author/Company:** Broadcom (VMware)
- **Language(s):** Erlang
- **Docs:** https://www.rabbitmq.com/docs

## Description

RabbitMQ is a battle-tested message broker that enables asynchronous communication between services via queues and exchanges. It supports multiple messaging protocols (AMQP 0-9-1, AMQP 1.0, MQTT, STOMP) and exchange types (direct, fanout, topic, headers). It is widely used for task queues, pub/sub pipelines, and service decoupling in microservice architectures. The `-management-alpine` image bundles the web management UI and CLI tools in a small Alpine-based image.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RABBITMQ_DEFAULT_USER` | `guest` | Default admin username created on first boot |
| `RABBITMQ_DEFAULT_PASS` | `guest` | Default admin password |
| `RABBITMQ_DEFAULT_VHOST` | `/` | Default virtual host created on first boot |
| `RABBITMQ_NODE_NAME` | `rabbit@hostname` | Erlang node name; must be unique in a cluster |
| `RABBITMQ_NODE_PORT` | `5672` | AMQP listener port |
| `RABBITMQ_MANAGEMENT_PORT` | `15672` | Management UI and HTTP API port |
| `RABBITMQ_ERLANG_COOKIE` | _(random)_ | Shared secret for cluster node authentication |
| `RABBITMQ_VM_MEMORY_HIGH_WATERMARK` | `0.4` | Fraction of RAM at which flow control kicks in |
| `RABBITMQ_DISK_FREE_LIMIT` | `{mem_relative, 1.0}` | Minimum free disk space before publisher blocking |
| `RABBITMQ_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warning`, `error`, `critical` |
| `RABBITMQ_PLUGINS_DIR` | `/plugins` | Directory scanned for plugin `.ez` archives |
| `RABBITMQ_ENABLED_PLUGINS_FILE` | `/etc/rabbitmq/enabled_plugins` | List of plugins to activate on start |
| `RABBITMQ_CONFIG_FILE` | `/etc/rabbitmq/rabbitmq` | Base path for `rabbitmq.conf` / `rabbitmq.config` |
| `RABBITMQ_CONF_ENV_FILE` | _(unset)_ | Path to a file of additional env var overrides |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/rabbitmq` → `/var/lib/rabbitmq` | Persistent message store, definitions, Mnesia database |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `5672` | TCP | AMQP 0-9-1 client connections |
| `15672` | TCP | Management UI (HTTP) and REST API |

## Operational Notes

- The default `guest`/`guest` credentials only work from `localhost` inside the container. Set `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS` before first start; they are only applied when the Mnesia database is freshly created.
- To export/import definitions (exchanges, queues, bindings, users) use the management UI at `/api/definitions` or `rabbitmqadmin export`.
- Enable additional plugins by exec-ing into the container: `rabbitmq-plugins enable rabbitmq_shovel rabbitmq_federation`.
- The healthcheck uses `rabbitmq-diagnostics ping` which verifies the broker process is alive; for a deeper check use `rabbitmq-diagnostics check_running`.
- Place a `rabbitmq.conf` or `advanced.config` file into the data volume's `/var/lib/rabbitmq/.rabbitmq/` directory to override any setting not exposed as an env var.

## Latest Version

`rabbitmq:3-management-alpine`
