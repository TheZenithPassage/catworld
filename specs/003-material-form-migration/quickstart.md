# Quickstart: Material Form Migration

## Prerequisites

- Install frontend dependencies from `frontend/` with `npm install` if needed.
- Run the frontend against the existing backend only when performing manual save
  smoke tests. Automated validation does not require backend contract changes.

## Automated Validation

Run from the repository root:

```bash
cd frontend && npm run format:check
cd frontend && npm run test:ci
cd frontend && npm run build
```

Expected outcome:

- Formatting passes.
- Frontend unit tests pass, including migrated form behavior coverage.
- Production build passes with existing budgets.

## Behavior Review

Review the migrated pages:

- `/login`
- `/owners/new`
- `/owners/:id/edit`
- `/vets/new`
- `/vets/:id/edit`

Expected outcome:

- Applicable text fields use Material form fields and inputs.
- Submit and navigation actions use Material buttons where the form migration
  owns those controls.
- Existing payload shaping, validation messages, loading states, disabled
  states, backend-error display, i18n text, and navigation behavior are
  preserved.
- No cat form, stay form, searchable selector, table, calendar, backend,
  persistence, route, guard, or domain-rule behavior changes are included.

## Mobile Form Smoke Test

Smoke test the login, owner create/edit, and vet create/edit forms at these
CSS pixel widths:

- 320
- 375
- 390

Expected outcome:

- Material floating labels, inputs, validation text, backend errors, loading
  states, and action buttons remain usable.
- Text and controls do not overlap incoherently.
- Submit buttons remain reachable and disabled/loading states remain clear.
