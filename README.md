# RF Landscaper Pro 🏡🌿

A comprehensive, enterprise-grade landscaping business management system built with modern technologies and best practices.

## 🎯 **Project Overview**

RF Landscaper Pro is a full-stack application designed to streamline landscaping business operations, including customer management, job scheduling, equipment tracking, and team coordination. Built with security, performance, and scalability in mind.

## 🏗️ **Architecture**

### **Backend Stack**
- **Framework**: NestJS (Node.js) with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based access control
- **Validation**: class-validator with comprehensive business rules
- **Documentation**: Swagger/OpenAPI with authentication
- **Monitoring**: Prometheus metrics and structured logging
- **Testing**: Jest with comprehensive test coverage

### **Key Features**
- 🔐 **Secure Authentication**: Multi-role user management with password strength validation
- 👥 **Customer Management**: Comprehensive customer profiles with address management
- 🚜 **Equipment Tracking**: Status management, maintenance scheduling, and conflict detection
- 📋 **Job Management**: Scheduling, assignment, time tracking, and resource optimization
- 👷 **Team Coordination**: User assignments, equipment allocation, and conflict prevention
- 📊 **Business Intelligence**: Performance metrics and operational insights

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### **1. Clone & Setup**
```bash
git clone https://github.com/yourusername/RFLandscaperPro.git
cd RFLandscaperPro
```

### **2. Backend Setup**
```bash
cd backend
npm install
cp env.example .env.development
# Edit .env.development with your database credentials
```

### **3. Database & Start**
```bash
# Create database
createdb rflandscaperpro

# Run migrations (when available)
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev
```

### **4. Access the Application**
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs (admin/admin)
- **Metrics**: http://localhost:3000/metrics

## 📁 **Project Structure**

```
RFLandscaperPro/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── customers/      # Customer management
│   │   ├── equipment/      # Equipment tracking
│   │   ├── jobs/           # Job management
│   │   ├── users/          # User management
│   │   └── common/         # Shared utilities
│   ├── Dockerfile          # Production container
│   ├── docker-compose.yml  # Development environment
│   └── fly.toml           # Fly.io deployment config
├── LICENSE                 # MIT License
└── README.md              # This file
```

## 🔧 **Development**

### **Available Scripts**
```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger
npm run build              # Build for production

# Testing
npm run test               # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Test coverage

# Database
npm run migration:create   # Create new migration
npm run migration:run      # Run pending migrations
npm run seed               # Seed database with sample data
```

### **Code Quality**
```bash
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
```

## 🚀 **Deployment**

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up --build

# Production build
docker build -t rflandscaperpro .
```

### **Fly.io Deployment**
```bash
npm run build
fly deploy
```

## 🧪 **Testing**

The application includes comprehensive testing:
- **Unit Tests**: Service and controller logic
- **Integration Tests**: Database operations and API endpoints
- **E2E Tests**: Complete user workflows
- **Coverage**: Minimum 80% code coverage requirement

## 📚 **Documentation**

- **API Docs**: Interactive Swagger documentation at `/docs`
- **Code Comments**: Comprehensive inline documentation
- **Business Logic**: Detailed explanations of domain rules
- **Deployment**: Step-by-step deployment guides

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow NestJS best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 **License**

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🆘 **Support**

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the backend README for detailed setup instructions
- **Security**: Report security vulnerabilities privately to maintainers

---

**Built with ❤️ for the landscaping industry**
