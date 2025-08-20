# RFLandscaperPro

A full-stack landscaping business management application built with modern web technologies. This application helps landscaping companies manage customers, jobs, and equipment efficiently.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Angular (planned)
- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: class-validator + class-transformer
- **Testing**: Jest
- **Deployment**: Fly.io
- **Containerization**: Docker

### Project Structure
```
RFLandscaperPro/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── customers/       # Customer management module
│   │   ├── jobs/           # Job management module
│   │   ├── equipment/      # Equipment management module
│   │   └── common/         # Shared utilities and filters
│   ├── test/               # End-to-end tests
│   ├── Dockerfile          # Production container
│   ├── Dockerfile.dev      # Development container
│   └── docker-compose.yml  # Local development setup
└── frontend/               # Angular application (planned)
```

## 🛠️ Backend Architecture

### Core Technologies
- **NestJS v11**: Progressive Node.js framework with TypeScript support
- **TypeORM v0.3**: Object-Relational Mapping for PostgreSQL
- **PostgreSQL**: Primary database with SSL support for production
- **class-validator**: Request validation and sanitization
- **class-transformer**: Request/response transformation

### Key Features
- **Modular Architecture**: Feature-based modules (customers, jobs, equipment)
- **Global Validation**: Automatic request validation with whitelist protection
- **Type Safety**: Full TypeScript support with strict typing
- **Database Migrations**: TypeORM migrations for schema management
- **Error Handling**: Global exception filters with structured error responses
- **CORS Support**: Cross-origin resource sharing enabled

### API Design
- **RESTful Endpoints**: Standard CRUD operations for all entities
- **DTO Pattern**: Separate Data Transfer Objects for create, update, and response
- **Validation**: Comprehensive input validation with custom error messages
- **Response Shaping**: Consistent API responses with proper typing

## 🚀 Development Environment

### Prerequisites
- Node.js 18+ 
- PostgreSQL 9.5+ (9.6+ recommended) for local development
- Docker & Docker Compose (optional)
- Git

### Local Development Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd RFLandscaperPro/backend
npm install
```

2. **Database Setup**
```bash
# Create PostgreSQL database
createdb rflandscaperpro

# Run migrations (when available)
npm run migration:run
```

3. **Environment Configuration**
Create the following environment files in `backend/` directory:

**`.env.development`** (for local development):
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

**`.env.production`** (for production deployment):
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

**`.env.test`** (for running tests):
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

The `JWT_SECRET` variable is required for token signing in all environments. The application will throw an error if it is not set.

4. **Start Development Server**
```bash
# Using development environment
npm run start:dev

# Or explicitly specify environment
NODE_ENV=development npm run start:dev
```

The API will be available at `http://localhost:3000`

### Environment File Management

The project uses multiple environment files for different contexts:

- **`.env.development`**: Local development with local PostgreSQL
- **`.env.test`**: Test environment with separate test database
- **`env.example`**: Template showing required variables (safe to commit)

**Production Environment**: Uses Fly.io secrets instead of `.env.production` files

**Important**: 
- Never commit actual `.env` files with sensitive data
- Production credentials are managed through Fly.io secrets
- Use the Fly.io web dashboard for easiest secret management

### Docker Development
```bash
# Start with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -f Dockerfile.dev -t rflandscaperpro/backend:dev .
docker run -p 3000:3000 rflandscaperpro/backend:dev
```

## 🧪 Testing

### Test Structure
- **Unit Tests**: Individual service and controller tests
- **E2E Tests**: Full API endpoint testing
- **Coverage**: Jest coverage reporting

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (uses .env.test)
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

**Note**: E2E tests use the `.env.test` configuration with a separate test database.

## 📊 Database Management

### Entity Relationships
- **Customers** ↔ **Jobs**: One-to-many relationship
- **Customers** ↔ **Addresses**: One-to-many relationship
- **Equipment** ↔ **Jobs**: Many-to-many relationship (planned)

### Migration Commands

**Local Development:**
```bash
# Create new migration
npm run migration:create -- src/migrations/MigrationName

# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations (uses .env.development)
npm run migration:run

# Revert last migration
npm run migration:revert
```

**Production (Supabase):**
```bash
# Deploy to Fly.io (migrations run automatically)
flyctl deploy

# Or run migrations manually on Fly.io platform
flyctl ssh console
npm run migration:run
```

### Migration Workflow

1. **Development**: Make changes to entities in `src/` directory
2. **Generate Migration**: `npm run migration:generate -- src/migrations/DescriptiveName`
3. **Review**: Check the generated migration file in `src/migrations/`
4. **Test Locally**: `npm run migration:run` (uses local database)
5. **Deploy**: Push code and run `npm run migration:run` in production

