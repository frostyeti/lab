# Grafana OnCall

On-call scheduling, escalation, and alert routing integrated with Grafana.

- **Source:** https://github.com/grafana/oncall
- **License:** AGPL-3.0
- **Author/Company:** Grafana Labs
- **Language(s):** Python (Django), TypeScript
- **Docs:** https://grafana.com/docs/oncall/latest/

## Description

Grafana OnCall is an on-call management system that aggregates alerts from Grafana, Alertmanager, PagerDuty, and other sources and routes them to the right people via on-call schedules, escalation chains, and notification rules. It integrates directly with Grafana as a plugin, providing a unified alerting and on-call interface. The self-hosted (OSS) edition supports Slack, SMS, phone, email, and webhook notifications.

## Docker Image Environment Variables

### `grafana/oncall` (web + worker)

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://oncall.local` | Public URL of the OnCall API, used for webhooks and Grafana plugin registration |
| `SECRET_KEY` | `changeme-replace-with-random-64-char-string` | Django secret key — **must be a long random string in production** |
| `ALLOWED_HOSTS` | `*` | Django `ALLOWED_HOSTS` — restrict to your hostname in production |
| `DATABASE_TYPE` | `postgresql` | Database backend (`postgresql`, `sqlite3`) |
| `DATABASE_HOST` | `oncall-db` | PostgreSQL hostname |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_NAME` | `oncall` | PostgreSQL database name |
| `DATABASE_USER` | `oncall` | PostgreSQL username |
| `DATABASE_PASSWORD` | `oncall` | PostgreSQL password |
| `BROKER_TYPE` | `redis` | Celery broker backend (`redis`, `rabbitmq`) |
| `REDIS_URI` | `redis://oncall-redis:6379/0` | Redis connection URI for Celery broker and cache |
| `DJANGO_SETTINGS_MODULE` | `settings.hobby` | Django settings module (`settings.hobby` for single-node, `settings.prod` for HA) |
| `CELERY_WORKER_BEAT_ENABLED` | `True` | Run the Celery beat scheduler inside the web container (disable when running a dedicated beat container) |
| `GRAFANA_API_URL` | `http://grafana:3000` | Internal URL of the Grafana instance used for plugin communication |
| `GRAFANA_API_KEY` | _(unset)_ | Grafana service account token for OnCall plugin integration |
| `SLACK_CLIENT_OAUTH_ID` | _(unset)_ | Slack app OAuth client ID for Slack integration |
| `SLACK_CLIENT_OAUTH_SECRET` | _(unset)_ | Slack app OAuth client secret |
| `SLACK_SIGNING_SECRET` | _(unset)_ | Slack signing secret for verifying webhook payloads |
| `TWILIO_ACCOUNT_SID` | _(unset)_ | Twilio account SID for SMS/voice notifications |
| `TWILIO_AUTH_TOKEN` | _(unset)_ | Twilio auth token |
| `TWILIO_NUMBER` | _(unset)_ | Twilio phone number for outbound SMS/calls |
| `EMAIL_HOST` | _(unset)_ | SMTP host for email notifications |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_HOST_USER` | _(unset)_ | SMTP username |
| `EMAIL_HOST_PASSWORD` | _(unset)_ | SMTP password |
| `EMAIL_FROM_ADDRESS` | _(unset)_ | From address for notification emails |

### `postgres` (oncall-db)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `oncall` | Database name |
| `POSTGRES_USER` | `oncall` | Database user |
| `POSTGRES_PASSWORD` | `oncall` | Database password |

### `redis` (oncall-redis)

No environment variables set; uses Redis defaults.

## Volumes

| Path | Purpose |
|------|---------|
| `data/oncall` | OnCall application data — attachments and plugin files (`/var/lib/oncall`) |
| `data/oncall-db` | PostgreSQL data directory |
| `data/oncall-redis` | Redis AOF/RDB persistence |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${ONCALL_PORT:-8080}` | TCP (HTTP) | OnCall API and web interface |

## Operational Notes

- `SECRET_KEY` must be a cryptographically random string of at least 50 characters. Generate one with `openssl rand -hex 32`. **Do not use the default in production.**
- `BASE_URL` must be the externally reachable URL of the OnCall API. The Grafana OnCall plugin uses this URL to register webhooks and verify connectivity — an internal Docker hostname will not work when Grafana is accessed from a browser.
- After first start, install the **Grafana OnCall plugin** in Grafana (`grafana-oncall-app`) and configure it with the `BASE_URL` and a Grafana service account API key set in `GRAFANA_API_KEY`.
- The `oncall-worker` container runs the Celery task queue that handles alert processing, notification delivery, and scheduled maintenance. It must share the same `SECRET_KEY`, database credentials, and Redis URI as the web container.
- `DJANGO_SETTINGS_MODULE=settings.hobby` is intended for single-node deployments. For a more production-ready setup use `settings.prod` and run a dedicated Celery beat container.
- Database migrations run automatically on web container startup.
- The Celery worker health check uses `celery inspect ping` which may take up to 60 seconds on first start — allow sufficient `start_period` in dependent services.

## Latest Version

`grafana/oncall:latest`
