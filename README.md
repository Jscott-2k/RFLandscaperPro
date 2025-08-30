# RF Landscaper Pro

RF Landscaper Pro is an enterprise-grade application that streamlines landscaping business operations, including customer management, job scheduling, equipment tracking and team coordination.

## Dependencies

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and Docker Compose (optional)

## Containers

The root `docker-compose.yml` runs the backend, frontend, database, Prometheus, Grafana, MailHog and a Fluentd log server in separate containers, keeping dependencies isolated and simplifying scaling.

## Project Structure

```
RFLandscaperPro/
├── docker-compose.yml       # Multi-service stack
├── docker-compose.override.yml  # Development overrides
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
