# RF Landscaper Pro - Backend API 🚀

A robust, secure, and scalable NestJS backend API for landscaping business management. Built with enterprise-grade security, performance optimization, and comprehensive business logic validation.

## 🎯 **Features**

### **Core Modules**
- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 👥 **Customer Management**: Comprehensive customer profiles with address management
- 🚜 **Equipment Tracking**: Status management, maintenance scheduling, conflict detection
- 📋 **Job Management**: Scheduling, assignments, time tracking, resource optimization
- 👷 **User Management**: Multi-role user system with secure password handling

### **Technical Features**
- 🚀 **Performance**: Optimized database queries with strategic indexing
- 🛡️ **Security**: Enhanced password validation, input sanitization, error handling
- 📊 **Monitoring**: Prometheus metrics, structured logging, request tracking
- 🧪 **Testing**: Comprehensive test coverage with Jest
- 📚 **Documentation**: Interactive Swagger API documentation

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js**: 18+ (LTS recommended)
- **PostgreSQL**: 14+ 
- **npm**: 8+ or **yarn**: 1.22+
- **Docker & Docker Compose** (optional, for containerized development)

### **1. Installation**
```bash
# Install dependencies
npm install

# Copy environment configuration
cp env.example .env.development
```

### **2. Environment Configuration**
Edit `.env.development` with your database credentials:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=rflandscaperpro
JWT_SECRET=your_secure_jwt_secret
LOG_LEVEL=debug
```

### **3. Database Setup**
```bash
# Create PostgreSQL database
createdb rflandscaperpro

# Run database migrations (when available)
npm run migration:run

# Seed initial data (creates admin user and sample customer)
npm run seed
```

### **4. Start Development Server**
```bash
# Start with hot reload
npm run start:dev

# Start with debugger
npm run start:debug

# Start production build
npm run start:prod
```

### **5. Access the API**
- **API Base URL**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/docs (admin/admin)
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics

## 🏗️ **Project Structure**

```
src/
├── auth/                   # Authentication & authorization
│   ├── dto/               # Data transfer objects
│   ├── auth.controller.ts # Auth endpoints
│   ├── auth.service.ts    # Auth business logic
│   └── auth.module.ts     # Auth module configuration
├── customers/             # Customer management
│   ├── dto/               # Customer DTOs
│   ├── entities/          # Customer & address entities
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   └── customers.module.ts
├── equipment/             # Equipment tracking
│   ├── dto/               # Equipment DTOs
│   ├── entities/          # Equipment entity
│   ├── equipment.controller.ts
│   ├── equipment.service.ts
│   └── equipment.module.ts
├── jobs/                  # Job management
│   ├── dto/               # Job DTOs
│   ├── entities/          # Job & assignment entities
│   ├── jobs.controller.ts
│   ├── jobs.service.ts
│   └── jobs.module.ts
├── users/                 # User management
│   ├── dto/               # User DTOs
│   ├── user.entity.ts     # User entity
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/                # Shared utilities
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── interceptors/      # Request/response interceptors
│   ├── middleware/        # Custom middleware
│   └── email.service.ts   # Email service (placeholder)
├── logger/                # Logging configuration
├── app.module.ts          # Root application module
└── main.ts                # Application entry point
```

## 🔧 **Development Commands**

### **Development**
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

### **Testing**
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with debugger
npm run test:debug
```

### **Code Quality**
```bash
# Lint code with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

### **Database**
```bash
# Create new migration
npm run migration:create

# Generate migration from entity changes
npm run migration:generate

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed database with sample data
npm run seed
```

## 🗄️ **Database Schema**

### **Core Entities**
- **Users**: Authentication, roles, password management
- **Customers**: Business relationships, contact information
- **Addresses**: Customer location management
- **Equipment**: Asset tracking, status management
- **Jobs**: Work order management, scheduling
- **Assignments**: Resource allocation, conflict detection

### **Key Relationships**
- Customers have multiple addresses and jobs
- Jobs are assigned to customers and can have multiple assignments
- Assignments link users and equipment to specific jobs
- Equipment has status tracking and maintenance history

## 🔐 **Security Features**

### **Authentication**
- JWT-based authentication with configurable expiration
- Role-based access control (Admin, Worker, Customer)
- Secure password hashing with bcrypt (12 salt rounds)
- Password strength validation (8+ chars, complexity requirements)

### **Authorization**
- Route-level role protection with `@Roles()` decorator
- Public route marking with `@Public()` decorator
- JWT strategy with proper token validation

### **Input Validation**
- Comprehensive DTO validation with class-validator
- Business rule validation and sanitization
- SQL injection prevention through TypeORM
- XSS protection through input sanitization

## 📊 **Performance Features**

### **Database Optimization**
- Strategic database indexes for common queries
- Query optimization with TypeORM QueryBuilder
- Lazy loading to prevent N+1 query problems
- Efficient pagination with filtering and sorting

### **Caching & Monitoring**
- Redis-based caching (configurable)
- Prometheus metrics for performance monitoring
- Request/response logging and tracking
- Performance profiling and optimization

## 🧪 **Testing Strategy**

### **Test Coverage**
- **Unit Tests**: Service methods, business logic, utilities
- **Integration Tests**: Database operations, API endpoints
- **E2E Tests**: Complete user workflows and scenarios
- **Coverage Target**: Minimum 80% code coverage

### **Test Structure**
```
test/
├── app.e2e-spec.ts        # Application E2E tests
├── users.e2e-spec.ts      # User management E2E tests
└── jest-e2e.json          # E2E test configuration

src/
├── auth/                  # Auth module tests
├── customers/             # Customer module tests
├── equipment/             # Equipment module tests
├── jobs/                  # Job module tests
└── users/                 # User module tests
```

## 🚀 **Deployment**

### **Docker Deployment**
```bash
# Development with Docker Compose
docker-compose up --build

# Production build
docker build -t rflandscaperpro-backend .

# Run production container
docker run -p 3000:3000 rflandscaperpro-backend
```

### **Fly.io Deployment**
```bash
# Build and deploy
npm run build
fly deploy

# Check deployment status
fly status
```

### **Environment Configuration**
Ensure all required environment variables are set:
- Database connection details
- JWT secrets and expiration times
- Logging and monitoring configuration
- CORS and security settings

## 📚 **API Documentation**

### **Swagger/OpenAPI**
- Interactive API documentation at `/docs`
- Comprehensive endpoint descriptions
- Request/response examples
- Authentication requirements
- Error response documentation

### **API Endpoints**
- **Authentication**: `/auth/login`, `/auth/register`, `/auth/reset-password`
- **Users**: `/users` (CRUD operations)
- **Customers**: `/customers` (CRUD operations)
- **Equipment**: `/equipment` (CRUD operations)
- **Jobs**: `/jobs` (CRUD operations, assignments, scheduling)

## 🔍 **Monitoring & Logging**

### **Metrics**
- Prometheus metrics at `/metrics`
- HTTP request duration and status codes
- Database connection status
- Application health indicators

### **Logging**
- Structured logging with Winston
- Request ID tracking for debugging
- Error logging with stack traces
- Performance monitoring and alerting

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Ensure all tests pass
5. Submit a pull request

### **Code Standards**
- Follow NestJS best practices
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Maintain code coverage above 80%

## 📄 **License**

This project is licensed under the [MIT License](../LICENSE).

## 🆘 **Support & Issues**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README and inline code comments
- **Security**: Report vulnerabilities privately to maintainers

---

**Built with modern technologies for the landscaping industry** 🏡🌿
