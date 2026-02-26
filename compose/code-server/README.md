# code-server

VS Code running in the browser, served from a remote server or homelab host.

- **Source:** https://github.com/coder/code-server
- **License:** MIT License
- **Author/Company:** Coder Technologies
- **Language(s):** TypeScript, Node.js
- **Docs:** https://coder.com/docs/code-server/latest

## Description

code-server runs Visual Studio Code on a remote machine and serves it in a web browser, giving full IDE functionality (extensions, terminal, debugger, source control) from any device. This deployment uses the LinuxServer.io image which adds proper UID/GID remapping, a built-in HTTPS proxy (via nginx), and the standard LSIO environment variables for permission management. It is useful for development on headless homelab servers, Chromebooks, or tablet devices.

## Docker Image Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUID` | `1000` | User ID that the code-server process runs as (maps to host user for file ownership) |
| `PGID` | `1000` | Group ID that the code-server process runs as |
| `TZ` | `UTC` | Container timezone (e.g. `America/New_York`) |
| `PASSWORD` | _(unset)_ | Password required to access the web UI; set a strong value |
| `SUDO_PASSWORD` | _(unset)_ | Password for `sudo` inside the integrated terminal |
| `SUDO_PASSWORD_HASH` | _(unset)_ | Bcrypt hash alternative to `SUDO_PASSWORD` (more secure) |
| `DEFAULT_WORKSPACE` | `/workspace` | Directory opened automatically when VS Code starts |
| `PROXY_DOMAIN` | _(unset)_ | Domain used for port forwarding proxies (e.g. `code.example.com`); enables VS Code port proxying feature |
| `DOCKER_MODS` | _(unset)_ | LSIO Docker mods to install at startup (e.g. additional VS Code extensions or CLI tools) |
| `INSTALL_PACKAGES` | _(unset)_ | Space-separated list of Alpine/Ubuntu packages to install on container start |
| `INSTALL_PIP_PACKAGES` | _(unset)_ | Space-separated list of pip packages to install on container start |
| `VSCODE_EXTENSION_IDS` | _(unset)_ | Pipe-separated list of VS Code extension IDs to install automatically |
| `HASHED_PASSWORD` | _(unset)_ | Argon2 or bcrypt hash alternative to plaintext `PASSWORD` |
| `CS_DISABLE_GETTING_STARTED_OVERRIDE` | _(unset)_ | Set to `1` to suppress the getting-started tab on first launch |

## Volumes

| Path | Purpose |
|------|---------|
| `${MNT_DIR}/etc/code-server` → `/config` | LSIO config directory: VS Code user settings, keybindings, installed extensions |
| `${MNT_DIR}/data/code-server` → `/workspace` | Default workspace directory opened in VS Code |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `${CODE_SERVER_PORT:-8443}` | TCP | HTTPS web UI (served with a self-signed cert by the LSIO nginx layer) |

## Operational Notes

- The LSIO image serves on port `8443` with a self-signed TLS certificate by default. Browsers will show a warning unless you put it behind a trusted reverse proxy (Traefik/Caddy) that handles real TLS termination.
- Set both `PASSWORD` and `SUDO_PASSWORD` before first start. Without a password, the UI is accessible to anyone who can reach the port.
- The `/config` volume persists VS Code settings, extensions, and the LSIO supervisor config. Extensions installed via the UI are stored here; they survive container recreation.
- The `/workspace` volume is the default working directory. Mount additional host paths as extra volumes if you want to edit code elsewhere on the host (e.g. `${HOME}/projects:/projects`).
- `PUID`/`PGID` should match the UID/GID of the host user who owns the workspace files to avoid permission errors when creating or editing files.
- The healthcheck hits `/healthz` which is provided by the LSIO nginx wrapper, not the VS Code server itself.

## Latest Version

`lscr.io/linuxserver/code-server:latest`
