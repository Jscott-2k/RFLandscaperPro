# RF Landscaper Pro

RF Landscaper Pro is an enterprise-grade application that streamlines landscaping business operations, including customer management, job scheduling, equipment tracking and team coordination.

## Dependencies

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and Docker Compose (optional)

## Containers

The base `docker-compose.yml` defines the backend, frontend and database. Development uses `docker-compose.override.yml` to add Prometheus, Grafana, MailHog and a Fluentd log server, keeping dependencies isolated and simplifying scaling.

## Project Structure

```
RFLandscaperPro/
├── docker-compose.yml          # Core services
├── docker-compose.override.yml # Development extras and overrides
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
