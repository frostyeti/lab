# MySQL

The world's most popular open-source relational database.

- **Source:** https://github.com/docker-library/mysql
- **License:** GPL-2.0
- **Author/Company:** Oracle Corporation
- **Language(s):** C++
- **Docs:** https://dev.mysql.com/doc/refman/8.0/en/

## Description

MySQL is a widely-deployed open-source relational database management system known for its reliability, performance, and broad application support. MySQL 8.0 introduces native JSON support, window functions, roles, and improved Unicode handling. It is the default database for many popular self-hosted applications including WordPress, Nextcloud, phpMyAdmin, and various CMS platforms.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | `root` | **Required.** Password for the `root` superuser account. **Change this before any network exposure.** |
| `MYSQL_DATABASE` | `mydb` | Name of the database to create on first initialization. |
| `MYSQL_USER` | `user` | Non-root user created on first initialization with full access to `MYSQL_DATABASE`. |
| `MYSQL_PASSWORD` | `password` | Password for `MYSQL_USER`. **Change this in production.** |
| `MYSQL_ALLOW_EMPTY_PASSWORD` | — | Set to `yes` to allow the root account with no password. Not recommended. |
| `MYSQL_RANDOM_ROOT_PASSWORD` | — | Set to `yes` to generate a random root password printed to stdout on first init. |
| `MYSQL_ONETIME_PASSWORD` | — | Set to `yes` to expire the root password immediately, forcing a change on first login. |
| `MYSQL_ROOT_HOST` | `%` | Host from which the root user is allowed to connect. Default `%` means any host; restrict to `localhost` for higher security. |
| `MYSQL_INITDB_SKIP_TZINFO` | — | Set to any value to skip loading timezone info tables during initialization. |
| `MYSQL_CHARACTER_SET_SERVER` | `utf8mb4` | Default server character set. |
| `MYSQL_COLLATION_SERVER` | `utf8mb4_0900_ai_ci` | Default server collation. |
| `MYSQL_LOWER_CASE_TABLE_NAMES` | `0` | Set to `1` to make table names case-insensitive (common on Windows-originated schemas). Must be set at initialization. |
| `TZ` | — | Timezone for the container (e.g. `UTC`, `America/New_York`). |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/mysql` → `/var/lib/mysql` | Persistent database storage: InnoDB tablespaces, binary logs, system schema, and all user databases |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `3306` | TCP | MySQL protocol — all client connections |

## Operational Notes

- All `MYSQL_*` environment variables (user, database, passwords) are applied only on the **first run** when `/var/lib/mysql` is empty. Changing them after initialization has no effect — use SQL statements (`ALTER USER`, `CREATE DATABASE`) instead.
- To run initialization SQL on first start, mount `*.sql`, `*.sql.gz`, or `*.sh` files into `/docker-entrypoint-initdb.d/`. Files execute in alphabetical order when the data directory is uninitialized.
- **Change the default passwords** (`root` / `password`) before connecting any application, especially on a shared network.
- Only attached to `vnet-backend` — never expose MySQL on `vnet-frontend`.
- The healthcheck uses `mysqladmin ping` against `localhost` with root credentials. A `start_period` of 30s is set because InnoDB recovery on large datasets can take time.
- MySQL 8.0 changed the default authentication plugin from `mysql_native_password` to `caching_sha2_password`. Older client libraries may require `--default-authentication-plugin=mysql_native_password` added to the container command.
- For applications requiring `utf8mb4` with full 4-byte Unicode support (emoji, CJK supplemental), ensure the application's connection string also specifies `charset=utf8mb4`.

## Latest Version

`mysql:8.0`
