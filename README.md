# RF Landscaper Pro

RF Landscaper Pro is an enterprise-grade application that streamlines landscaping business operations, including customer management, job scheduling, equipment tracking and team coordination.

## Dependencies

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and Docker Compose (optional)

## Package Management

This monorepo uses a single root `package-lock.json` for all workspaces; per-package lockfiles are not used. After adding or upgrading dependencies, run `npm run lockfiles` to regenerate the lockfile before committing.

## Windows Setup

### Required tools

- [Docker Desktop](https://www.docker.com/products/docker-desktop) with the WSL2 backend
- [PowerShell](https://learn.microsoft.com/powershell/) (pwsh) 7 or later
- [Git for Windows](https://gitforwindows.org/)

### Enable WSL integration

1. Install a Linux distribution with `wsl --install` and ensure WSL 2 is the default: `wsl --set-default-version 2`.
2. In Docker Desktop, open **Settings ➜ General** and check **Use the WSL 2 based engine**.
3. Under **Settings ➜ Resources ➜ WSL Integration**, enable your distribution so Docker shares its daemon with WSL.

### Path mapping

Inside WSL, Windows paths like `C:\Users\you\project` appear as `/mnt/c/Users/you/project`. Use these Linux-style paths in shells, `docker compose` commands, and volume mounts.

### Troubleshooting

- **Line endings:** avoid CRLF issues by configuring Git with `git config core.autocrlf input` and convert problem files using `dos2unix`.
- **File permissions:** if scripts lose execute bits, restore them with `chmod +x` inside WSL and consider `git config core.filemode false`.

## Containers

The base `docker-compose.yml` builds only the backend service. Development uses `docker-compose.override.yml` to spin up a local PostgreSQL database, the frontend, and tooling like Prometheus, Grafana, MailHog and a Fluentd log server, keeping dependencies isolated and simplifying scaling. The frontend can also be started independently using its own compose file under `frontend/`.

## Project Structure

```
RFLandscaperPro/
├── docker-compose.yml          # Backend service
├── docker-compose.override.yml # Development extras and frontend/database
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication and authorization
│   │   ├── customers/      # Customer management
│   │   ├── equipment/      # Equipment tracking
│   │   ├── jobs/           # Job management
│   │   ├── users/          # User management
│   │   └── common/         # Shared utilities
│   ├── Dockerfile          # Production container
│   └── fly.toml            # Fly.io deployment configuration
├── frontend/                # Angular web client
│   ├── Dockerfile          # Production container
│   └── README.md           # Frontend documentation
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

## Development

To launch the full stack for local work, use the helper scripts in the repository root or the npm run scripts.

### Using npm

- `npm run dev` – start the backend and frontend locally without Docker
- `npm run dev:compose` – launch the full stack with Docker Compose
- `npm run down` – stop running containers

### Using shell scripts

- **macOS/Linux (Docker)**: `./scripts/development.sh`
- **Windows PowerShell (Docker)**: `pwsh -File .\scripts\development.ps1`
- **Run without Docker**: add `--local` on macOS/Linux or `-Local` in PowerShell to start the backend and frontend directly.

These scripts ensure the `rflandscaperpro` Docker network exists and start the database, backend, frontend, and supporting tools using `docker compose` when not using the local option.

When you are finished with the stack, shut everything down with the teardown scripts:

- **macOS/Linux**: `./scripts/down.sh`
- **Windows PowerShell**: `pwsh -File .\scripts\down.ps1`

Pass `--prune` to either script to remove the `rflandscaperpro` Docker network after the containers stop.

> **PowerShell note:** Windows may block script execution. Temporarily bypass the policy with `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`. Run the script from the repository root, using Windows path separators (for example, `.\scripts\development.ps1`).

