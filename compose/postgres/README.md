# PostgreSQL

Powerful, open-source object-relational database system.

- **Source:** https://github.com/docker-library/postgres
- **License:** PostgreSQL License (permissive)
- **Author/Company:** PostgreSQL Global Development Group
- **Language(s):** C
- **Docs:** https://www.postgresql.org/docs/current/

## Description

PostgreSQL is a production-grade relational database known for its extensibility, standards compliance, and support for advanced data types including JSON, arrays, and full-text search. It is the default database backend for many self-hosted applications (Gitea, Nextcloud, Authentik, etc.). The official Docker image supports initialization scripts, multiple databases, and locale configuration out of the box.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Superuser account created on first initialization. |
| `POSTGRES_PASSWORD` | `postgres` | Password for `POSTGRES_USER`. **Required** (or use `POSTGRES_PASSWORD_FILE`). Change this in production. |
| `POSTGRES_DB` | `postgres` | Name of the default database created on first initialization. Defaults to the value of `POSTGRES_USER`. |
| `POSTGRES_PASSWORD_FILE` | — | Path to a file containing the password (Docker secrets alternative to `POSTGRES_PASSWORD`). |
| `POSTGRES_INITDB_ARGS` | — | Additional arguments passed to `initdb` (e.g. `--data-checksums`). |
| `POSTGRES_INITDB_WALDIR` | — | Path for the WAL directory, useful for separating WAL onto a different volume. |
| `POSTGRES_HOST_AUTH_METHOD` | `scram-sha-256` | Authentication method for `pg_hba.conf`. Use `trust` for local dev only. |
| `POSTGRES_SHARED_BUFFERS` | — | Amount of memory for shared buffers (e.g. `256MB`). Configures `shared_buffers` in `postgresql.conf`. |
| `PGDATA` | `/var/lib/postgresql/data` | Directory where PostgreSQL stores its data files. Override to use a subdirectory (avoids `lost+found` issues on some filesystems). |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/postgres` → `/var/lib/postgresql/data` | Persistent database storage. All databases, tables, WAL segments, and config files live here. |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `5432` | TCP | PostgreSQL wire protocol — clients and applications connect here |

## Operational Notes

- The `data/` volume is initialized by `initdb` on the **first run only**. Changing `POSTGRES_USER`, `POSTGRES_PASSWORD`, or `POSTGRES_DB` after initialization has no effect — modify users via `psql` instead.
- To run initialization SQL or shell scripts on first startup, mount `*.sql` or `*.sh` files into `/docker-entrypoint-initdb.d/`. They execute in alphabetical order only when the data directory is empty.
- **Change the default password** (`postgres`) before connecting any application. It can be changed post-init: `ALTER USER postgres WITH PASSWORD 'newpassword';`
- `PGDATA` defaults to `/var/lib/postgresql/data`. Some bind-mount filesystems place a `lost+found` directory there, which causes `initdb` to fail. Fix by setting `PGDATA=/var/lib/postgresql/data/pgdata` and adjusting the volume mount accordingly.
- Only attached to `vnet-backend` — never expose PostgreSQL on `vnet-frontend`.
- The healthcheck uses `pg_isready` which checks the TCP listener, not query execution. For a deeper check, use `pg_isready -U postgres -d postgres` (as configured).

## Latest Version

`postgres:16-alpine`
