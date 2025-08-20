# RFLandscaperPro Backend

This directory contains the NestJS API server for RFLandscaperPro.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 9.6+
- Docker & Docker Compose (optional)
- Git

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a PostgreSQL database:
   ```bash
   createdb rflandscaperpro
   ```
3. Run migrations (when available):
   ```bash
   npm run migration:run
   ```
4. Configure environment variables:
   ```bash
   cp env.example .env.development
   ```
   Update values as needed.
5. Start the server:
   ```bash
   npm run start:dev
   ```

## Environment Variables

Create environment files in this directory to configure different environments.

`.env.development`:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=rflandscaperpro
JWT_SECRET=your_jwt_secret
LOG_LEVEL=debug
```

`.env.production`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-db-password
DB_NAME=postgres
JWT_SECRET=your_jwt_secret
LOG_LEVEL=info
```

`.env.test`:
```env
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=rflandscaperpro_test
JWT_SECRET=your_jwt_secret
LOG_LEVEL=error
```

See `env.example` for additional optional settings.

## Deployment

The backend is containerized with Docker and configured for Fly.io deployment.

```bash
npm run build
fly deploy
```

Ensure all required environment variables are set on the target platform.

## API Documentation

When running locally, Swagger docs are available at `http://localhost:3000/docs` (basic auth `admin`/`admin` by default).

## Monitoring

Prometheus metrics are exposed at `/metrics` via `@willsoto/nestjs-prometheus`.

## Testing

```bash
npm run test
```

For end-to-end tests:
```bash
npm run test:e2e
```
