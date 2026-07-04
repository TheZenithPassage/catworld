# Quickstart: Remove Legacy UI Styles

## Prerequisites

- Use the issue branch:

```powershell
git switch chore/183-remove-legacy-ui-styles-and-validate-angular-material-migration
```

- Install frontend dependencies if needed:

```powershell
cd frontend
npm ci
```

## Automated Validation

Run from the repository root unless noted otherwise.

```powershell
cd frontend
npm run format:check
npm run test:ci
npm run build
```

Expected result: all commands exit successfully. If any relevant frontend or
documentation changes are made after these commands, rerun affected evidence or
report it as not revalidated.

## Source Audit

Review:

- `frontend/src/styles.scss`
- affected files under `frontend/src/app/**/*.html`
- affected files under `frontend/src/app/**/*.scss`
- `docs/ARCHITECTURE.md`

Confirm:

- global native button/input/select/textarea/table component-system styling has
  been removed when superseded by Material;
- document defaults, Material theme setup, layout, responsive composition,
  CatWorld-specific presentation, shared utilities, and FullCalendar styles
  remain when still needed;
- retained native controls or control-like links are documented with reasons.

## Manual Keyboard Validation

In an authenticated administration session, tab through the migrated shell,
forms, filters, tables, and calendar controls that are reachable in the local
test data.

Expected result:

- focus remains visible;
- controls can be reached and activated by keyboard;
- no role-sensitive action unexpectedly appears or disappears;
- existing navigation and form behavior is unchanged.

## Target Viewport Smoke Tests

Smoke test the migrated surfaces at:

- target iPhone viewport;
- small-laptop viewport.

Expected result:

- controls remain visible and usable;
- tap/click targets are not visibly collapsed by removed legacy styles;
- page and form layouts do not introduce new horizontal overflow;
- FullCalendar remains usable and visually separate from Material component
  customization.
