# Vaultwarden

Unofficial Bitwarden-compatible server written in Rust, designed for self-hosting.

- **Source:** https://github.com/dani-garcia/vaultwarden
- **License:** GNU Affero General Public License v3.0 (AGPL-3.0)
- **Author/Company:** Daniel García (dani-garcia) and contributors
- **Language(s):** Rust
- **Docs:** https://github.com/dani-garcia/vaultwarden/wiki

## Description

Vaultwarden is a lightweight, self-hosted alternative to the official Bitwarden server that is fully compatible with all official Bitwarden clients (browser extensions, desktop apps, mobile apps, CLI). It reimplements the Bitwarden API in Rust using a fraction of the resources of the official server. It supports organizations, collections, two-factor authentication, the admin panel, and emergency access. All vault data is stored locally, making it ideal for homelab and small-team deployments where data sovereignty matters.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | _(unset)_ | Full public URL (e.g. `https://vw.example.com`); required for WebAuthn, SSO, and email links |
| `SIGNUPS_ALLOWED` | `true` | Allow new user self-registration; set to `false` after initial setup |
| `ADMIN_TOKEN` | _(unset)_ | Bcrypt hash (or plaintext) token to access the `/admin` panel; leave unset to disable the panel |
| `WEBSOCKET_ENABLED` | `false` | Enable WebSocket notifications for real-time vault sync across clients |
| `LOG_LEVEL` | `warn` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error` |
| `ROCKET_PORT` | `80` | HTTP port the server listens on inside the container |
| `ROCKET_WORKERS` | `10` | Number of async worker threads for the Rocket web framework |
| `DATABASE_URL` | `data/db.sqlite3` | SQLite file path or PostgreSQL/MySQL connection string |
| `DATA_FOLDER` | `data` | Root directory for all persistent data inside the container |
| `ATTACHMENTS_FOLDER` | `data/attachments` | Directory for file attachments |
| `SENDS_FOLDER` | `data/sends` | Directory for Bitwarden Send files |
| `WEB_VAULT_ENABLED` | `true` | Serve the Bitwarden web vault UI |
| `WEB_VAULT_FOLDER` | `web-vault/` | Path to the pre-built web vault static assets |
| `SMTP_HOST` | _(unset)_ | SMTP server hostname for email notifications and 2FA |
| `SMTP_FROM` | _(unset)_ | Sender email address |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURITY` | `starttls` | SMTP security mode: `starttls`, `force_tls`, or `off` |
| `SMTP_USERNAME` | _(unset)_ | SMTP authentication username |
| `SMTP_PASSWORD` | _(unset)_ | SMTP authentication password |
| `INVITATION_ORG_NAME` | `Vaultwarden` | Organization name shown in email invitations |
| `PASSWORD_ITERATIONS` | `600000` | PBKDF2 iteration count for master password hashing |
| `SHOW_PASSWORD_HINT` | `false` | Show password hint on login page |
| `SIGNUPS_DOMAINS_WHITELIST` | _(unset)_ | Comma-separated list of email domains allowed to register |
| `ORG_CREATION_USERS` | _(unset)_ | Comma-separated emails allowed to create organizations; empty = all users |
| `EMERGENCY_ACCESS_ALLOWED` | `true` | Enable emergency access (account takeover) feature |
| `SENDS_ALLOWED` | `true` | Enable Bitwarden Send (encrypted file/text sharing) feature |
| `PUSH_ENABLED` | `false` | Enable push notifications via Bitwarden's relay service |
| `PUSH_INSTALLATION_ID` | _(unset)_ | Installation ID from bitwarden.com for push relay |
| `PUSH_INSTALLATION_KEY` | _(unset)_ | Installation key from bitwarden.com for push relay |
| `DISABLE_ICON_DOWNLOAD` | `false` | Disable fetching website favicons (privacy/security) |
| `ICON_CACHE_TTL` | `2592000` | Icon cache time-to-live in seconds (default 30 days) |
| `IP_HEADER` | `X-Real-IP` | HTTP header to read the real client IP from behind a reverse proxy |
| `USE_SYSLOG` | `false` | Send logs to syslog instead of stdout |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/vaultwarden` → `/data` | All persistent data: SQLite database, attachments, sends, icon cache, RSA keys |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${VAULTWARDEN_PORT:-8888}` | TCP | HTTP web vault UI and Bitwarden API |
| `3012` | TCP | WebSocket notifications (internal; routed via Traefik label) |

## Operational Notes

- **Change `ADMIN_TOKEN` before first start.** The default value `changeme` is a plaintext token; generate a bcrypt hash with `echo -n "mypassword" | htpasswd -niBC 12 "" | tr -d ':\n'` and set that as `ADMIN_TOKEN`. Access the admin panel at `/admin`.
- Set `SIGNUPS_ALLOWED=false` (already the default in this compose) after creating your account to prevent unauthorized registrations. Existing users are unaffected.
- `DOMAIN` must match the exact URL clients use to reach the server. Mismatch causes WebAuthn (passkey) registration and TOTP enrollment links to fail.
- `WEBSOCKET_ENABLED=true` is set in this compose. The Traefik labels route `/notifications/hub` to the WebSocket port `3012` for live sync. When using caddy-docker-proxy or a manual proxy, add a separate upstream rule for `/notifications/hub` → port 3012.
- The data directory contains the SQLite database (`db.sqlite3`) and RSA keys. Back up this entire directory regularly. For larger deployments, switch to PostgreSQL via `DATABASE_URL`.

## Latest Version

`vaultwarden/server:latest`
