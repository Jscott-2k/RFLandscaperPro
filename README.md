# RF Landscaper Pro

RF Landscaper Pro is an enterprise-grade application that streamlines landscaping business operations, including customer management, job scheduling, equipment tracking and team coordination.

## Dependencies

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and Docker Compose (optional)

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

To launch the full stack for local work, use the helper scripts in the repository root.

- **macOS/Linux**: `./development.sh`
- **Windows PowerShell**: `pwsh -File .\development.ps1`

These scripts ensure the `rflandscaperpro` Docker network exists and start the database, backend, frontend, and supporting tools using `docker compose`.

> **PowerShell note:** Windows may block script execution. Temporarily bypass the policy with `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`. Run the script from the repository root, using Windows path separators (for example, `.\development.ps1`).

