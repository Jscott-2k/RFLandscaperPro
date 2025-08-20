# RF Landscaper Pro Backend

Backend API server for RF Landscaper Pro built with [NestJS](https://nestjs.com). For an overview of the entire project and architecture see the [root README](../README.md).

## Modules

- **Auth** – login and JWT token issuance
- **Users** – system users and roles
- **Customers** – customer records and addresses
- **Jobs** – scheduling and job management
- **Equipment** – inventory tracking for field equipment
- **Common** – shared decorators, guards, filters, and interceptors
- **Logger** – centralized winston-based logging
- **Migrations** – TypeORM migration files in `src/migrations`
- **Seed** – sample data population via `npm run seed`

## Environment Configuration

1. Copy `env.example` to the appropriate `.env` file:
   - `.env.development` for local development
   - `.env.test` for running tests
   - `.env.production` for production
2. Set the PostgreSQL connection variables and `JWT_SECRET` (required). Optional settings include logging level, caching, and rate limiting. Detailed examples are available in the [root README](../README.md).

## Installation

```bash
npm install
```

## Running the Server

```bash
# start in watch mode
npm run start:dev

# production build
npm run start:prod
```

The API listens on `http://localhost:3000` by default and exposes Swagger docs at `/docs` (protected with basic auth via `SWAGGER_USER` and `SWAGGER_PASSWORD`).

## Testing

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e

# coverage report
npm run test:cov
```

## Database Migrations

```bash
# generate a migration from entity changes
npm run migration:generate -- src/migrations/<Name>

# run pending migrations
npm run migration:run

# revert the last migration
npm run migration:revert
```

## Seeding

```bash
npm run seed
```

For broader project context and deployment guidance, see the [root README](../README.md).
