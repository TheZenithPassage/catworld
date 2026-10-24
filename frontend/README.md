# CatWorld Frontend

Angular frontend for the CatWorld cat boarding management application.

## Features

- Authenticated application shell.
- Owner, cat and vet management screens.
- Stay creation, editing, cancellation and filtering.
- Stay detail, backend pricing previews, explicit agreement confirmation,
  individual payment management and derived payment summaries.
- Cat profile photo upload and authenticated display; ADMIN-only nightly and
  transfer rate configuration and sensitive economic activity views.
- Paginated operational overviews and complete record details.
- Monthly FullCalendar integration.
- Responsive monthly Calendar foundation with daily-label, daily-count and entry/exit modes; status, Owner and Cat filters preserve the selected representation.
- English and Spanish interface.
- Light/dark mode in the public and authenticated shells, with a local browser preference.
- Angular Material foundation for interactive UI components and application-wide theming.
- Responsive component SCSS for layout and product-specific presentation.

## Run Locally

From `frontend/`:

```bash
npm install
npm start
```

The development server runs on port 4200 and is available to other devices on
the same LAN at:

```text
http://<PC_LAN_IP>:4200
```

The local backend is expected at `http://localhost:8080`. During development,
the Angular server proxies requests from `/api` to that backend, so LAN clients
only connect to the Angular server.

The development API base URL is configured under:

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

Authenticated administration controls should use Angular Material when
Material provides the matching interaction role. Do not recreate a global
native-control styling system, create a broad global Material module, or add a
separate design-system package for CatWorld.

The authenticated application shell is Material-based in `src/app/app.*` and
keeps the existing route and guard structure. Shared loading, empty and error
presentation lives in `src/app/shared/ui-state/`; pages still own their data
fetching, filtering and retry behavior. Material overlays and shell
interactions use the Angular animations provider configured in
`src/app/app.config.ts`.

Login, account management, owner create/edit, vet create/edit, cat create/edit
and stay create/edit forms are Material-based. Keep form state, payload
shaping, submit behavior and responsive layout in the routed page component
that owns the form. Use Material field errors for field-level validation and
`src/app/shared/ui-state/` for page-level loading, backend-error, cross-field
or selection-error presentation where it matches the current behavior.

Native `<select>` elements may remain only inside `mat-form-field` with
`matNativeControl`, where Angular Material explicitly supports the native
select and the short option list does not require the custom `mat-select`
overlay. Calendar app-owned filters, display options, stays overview status
filters and shared stay search filters are Material-based. FullCalendar
vendor-owned controls remain a documented integration boundary.

## Theme preference

Use the **Dark mode / Modo oscuro** toggle beside the language action on login
or in the authenticated header. Its pressed state indicates dark mode. It works
for both ADMIN and STAFF and does not change navigation, forms or authentication.

An explicit light/dark selection is stored as `catworld.theme` in this browser
and survives reload, login and logout. It is not an account setting. Without a
valid saved choice the app follows the OS, including live changes; unavailable
OS detection falls back to light. Inferred themes are not saved. Clearing that
storage key restores OS-following behavior on the next load. When storage fails,
an explicit choice still applies for the current page.

`src/index.html` resolves the first visible theme synchronously, before Angular.
`src/app/core/theme/theme.service.ts` maintains the same policy while running.
`src/styles.scss` defines both Material palettes and application tokens at the
document root so menus, dialogs and other CDK overlays inherit the active theme.
Keep local surfaces token-based; FullCalendar owns its event/status color pairs.

## Production

The production build is served by Nginx from an immutable ARM64 image through
Docker Compose. Browser requests to `/api` are proxied to the internal Spring
Boot service. The frontend binds only to host loopback for the dedicated
Cloudflare Tunnel; Cloudflare Access protects the admin hostname. See the
[operations runbook](../docs/OPERATIONS.md) for the release and deployment
procedure.

See the [root README](../README.md) for the complete project overview and startup instructions.
