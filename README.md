# RF Landscaper Pro

RF Landscaper Pro is an enterprise-grade application that streamlines landscaping business operations, including customer management, job scheduling, equipment tracking and team coordination.

## Dependencies

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker and Docker Compose (optional)

## Project Structure

```
RFLandscaperPro/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication and authorization
│   │   ├── customers/      # Customer management
│   │   ├── equipment/      # Equipment tracking
│   │   ├── jobs/           # Job management
│   │   ├── users/          # User management
│   │   └── common/         # Shared utilities
│   ├── Dockerfile          # Production container
│   ├── docker-compose.yml  # Development environment
│   └── fly.toml            # Fly.io deployment configuration
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

