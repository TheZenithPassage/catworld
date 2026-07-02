# Quickstart: Cat and Stay Material Forms

## Prerequisites

- Work from branch `feat/180-migrate-cat-and-stay-forms-to-angular-material`.
- Use the active feature artifacts under `specs/004-cat-stay-material-forms/`.
- Do not change backend contracts, persistence, authorization, stay invariants,
  route guards, searchable selectors, cat photos, vaccine warnings, pricing, or
  calculated-night behavior.

## Automated Validation

Run from the repository root unless noted:

```bash
cd frontend && npm run format:check
cd frontend && npm run test:ci
cd frontend && npm run build
```

Expected result:

- Formatting check succeeds.
- Frontend unit tests succeed, including cat and stay form behavior coverage.
- Production frontend build succeeds without budget or template errors.

Validation must be rerun after relevant late changes. If a check is not rerun
after changes that could affect it, report it as stale or not revalidated
instead of passed.

## Behavior Review

Verify the implementation against
[contracts/material-cat-stay-forms.md](./contracts/material-cat-stay-forms.md).

Required review points:

- Cat create and edit controls render with Material form presentation where a
  matching Material control exists.
- Cat create/edit required-field errors, backend errors, payload trimming,
  optional blank-to-null values, owner selection, vet selection, related links,
  query-param defaults, and navigation match existing behavior.
- Stay create controls render with Material form presentation where a matching
  Material control exists.
- Stay create preserves owner selection, query-param preselection, owner-filtered
  cats, multi-cat selection, related owner/cat links, `startAt` and `endAt`
  string values, nullable notes, validation, backend errors, and navigation.
- Stay edit preserves owner/cat summary display, closed-stay blocking, date/time
  string values, nullable notes, validation, backend errors, and navigation.
- Superseded native form/card styling is removed only where migrated cat/stay
  forms no longer need it.
- Source review confirms no backend, persistence, authorization, route guard,
  API contract, searchable selector, cat photo, vaccine warning, pricing,
  calculated-night, or unrelated product redesign change was introduced.

## Keyboard And Target-iPhone Smoke

Use the running frontend with the existing backend or representative test data.
Check cat create, cat edit, stay create, and stay edit at these CSS viewport
widths:

- 320 px
- 375 px
- 390 px

For each width:

1. Navigate through every in-scope field using keyboard focus where practical.
2. Exercise touch/click selection for Material selects and checkboxes.
3. Edit date and datetime controls and confirm values remain operable.
4. Trigger required-field or date validation and confirm the error is visible.
5. Confirm related links and form actions are reachable and do not overlap with
   labels, validation text, summaries, or backend-error presentation.

Expected result:

- Forms remain usable with keyboard and touch input.
- No incoherent overlap appears at 320, 375, or 390 CSS pixels.
- Date, datetime, optional values, entity selections, and multi-cat selection
  remain usable.
