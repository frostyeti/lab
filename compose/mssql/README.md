# Microsoft SQL Server

Enterprise-grade relational database engine from Microsoft, running on Linux.

- **Source:** https://github.com/microsoft/mssql-docker
- **License:** Microsoft Software License (proprietary; Developer edition free for non-production use)
- **Author/Company:** Microsoft
- **Language(s):** C++
- **Docs:** https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker

## Description

Microsoft SQL Server for Linux is the full SQL Server engine packaged as a Docker image. It supports T-SQL, stored procedures, full-text search, and is compatible with applications built for SQL Server on Windows. The Developer edition (used here by default) has all Enterprise features but is licensed for development and testing only. It is commonly used in homelabs to run .NET or legacy Windows applications that require SQL Server.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ACCEPT_EULA` | — | **Required.** Must be set to `Y` to accept the End User License Agreement. The container will not start without this. |
| `SA_PASSWORD` | `YourStrong@Passw0rd` | Password for the `sa` (system administrator) account. Must meet SQL Server complexity requirements: ≥8 chars, upper + lower + digit + symbol. **Change this in production.** |
| `MSSQL_SA_PASSWORD` | — | Alias for `SA_PASSWORD` used in newer image versions; both are accepted. |
| `MSSQL_PID` | `Developer` | SQL Server edition/product ID. Options: `Developer`, `Express`, `Standard`, `Enterprise`, `EnterpriseCore`, or a product key. |
| `MSSQL_TCP_PORT` | `1433` | TCP port SQL Server listens on inside the container. |
| `MSSQL_IP_ADDRESS` | `0.0.0.0` | IP address SQL Server binds to inside the container. |
| `MSSQL_LCID` | `1033` | Language/locale ID for SQL Server (1033 = English US). |
| `MSSQL_COLLATION` | `SQL_Latin1_General_CP1_CI_AS` | Default server collation. |
| `MSSQL_MEMORY_LIMIT_MB` | — | Maximum memory (MB) SQL Server may use. Useful for limiting resource usage on a shared host. |
| `MSSQL_AGENT_ENABLED` | `false` | Set to `true` to enable the SQL Server Agent service for scheduled jobs. |
| `MSSQL_ENABLE_HADR` | `0` | Set to `1` to enable High Availability / Disaster Recovery features. |
| `TZ` | — | Timezone for the container OS (e.g. `America/New_York`). SQL Server uses UTC internally. |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/data/mssql` → `/var/opt/mssql` | All SQL Server data: system databases, user databases (`.mdf`/`.ldf`), error logs, and configuration |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `1433` | TCP | SQL Server TDS (Tabular Data Stream) protocol — all client connections |

## Operational Notes

- **`ACCEPT_EULA=Y` is mandatory.** The container exits immediately without it.
- The `sa` password must satisfy SQL Server's password policy (minimum 8 characters with mixed case, digits, and symbols). The default `YourStrong@Passw0rd` is intentionally a placeholder — change it before use.
- The healthcheck uses `sqlcmd` with `-No` (trust server certificate, required for newer image versions) to run `SELECT 1`. The `start_period` is 60s because SQL Server takes significantly longer to initialize than most services.
- `MSSQL_PID=Developer` is appropriate for homelab and development. Do not use `Developer` edition in production — use `Standard` or `Enterprise` with a valid license.
- Only attached to `vnet-backend` — never expose SQL Server on `vnet-frontend`.
- To run initialization scripts on first start, mount `.sql` files into the container and execute them via a sidecar init container or an `up:after` hook using `sqlcmd`.
- SQL Server requires at minimum **2 GB RAM** on the host. For a memory-constrained homelab, set `MSSQL_MEMORY_LIMIT_MB=1024` (Express edition minimum).
- The `sqlcmd` tool path changed between image versions; newer `2022-latest` images use `/opt/mssql-tools18/bin/sqlcmd` (as in the healthcheck), while older images use `/opt/mssql-tools/bin/sqlcmd`.

## Latest Version

`mcr.microsoft.com/mssql/server:2022-latest`
