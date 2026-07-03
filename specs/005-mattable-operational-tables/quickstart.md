# Quickstart: MatTable Operational Tables

## Prerequisites

- Use the active feature branch:
  `feat/181-migrate-operational-overviews-account-management-mattable`
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

Verify the following surfaces render through Material tables and preserve their
existing data, actions, and states:

- Owners: data columns, owner search, clear search, selected owner scroll target,
  edit navigation, loading, empty, filtered-empty, and error/retry states.
- Cats: data columns, cat/owner search, clear search, owner query-param link,
  edit navigation, loading, empty, filtered-empty, and error/retry states.
- Vets: data columns, vet search, clear search, edit navigation, loading,
  empty, filtered-empty, and error/retry states.
- Stays: data columns, status filters, stay search filters, selected stay scroll
  target, edit availability, cancel confirmation/pending/error behavior,
  unavailable action labels, loading, empty, filtered-empty, and error/retry
  states.
- Accounts: account columns, current-user marker, role selection/save,
  enable/disable, pending disabled states, load/action errors, not-found refresh,
  and logout redirect after successful current-admin demotion or disable.

## Keyboard and Responsive Smoke Test

Use the running Angular app or browser-controlled smoke checks after final SCSS
changes:

1. Open each migrated table surface with records available.
2. Tab through page actions, filters, table links, selects, and buttons.
3. Confirm focus reaches each available action in a logical order and remains
   visible, including inside any horizontal table wrapper.
4. Check a desktop viewport and a small-laptop viewport for readable columns,
   row text, and actions without overlap.
5. Check a narrow viewport and confirm horizontal overflow is local to the table
   wrapper instead of widening the full page.

If any smoke check cannot be rerun after a later relevant change, report it as
`not revalidated` or `stale` instead of passed.

### 2026-07-03 Smoke Evidence

- Browser route smoke used the local Angular app at `http://localhost:4202`
  with the running local API fixture and admin session.
- Desktop viewport (`1280x720`): owners, cats, vets, stays, and accounts all
  rendered `MatTable` tables with expected localized headers, fixture rows, and
  no page-wide horizontal overflow.
- Small-laptop viewport (`1024x768`): all five migrated surfaces kept rows and
  actions readable; cats and stays used horizontal scrolling inside their local
  table wrappers while the document width stayed fixed.
- Narrow viewport (`390x844`): all five migrated surfaces kept horizontal
  overflow local to the table wrapper; the document did not become horizontally
  scrollable.
- Keyboard/focusability smoke found the changed page controls exposed as native
  keyboard targets in DOM order: create/edit links, search inputs, stay filter
  controls, account role selects, save buttons, enable/disable buttons, and the
  stay cancel button. The in-app browser keypress primitive did not produce a
  reliable physical Tab sequence, so that part is recorded as tool-limited
  rather than directly observed.
- A post-format rerun confirmed all five routes still rendered `MatTable`
  tables at desktop, small-laptop, and narrow widths, with no page-wide
  horizontal overflow and local wrappers owning narrow-table overflow. The same
  rerun confirmed owner, cat, and vet search controls render through Material
  form-field/input controls.

## Scope Review

Before final reporting, inspect the diff and confirm:

- No backend, database, Flyway, API contract, route guard, authorization, or
  persistence changes were introduced.
- Any route implementation change preserves the same user-visible path and
  guard contract.
- No pagination, sorting, configurable columns, backend search, backend
  pagination, new fields, new filters, detail dialogs, or permanent deletion
  behavior were added.
- Removed global or component styles are superseded only for the migrated table
  surfaces.
