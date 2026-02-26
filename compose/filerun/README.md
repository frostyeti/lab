# filerun

Self-hosted file manager and personal cloud with a Nextcloud-like web interface.

- **Source:** https://github.com/filerun/docker
- **License:** Proprietary (free for personal use)
- **Author/Company:** FileRun
- **Language(s):** PHP
- **Docs:** https://docs.filerun.com/

## Description

FileRun is a self-hosted file management and sharing platform that runs on PHP and MariaDB. It provides a polished web UI for browsing, uploading, sharing, and previewing files, with support for WebDAV/CalDAV/CardDAV clients, full-text search via Elasticsearch (optional), media previews, and file versioning. It is commonly used as a lightweight personal cloud or team file server alternative to Nextcloud.

## Docker Image Environment Variables

### filerun-db (`mariadb:10.11`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | `rootpassword` | MariaDB root password — **change in production** |
| `MYSQL_DATABASE` | `filerun` | Database to create on first start |
| `MYSQL_USER` | `filerun` | Application database user |
| `MYSQL_PASSWORD` | `filerun` | Application database user password — **change in production** |

### filerun (`filerun/filerun`)

| Variable | Default | Description |
|----------|---------|-------------|
| `FR_DB_HOST` | `filerun-db` | MariaDB hostname |
| `FR_DB_PORT` | `3306` | MariaDB port |
| `FR_DB_NAME` | `filerun` | Database name |
| `FR_DB_USER` | `filerun` | Database user |
| `FR_DB_PASS` | `filerun` | Database password |
| `APACHE_RUN_USER` | `www-data` | Unix user Apache runs as |
| `APACHE_RUN_GROUP` | `www-data` | Unix group Apache runs as |
| `APPLICATION_URL` | `http://files.local` | Public base URL — used for share links and WebDAV paths |
| `FR_TIKA_URL` | _(unset)_ | Apache Tika server URL for full-text document search |
| `FR_ELASTICSEARCH_URL` | _(unset)_ | Elasticsearch URL for full-text file content search |
| `FR_SMTP_HOST` | _(unset)_ | SMTP server for email notifications and password resets |
| `FR_SMTP_PORT` | `587` | SMTP port |
| `FR_SMTP_USER` | _(unset)_ | SMTP username |
| `FR_SMTP_PASS` | _(unset)_ | SMTP password |
| `FR_SMTP_FROM` | _(unset)_ | From address for outbound email |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/filerun/html` → `/var/www/html` | FileRun PHP application files — populated on first start |
| `${MNT_DIR}/data/filerun/user-files` → `/user-files` | User file storage root — all uploaded/synced files live here |
| `${MNT_DIR}/data/filerun/db` → `/var/lib/mysql` | MariaDB data directory |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${FILERUN_PORT:-8090}` → `80` | TCP | FileRun web UI (Apache/PHP) |

## Operational Notes

- **First-run credentials:** Default login is `superuser` / `superuser`. Change the password immediately after first login.
- **APPLICATION_URL:** Must match the URL users type in their browser (and WebDAV clients). Incorrect URLs break share links and CalDAV/CardDAV discovery.
- **html volume:** The `/var/www/html` volume is populated by the container on first start. Do not pre-populate it — let FileRun write its own files on initial boot.
- **User files location:** All files users upload or sync end up under `${MNT_DIR}/data/filerun/user-files`. Back up this directory to protect user data.
- **WebDAV:** Users can mount their FileRun storage as a WebDAV drive at `http://<host>/dav.php`. iOS/macOS Files app and Windows Map Network Drive both work with this endpoint.
- **Full-text search:** Optionally add Apache Tika (for document parsing) and Elasticsearch to `FR_TIKA_URL` / `FR_ELASTICSEARCH_URL` for content search inside PDFs and Office files.
- **inotify:** For large installations, increase `fs.inotify.max_user_watches` on the host if FileRun reports file-watcher errors.
- **PHP upload limits:** The default PHP `upload_max_filesize` is 500 MB. To raise it, place a custom `php.ini` override in the html volume.

## Latest Version

`filerun/filerun:latest`
