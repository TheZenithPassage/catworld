# CatWorld Frontend

Angular frontend for the CatWorld cat boarding management application.

## Features

- Authenticated application shell.
- Owner, cat and vet management screens.
- Stay creation, editing, cancellation and filtering.
- Monthly FullCalendar integration.
- Standard, compact and entry/exit calendar modes.
- English and Spanish interface.
- Angular Material foundation for interactive UI components and application-wide theming.
- Responsive component SCSS for layout and product-specific presentation.

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

## UI Foundation

Angular Material and Angular CDK are the default foundation for interactive UI
components, theming and shared UI behavior in the authenticated administration
interface.

The global Material theme lives in:

```text
src/styles.scss
```

Use component SCSS for local layout, responsive composition and
product-specific presentation. Keep FullCalendar-specific styling separate
where Material does not provide the relevant interaction or structure.

During the migration, existing native controls may remain on unmigrated
surfaces. New migrated controls should use Angular Material when Material
provides the corresponding component. Do not create a broad global Material
module or a separate design-system package for CatWorld.

The authenticated application shell is Material-based in `src/app/app.*` and
keeps the existing route and guard structure. Shared loading, empty and error
presentation lives in `src/app/shared/ui-state/`; pages still own their data
fetching, filtering and retry behavior. Material overlays and shell
interactions use the Angular animations provider configured in
`src/app/app.config.ts`.

## Production

The production build is served by Nginx through Docker Compose. Browser requests to `/api` are proxied to the Spring Boot backend.

See the [root README](../README.md) for the complete project overview and startup instructions.
