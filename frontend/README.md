# CatWorld Frontend

Angular frontend for CatWorld.

This application is part of the CatWorld monorepo and will consume the Spring Boot backend through HTTP.

## Current status

This is the initial Angular setup.

Implemented:

- Angular application under `frontend/`
- minimal application shell
- basic routing
- placeholder dashboard page
- initial folder structure
- backend API base URL configuration outside components

Not implemented yet:

- real CatWorld screens
- stay calendar
- CRUD forms
- authentication
- frontend Docker container

## Tech stack

- Angular
- TypeScript
- SCSS
- npm

## Project structure

```txt
src/app/
  core/       shared configuration, services and infrastructure
  features/   feature-specific screens and logic
  layout/     application layout components
  shared/     reusable UI/components/helpers
```

## Run locally

From the repository root:

```bash
cd frontend
npm install
npm start
```

The frontend runs at:

```txt
http://localhost:4200
```

## Build

From `frontend/`:

```bash
npm run build
```

The production build is generated under:

```txt
dist/catworld-frontend
```

## Backend API configuration

The backend API base URL is configured outside Angular components.

Local development configuration:

```txt
src/environments/environment.development.ts
```

Production/default configuration:

```txt
src/environments/environment.ts
```

Expected local development value:

```ts
apiBaseUrl: 'http://localhost:8080/api'
```

Expected production/local-private value:

```ts
apiBaseUrl: '/api'
```

Do not hardcode backend URLs inside components.

## Related backend

During local development, the backend is expected to run separately from the repository root.

Typical backend validation:

```bash
./mvnw test
```

On Windows PowerShell:

```powershell
.\mvnw test
```

## Notes

This frontend is intentionally minimal for now. The goal of this step is to provide a clean Angular foundation, not to implement business screens yet.