**Important Notes:**
- Always test migrations locally before running in production
- Never modify existing migration files that have been deployed
- Use descriptive names for migrations (e.g., `AddCustomerPhoneColumn`)
- The `migration:run` command will automatically use the correct database based on `NODE_ENV`

## 🚀 Deployment

### Database Setup (Supabase)

For production, this project uses Supabase as the managed PostgreSQL database:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and database password

2. **Get Connection Details**
   - In your Supabase dashboard, go to Settings → Database
   - Copy the connection string or individual credentials:
     - Host: `your-project.supabase.co`
     - Database: `postgres`
     - Username: `postgres`
     - Password: Your database password
     - Port: `5432`

3. **Configure Production Environment Variables**
   
   **Fly.io Web Interface (Recommended)**
   - Go to [fly.io dashboard](https://fly.io/dashboard)
   - Select your app (`rflandscaperpro-api`)
   - Go to "Secrets" tab
   - Add the following secrets:
     - `NODE_ENV` = `production`
     - `DB_HOST` = `your-project.supabase.co`
     - `DB_PORT` = `5432`
     - `DB_USERNAME` = `postgres`
     - `DB_PASSWORD` = `your-supabase-db-password`
     - `DB_NAME` = `postgres`
     - `LOG_LEVEL` = `info`
   
   **Alternative: Fly.io CLI**
   ```powershell
   # Set secrets individually via CLI
   flyctl secrets set NODE_ENV=production
   flyctl secrets set DB_HOST=your-project.supabase.co
   flyctl secrets set DB_PORT=5432
   flyctl secrets set DB_USERNAME=postgres
   flyctl secrets set DB_PASSWORD=your-supabase-db-password
   flyctl secrets set DB_NAME=postgres
   flyctl secrets set LOG_LEVEL=info
   ```

4. **Deploy and Run Migrations**
   ```bash
   # Deploy to Fly.io (includes database migrations)
   flyctl deploy
   ```

### Production Environment
- **Platform**: Fly.io
- **Database**: Supabase (PostgreSQL 15+)
- **SSL**: Automatic HTTPS with SSL certificates
- **Scaling**: Auto-scaling with min/max machine configuration

### Deployment Process
```bash
# Deploy to Fly.io
fly deploy

# Check deployment status
fly status

# View logs
fly logs
```

### Environment Variables (Production)
```env
NODE_ENV=production
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-supabase-db-password
DB_NAME=postgres
```

## 📝 API Documentation

### Core Endpoints

#### Customers
- `POST /customers` - Create customer
- `GET /customers` - List all customers
- `GET /customers/:id` - Get customer details
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

#### Jobs
- `POST /jobs` - Create job
- `GET /jobs` - List all jobs
- `GET /jobs/:id` - Get job details
- `PATCH /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

#### Equipment
- `POST /equipment` - Create equipment
- `GET /equipment` - List all equipment
- `GET /equipment/:id` - Get equipment details
- `PATCH /equipment/:id` - Update equipment
- `DELETE /equipment/:id` - Delete equipment

### Pagination

All list endpoints support optional pagination parameters:

- `page` (number, default `1`) – page number to retrieve
- `limit` (number, default `10`) – number of items per page

Responses are wrapped in an object containing the retrieved `items` array and the `total` number of available records.

### Request/Response Examples

#### Create Customer
```json
POST /customers
{
  "name": "John Doe",
  "email": "john@example.com",
  "addresses": [
    {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    }
  ]
}
```

#### Create Job
```json
POST /jobs
{
  "title": "Lawn Maintenance",
  "customerId": 1
}
```

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Jest**: Testing framework

### Development Scripts
```bash
# Code formatting
npm run format

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🔒 Security Features

- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection Protection**: TypeORM parameterized queries
- **CORS Configuration**: Controlled cross-origin access
- **Environment Separation**: Different configurations for dev/prod
- **SSL/TLS**: HTTPS enforcement in production

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: TypeORM connection management
- **Caching**: Ready for Redis integration (planned)
- **Compression**: Response compression (planned)

## 📊 Monitoring

- The backend exposes Prometheus-formatted metrics at `/metrics` via the `@willsoto/nestjs-prometheus` package. A Prometheus server can scrape this endpoint for application monitoring and alerting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [NestJS documentation](https://docs.nestjs.com/)
- Review the [TypeORM documentation](https://typeorm.io/)

---

**Built with ❤️ using NestJS and modern web technologies**
