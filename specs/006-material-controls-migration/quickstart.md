# Quickstart: Material Controls Migration

## Prerequisites

- Use the active feature branch:
  `feat/182-migrate-calendar-dashboard-and-remaining-controls-to-angular-material`
- Install frontend dependencies if needed:
  `cd frontend && npm install`

## Automated Validation

Run these commands after implementation and again after any relevant late
template, component, SCSS, test, or documentation changes:

```powershell
cd frontend
npm run format:check
npm run test:ci
npm run build
```

Expected outcome:

- Formatting check completes successfully.
- Frontend unit tests complete successfully.
- Production frontend build completes successfully within existing budgets.

## Behavior Checks

Verify these behavior-preservation points after implementation:

- Dashboard quick actions render as Material controls and route to the same
  create flows.
- Dashboard card navigation still reaches stays, calendar, cats, owners, and
  vets with the same translated labels.
- Calendar header actions render as Material controls and route to the same stay
  overview and stay creation destinations.
- Calendar status filters toggle the same stay-status visibility state as
  before.
- Calendar display options preserve unfiltered display mode and filtered daily
  label behavior.
- Stay search filters preserve cat/owner typing, option selection, no-match
  messages, clearing, and emitted filters.
- FullCalendar still renders the month grid, toolbar, custom stay events, and
  click-to-open-stay behavior.
- Every intentionally retained native or vendor-owned control has a reason in
  [contracts/material-controls.md](./contracts/material-controls.md).

## Keyboard, Calendar, Dashboard, and Target-iPhone Smoke Test

Use the running Angular app or browser-controlled smoke checks after final SCSS
changes:

1. Open the dashboard and calendar with representative records available.
2. Tab through dashboard quick actions and calendar app-owned controls.
3. Confirm focus reaches available controls in a logical order and remains
   visible.
4. Activate dashboard routes, calendar header routes, status filters, display
   options, and stay search filter selection/clear controls.
5. Confirm FullCalendar still shows the expected month grid and stay events.
6. Check desktop and target-iPhone viewports for readable labels, usable hit
   targets, no incoherent overlap, and no page-wide horizontal overflow.

If any smoke check cannot be rerun after a later relevant change, report it as
`not revalidated` or `stale` instead of passed.

## Scope Review

Before final reporting, inspect the diff and confirm:

- No backend, database, Flyway, API contract, route guard, authorization, or
  persistence changes were introduced.
- No new filters, sorting, display modes, routes, product workflows, dark mode,
  or FullCalendar replacement behavior were added.
- Forms, application shell, and operational table work remain outside this
  issue except for review or explicitly justified remaining-control cleanup.
- Removed global or component styles are superseded only for migrated controls
  or intentionally retained native/vendor controls.

## Validation Evidence - 2026-07-03

Automated validation was rerun after the late autocomplete selection fix and
formatting:

- `cd frontend; npm run format:check` passed. Prettier reported all matched
  files use the configured style.
- `cd frontend; npm run test:ci` passed. Result: 28 test files passed, 131
  tests passed.
- `cd frontend; npm run build` passed with warnings only. Warnings: initial
  bundle is 726.40 kB against the 700.00 kB warning budget, and
  `src/app/features/calendar/pages/calendar-page/calendar-page.scss` is 5.02 kB
  against the 4.00 kB warning budget. No error budget failed.

Browser smoke validation used an isolated Docker Compose project,
`catworld_smoke`, with frontend `http://127.0.0.1:14200`, app
`http://127.0.0.1:18080`, and database `127.0.0.1:13306`. Test data was seeded
through the API with owner `Smoke Owner 182`, cat `Milo Smoke 182`, and a visible
calendar stay from `2026-07-12T10:00:00` to `2026-07-14T10:00:00`.

Smoke results:

- Dashboard at desktop rendered five anchor card links wrapping Material cards,
  one Material flat quick action (`Crear estancia`), and three Material stroked
  quick actions (`Crear dueño`, `Crear gato`, `Crear veterinario`).
- Dashboard card links preserved routes to `/stays`, `/calendar`, `/cats`,
  `/owners`, and `/vets`.
- Dashboard target-iPhone viewport (`390x844`) had no page-wide horizontal
  overflow; quick actions wrapped within the page width.
- Calendar at desktop rendered Material header actions to `/stays` and
  `/stays/new`, four Material status checkboxes, three Material display radios,
  two Material search fields, and FullCalendar events for `Milo Smoke 182`.
- Calendar status filters toggled and returned to their original state.
  Selecting the compact display radio succeeded before entity filtering.
- Stay search autocomplete listed `Milo Smoke 182 (Smoke Owner 182)`. Selecting
  it set the input value and revealed the filtered daily-label Material checkbox
  (`Mostrar etiqueta en cada día`).
- Calendar target-iPhone viewport (`390x844`) had no page-wide horizontal
  overflow; status checkboxes and the filtered daily-label checkbox wrapped
  within the page width while FullCalendar remained present.
- Keyboard smoke confirmed focusability for dashboard card links, dashboard
  Material quick action, calendar Material create action, and Material search
  input. The tabbable inventory included migrated Material status checkboxes and
  their native inputs. The in-app browser wrapper did not provide a reliable
  physical Tab traversal assertion for every Material composite control, so this
  was verified by focus samples plus tabbable DOM inventory rather than a full
  end-to-end Tab-order recording.

Freshness status:

- Automated validation is fresh after the latest relevant template, component,
  SCSS, test, and documentation changes.
- Browser smoke was rerun after rebuilding the isolated production frontend with
  the autocomplete selection fix.

Scope and replacement-boundary review:

- The diff is frontend and feature-artifact scoped. No backend, database,
  Flyway, API contract, authorization, persistence, or route-guard behavior was
  changed.
- `frontend/src/app/app.routes.ts` keeps the same paths and guards while
  lazy-loading dashboard and calendar page components to preserve build-budget
  viability after the Material imports.
- No new filters, sorting, display modes, routes, dark mode, product workflows,
  or FullCalendar replacement behavior were introduced.
- FullCalendar internal toolbar/buttons/events remain vendor-owned and retained.
  Dashboard card anchors and stays overview native status checkboxes remain
  explicitly documented in the control contract.
