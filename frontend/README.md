# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.1 and
includes Angular Universal for server‑side rendering (SSR).

## Backend integration

API endpoints are configured through environment files located in `src/environments`.

- `environment.ts` – local development (default)
- `environment.staging.ts` – staging deployment
- `environment.production.ts` – production deployment

Each file defines an `apiUrl` pointing to the backend. The Angular build configuration
replaces `environment.ts` with the appropriate file when building for `staging` or `production`.

### Development proxy

When running `ng serve`, requests to `/api` are proxied to `http://localhost:3000` using
`proxy.conf.json`. Update this file if your backend runs on a different host or port.

## Development server

To start a local development server with SSR enabled, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project for SSR, run:

```bash
npm run build:ssr
```

After building, you can serve the application using:

```bash
npm run serve:ssr
```

This compiles the project and stores the build artifacts in the `dist/` directory. The server bundle is then executed with Node to render pages on the server.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Docker

### Development

To start the frontend in a container with hot reload, run:

```bash
docker compose up
```

This uses `Dockerfile.dev` and serves the app at <http://localhost:4200>.

### Production build

To build and run the production image:

```bash
docker compose -f docker-compose.yml up --build -d
```

The application is built and served by a Node Express server on port 4000.
