# RFLandscaperPro

RFLandscaperPro is an application for managing landscaping customers, jobs, and equipment.

## Architecture Overview

- **Backend**: NestJS (Node.js) with TypeORM and PostgreSQL
- **Validation**: class-validator and class-transformer
- **Testing**: Jest
- **Containerization**: Docker
- **Deployment**: Fly.io

Project structure:
```
RFLandscaperPro/
└── backend/    # NestJS API server
```

## Quick Start

1. Clone the repository.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Copy `env.example` to `.env.development` and adjust values.
4. Start the development server:
   ```bash
   npm run start:dev
   ```

Detailed setup, environment variables, and deployment instructions are in the [backend README](backend/README.md).

## License

This project is licensed under the [MIT License](LICENSE).
