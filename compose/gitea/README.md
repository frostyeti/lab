# Gitea

Lightweight, self-hosted Git service with a GitHub-like web interface.

- **Source:** https://github.com/go-gitea/gitea
- **License:** MIT License
- **Author/Company:** Gitea project contributors
- **Language(s):** Go, TypeScript
- **Docs:** https://docs.gitea.com/

## Description

Gitea is a painless, self-hosted Git service that provides repositories, issues, pull requests, CI/CD (Actions), packages, wikis, and user/organization management. It is a fork of Gogs and is significantly more feature-rich while remaining lightweight enough to run on a Raspberry Pi. This deployment is configured against a PostgreSQL database and exposes both HTTP for the web UI and SSH for Git push/pull operations.

## Docker Image Environment Variables

Gitea supports two configuration mechanisms: `app.ini` file and `GITEA__section__KEY` environment variables. The environment variable form takes precedence over `app.ini`.

| Variable | Default | Description |
|----------|---------|-------------|
| `USER_UID` | `1000` | UID that the `git` user inside the container runs as (maps to host UID for file ownership) |
| `USER_GID` | `1000` | GID that the `git` user inside the container runs as |
| `GITEA__database__DB_TYPE` | `sqlite3` | Database backend: `sqlite3`, `postgres`, `mysql`, `mssql` |
| `GITEA__database__HOST` | _(unset)_ | Database host and port (e.g. `postgres:5432`) |
| `GITEA__database__NAME` | `gitea` | Database name |
| `GITEA__database__USER` | `root` | Database username |
| `GITEA__database__PASSWD` | _(unset)_ | Database password |
| `GITEA__database__SSL_MODE` | `disable` | PostgreSQL SSL mode: `disable`, `require`, `verify-full` |
| `GITEA__server__DOMAIN` | `localhost` | Domain name used in clone URLs and emails |
| `GITEA__server__SSH_DOMAIN` | `localhost` | Domain name used in SSH clone URLs |
| `GITEA__server__ROOT_URL` | `http://localhost:3000/` | Full public URL of the Gitea instance (must end with `/`) |
| `GITEA__server__HTTP_PORT` | `3000` | Port Gitea's HTTP server listens on |
| `GITEA__server__SSH_PORT` | `22` | SSH port advertised in clone URLs (should match the host-side mapped port) |
| `GITEA__server__START_SSH_SERVER` | `false` | Start Gitea's built-in SSH server (`true`) or rely on host sshd |
| `GITEA__server__DISABLE_SSH` | `false` | Completely disable SSH clone support |
| `GITEA__server__LFS_START_SERVER` | `false` | Enable Git LFS support |
| `GITEA__service__DISABLE_REGISTRATION` | `false` | Prevent new user self-registration |
| `GITEA__service__REQUIRE_SIGNIN_VIEW` | `false` | Require login to view any page |
| `GITEA__service__DEFAULT_KEEP_EMAIL_PRIVATE` | `false` | Hide user emails from public profiles by default |
| `GITEA__service__ENABLE_CAPTCHA` | `false` | Show CAPTCHA on registration form |
| `GITEA__mailer__ENABLED` | `false` | Enable sending emails (for notifications, password reset) |
| `GITEA__mailer__SMTP_ADDR` | _(unset)_ | SMTP server address |
| `GITEA__mailer__SMTP_PORT` | `587` | SMTP port |
| `GITEA__mailer__FROM` | _(unset)_ | Sender email address |
| `GITEA__mailer__USER` | _(unset)_ | SMTP authentication username |
| `GITEA__mailer__PASSWD` | _(unset)_ | SMTP authentication password |
| `GITEA__log__LEVEL` | `Info` | Log level: `Trace`, `Debug`, `Info`, `Warn`, `Error`, `Critical` |
| `GITEA__log__MODE` | `console` | Log output: `console`, `file`, `conn`, `smtp` |
| `GITEA__security__SECRET_KEY` | _(random)_ | HMAC secret for cookie signing; set explicitly and back up |
| `GITEA__security__INTERNAL_TOKEN` | _(random)_ | Token for internal API calls between Gitea processes |
| `GITEA__security__INSTALL_LOCK` | `false` | Lock the install page after setup (`true` prevents re-initialization) |
| `GITEA__actions__ENABLED` | `false` | Enable Gitea Actions (GitHub Actions-compatible CI/CD) |
| `GITEA__repository__DEFAULT_BRANCH` | `main` | Default branch name for new repositories |
| `GITEA__repository__DEFAULT_PRIVATE` | `last` | Default visibility for new repos: `last`, `private`, `public` |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/gitea` → `/data` | Repositories, attachments, avatars, LFS objects, SQLite database (if used) |
| `${MNT_DIR}/etc/gitea` → `/etc/gitea` | `app.ini` configuration file (writable by Gitea on first run) |
| `/etc/timezone` → `/etc/timezone` (ro) | Host timezone file for correct timestamps in the UI and logs |
| `/etc/localtime` → `/etc/localtime` (ro) | Host localtime binary for correct timestamps |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${GITEA_HTTP_PORT:-3000}` | TCP | HTTP web UI and Git smart HTTP clone/push |
| `${GITEA_SSH_PORT:-2222}` | TCP | Git SSH clone/push (mapped from container port 22) |

## Operational Notes

- **Database must exist before first start.** Create the `gitea` database and user in PostgreSQL manually (or via the postgres service's init scripts) before bringing up this container.
- On the very first HTTP request, Gitea shows an installation wizard. Most fields will be pre-populated from environment variables. Set `GITEA__security__INSTALL_LOCK=true` after completing setup to prevent re-initialization.
- The `GITEA__server__SSH_PORT` value should match the host-side port in the `ports:` mapping (`${GITEA_SSH_PORT:-2222}`). This is what Gitea advertises in SSH clone URLs — if they differ, clone commands will fail.
- `/etc/gitea` is mounted writable so Gitea can update `app.ini` during the install wizard. After installation, you can make it read-only or manage it manually.
- For `GITEA__security__SECRET_KEY` and `GITEA__security__INTERNAL_TOKEN`, generate random values with `openssl rand -hex 20` and store them in your secrets manager. Changing these after users have logged in will invalidate all sessions.
- Gitea Actions (CI/CD) requires registering runner agents separately via `gitea-act-runner`. Set `GITEA__actions__ENABLED=true` and follow the runner registration docs.

## Latest Version

`gitea/gitea:latest`
