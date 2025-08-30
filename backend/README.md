# RF Landscaper Pro - Backend API

A robust and scalable NestJS backend API for landscaping business management. It provides enterprise-grade security, performance optimization, and thorough business logic validation.

## Features

### Core Modules
- Authentication and Authorization: JWT-based authentication with role-based access control.
- Company Management: Company profiles, contact details, and hierarchies.
- Contract Management: Service contracts with automated status tracking.
- Customer Management: Comprehensive customer profiles and address management.
- Equipment Tracking: Status management, maintenance scheduling, conflict detection.
- Job Management: Scheduling, assignments, time tracking, resource optimization.
- User Management: Multi-role user system with secure password handling.

### Technical Features
- Performance: Optimized database queries with strategic indexing.
- Security: Enhanced password validation, input sanitization, error handling.
- Monitoring: Prometheus metrics, structured logging, request tracking.
- Testing: Comprehensive test coverage with Jest.
- Documentation: Interactive Swagger API documentation.

## Quick Start

### Prerequisites
- Node.js 18 or later (LTS recommended)
- PostgreSQL 14 or later
- npm 8+ or yarn 1.22+
- Docker and Docker Compose (optional for containerized development)

### 1. Installation
```bash
npm install

# Copy environment configuration
cp env.example .env.development
```

### 2. Environment Configuration
Edit `.env.development` with your database credentials. You may also add SMTP settings
(`SMTP_USER`, `SMTP_PASS`, and optional `SMTP_HOST`/`SMTP_PORT`) to send real emails
during development.

> **Note:** `.env.development` is git-ignored to keep secrets out of version control.

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=rflandscaperpro
# Auto-run migrations on startup (set to true in production if desired)
# RUN_MIGRATIONS=false
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
LOG_LEVEL=debug
# Remote log forwarding (optional)
# REMOTE_LOG_HOST=logs.example.com
# REMOTE_LOG_PORT=1234
# REMOTE_LOG_PATH=/
```

To customize the accounts created by the seed script, set
`COMPANY_ADMIN_*`, `MASTER_*`, and `SAMPLE_CUSTOMER_EMAIL` in your environment
file.

If no SMTP credentials are defined, the application falls back to an Ethereal test
account and logs preview URLs for emails.

Remote logging is only enabled when `REMOTE_LOG_HOST` is defined. When omitted, logs are written to the console and `app.log` file only.

### Development Log Server

A lightweight `logserver` service is included in `docker-compose.override.yml` for local testing. It listens on the port
specified by `REMOTE_LOG_PORT` and prints any HTTP `POST` bodies it receives.

```bash
npm run dev:compose
curl -X POST http://localhost:${REMOTE_LOG_PORT}/logs -d 'hello world'
```

Sample output from the `logserver` container:

```
{"message":"hello world"}
```

To automatically apply database changes on startup (such as in production), set `RUN_MIGRATIONS=true`. In development, omit this variable and run migrations manually with `npm run migration:run`.

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb rflandscaperpro

# Run database migrations (when available)
npm run migration:run

# Seed initial data (creates company admin and master users and sample customer)
# Set COMPANY_ADMIN_* and MASTER_* env vars to control credentials,
# and SAMPLE_CUSTOMER_EMAIL to specify the seeded customer's email.
# Passwords can be omitted to auto-generate secure values. This script is
# intended for local development only and will automatically skip execution when
# `NODE_ENV=production`.
npm run seed:dev

# Drop and re-seed the database from scratch
npm run seed:drop:dev
```

### 4. Start Development Server

Recommended: use a fully managed environment with Docker.

```bash
npm run dev:compose
# or
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

`npm run start:dev` and other commands below are executed inside the Docker container. Run them directly only if all dependent services, such as PostgreSQL, are available locally.

```bash
# Run the NestJS server with hot reload
npm run start:dev

# Start with debugger
npm run start:debug

