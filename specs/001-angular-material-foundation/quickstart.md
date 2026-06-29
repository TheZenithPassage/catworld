# Quickstart: Angular Material Foundation Validation

Use this guide after implementation work begins. It does not require or describe application code changes.

## Prerequisites

- Work from `feat/177-angular-material-foundation`.
- Use the active feature artifacts under `specs/001-angular-material-foundation/`.
- Use Node.js compatible with the current Angular frontend; CI uses Node.js 22.
- Do not implement unrelated page migrations while validating this foundation.

## Install Dependencies

From the frontend directory:

```bash
cd frontend
npm install
```

Expected outcome:

- `node_modules` is present.
- Dependency installation completes without Angular/Material peer dependency conflicts.

## Validate the Foundation

Run the issue-required commands:

```bash
cd frontend
npm run format:check
npm run test:ci
npm run build
```

Expected outcome:

- Formatting check passes.
- Frontend tests pass.
- Production build passes within existing Angular build budget settings.

## Review the UI Foundation Scope

Inspect the completed change and confirm:

- Angular Material and CDK are configured on a version line compatible with the current Angular frontend.
- One CatWorld Material theme is applied through supported Material theming APIs.
- Existing routes, authorization behavior, internationalization behavior, and user workflows are preserved.
- No complete form, table, shell, feature page, or full application page migration is included.
- FullCalendar is not replaced.
- #126 dark-mode preference is not implemented.
- No separate design-system package is introduced.

## Review Documentation

Confirm `docs/ARCHITECTURE.md` documents:

- Angular Material as the frontend UI foundation for the authenticated administration interface.
- Material theming responsibilities.
- Component SCSS responsibilities.
- Shared utility responsibilities.
- FullCalendar-specific styling responsibilities.
- Temporary coexistence strategy for native and Material controls.
- Standalone import, icon, typography, density, and supported customization conventions.

Expected outcome:

- Later migration issues can follow the documented foundation without re-deciding #177 boundaries.
