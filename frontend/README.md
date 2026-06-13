# CatWorld Frontend

Angular frontend for the CatWorld cat boarding management application.

## Features

- Authenticated application shell.
- Owner, cat and vet management screens.
- Stay creation, editing, cancellation and filtering.
- Monthly FullCalendar integration.
- Standard, compact and entry/exit calendar modes.
- English and Spanish interface.
- Responsive reusable form and table styles.

## Run Locally

From `frontend/`:

```bash
npm install
npm start
```

The development server runs at:

```text
http://localhost:4200
```

The local backend is expected at:

```text
http://localhost:8080/api
```

The API base URL is configured under:

```text
src/environments/
```

## Validation

```bash
npm run format
npm run format:check
npm run build
npm run test:ci
```

## Structure

```text
src/app/
  core/       authentication, configuration and infrastructure
  features/   feature-specific screens and logic
  layout/     application shell and navigation
  shared/     reusable UI and helpers
```

## Production

The production build is served by Nginx through Docker Compose. Browser requests to `/api` are proxied to the Spring Boot backend.

See the [root README](../README.md) for the complete project overview and startup instructions.