# Start production build
npm run start:prod
```

### 5. Access the API
- API Base URL: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs (company_admin/company_admin)
- Health Check: http://localhost:3000/api/health
- Metrics: http://localhost:3000/api/metrics
- Production Base URL: https://rflandscaperpro.com/api

#### Health Check

The backend exposes a lightweight endpoint for uptime monitoring.

```bash
curl http://localhost:3000/api/health
```

Successful requests return a `200 OK` with a JSON body:

```json
{ "status": "ok" }
```

Infrastructure tools and load balancers can poll this route to verify that
the service is running and ready to receive traffic.

## Project Structure
```
src/
|-- auth/                   # Authentication and authorization
|   |-- dto/                # Data transfer objects
|   |-- auth.controller.ts
|   |-- auth.service.ts
|   |-- auth.module.ts
|-- companies/              # Company management
|   |-- dto/
|   |-- entities/
|   |-- companies.controller.ts
|   |-- companies.service.ts
|   |-- companies.module.ts
|-- contracts/              # Contract management
|   |-- dto/
|   |-- entities/
|   |-- contracts.controller.ts
|   |-- contracts.service.ts
|   |-- contracts.module.ts
|-- customers/              # Customer management
|   |-- dto/
|   |-- entities/
|   |-- customers.controller.ts
|   |-- customers.service.ts
|   |-- customers.module.ts
|-- equipment/              # Equipment tracking
|   |-- dto/
|   |-- entities/
|   |-- equipment.controller.ts
|   |-- equipment.service.ts
|   |-- equipment.module.ts
|-- jobs/                   # Job management
|   |-- dto/
|   |-- entities/
|   |-- jobs.controller.ts
|   |-- jobs.service.ts
|   |-- jobs.module.ts
|-- users/                  # User management
|   |-- dto/
|   |-- user.entity.ts
|   |-- users.controller.ts
|   |-- users.service.ts
|   |-- users.module.ts
|-- common/                 # Shared utilities
|   |-- decorators/
|   |-- filters/
|   |-- guards/
|   |-- interceptors/
|   |-- middleware/
|   |-- email.service.ts
|-- logger/                 # Logging configuration
|-- metrics/                # Metrics controller and module
|-- app.module.ts           # Root application module
|-- main.ts                 # Application entry point
|-- seed.ts                 # Development data seeding
```

## Development Commands

### Development
```bash
# Start development server with hot reload
npm run start:dev

# Start with debugger
npm run start:debug

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with debugger
npm run test:debug
```

### Code Quality
```bash
# Lint code with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

### Database
```bash
# Create new migration
npm run migration:create:dev

# Generate migration from entity changes
npm run migration:generate:dev

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert:dev

# Seed database with sample data
npm run seed:dev

# Drop and re-seed the database from scratch
npm run seed:drop:dev
```

## Database Schema

### Core Entities
- Users: authentication, roles, password management
- Customers: business relationships, contact information
- Addresses: customer location management
- Equipment: asset tracking, status management
- Jobs: work order management, scheduling
- Assignments: resource allocation, conflict detection

### Key Relationships
- Customers have multiple addresses and jobs
- Jobs are assigned to customers and can have multiple assignments
- Assignments link users and equipment to specific jobs
- Equipment has status tracking and maintenance history

## Security Features

### Authentication
- JWT-based authentication with configurable expiration
- Role-based access control (Admin, Worker, Customer)
- Secure password hashing with bcrypt (12 salt rounds)
- Password strength validation (8+ characters with complexity requirements)

### Authorization
- Route-level role protection with `@Roles()` decorator
- Public route marking with `@Public()` decorator
- JWT strategy with proper token validation

### Input Validation
- Comprehensive DTO validation with class-validator
- Business rule validation and sanitization
- SQL injection prevention through TypeORM
- XSS protection through input sanitization

## Performance Features

### Database Optimization
- Strategic database indexes for common queries
- Query optimization with TypeORM QueryBuilder
- Lazy loading to prevent N+1 query problems
- Efficient pagination with filtering and sorting

### Caching and Monitoring
- Redis-based caching (configurable)
- Prometheus metrics for performance monitoring
- Request and response logging and tracking
- Performance profiling and optimization

## Testing Strategy

### Test Coverage
- Unit tests: service methods, business logic, utilities
- Integration tests: database operations, API endpoints
- End-to-end tests: complete user workflows and scenarios
- Coverage target: minimum 80 percent code coverage

### Test Structure
```
test/
|-- app.e2e-spec.ts        # Application E2E tests
|-- users.e2e-spec.ts      # User management E2E tests
|-- jest-e2e.json          # E2E test configuration

src/
|-- auth/                  # Auth module tests
|-- customers/             # Customer module tests
|-- equipment/             # Equipment module tests
|-- jobs/                  # Job module tests
|-- users/                 # User module tests
```

## Deployment

### Docker Deployment
```bash
# Run with production settings
docker compose up

# Run with local development overrides
docker compose -f docker-compose.yml -f docker-compose.override.yml up
```

### Fly.io Deployment
```bash
# Build and deploy
npm run build
fly deploy

# Check deployment status
fly status
```

### Environment Configuration
Ensure all required environment variables are set:
- Database connection details
- JWT secrets and expiration times
- Logging and monitoring configuration
- CORS and security settings

## API Documentation

### Swagger/OpenAPI
- Interactive API documentation at `/docs`
- Comprehensive endpoint descriptions
- Request and response examples

## Code Standards
- Follow NestJS best practices
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Maintain code coverage above 80 percent

## License
This project is licensed under the [MIT License](../LICENSE).

## Support and Issues
- GitHub Issues: report bugs and feature requests
- Documentation: check this README and inline code comments
- Security: report vulnerabilities privately to maintainers

---
Built with modern technologies for the landscaping industry.

