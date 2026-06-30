# Quickstart: Material Application Shell

## Prerequisites

- Start from branch `feat/178-material-application-shell`.
- Use the active frontend dependencies from `frontend/package.json`.
- Do not change backend, persistence, API contracts, or product routes for this feature.

## Automated Validation

Run from the repository root:

```bash
cd frontend && npm run format:check
cd frontend && npm run test:ci
cd frontend && npm run build
```

Expected outcome:

- Formatting check succeeds.
- Frontend unit tests succeed.
- Production frontend build succeeds within existing Angular budgets.

## Manual Review Scenarios

### Desktop Shell

1. Start the frontend with the existing local workflow.
2. Sign in with an existing authenticated account.
3. Navigate through Dashboard, Stays, Calendar, Cats, Owners, Vets, and Accounts when authorized.

Expected outcome:

- The shell uses Material-themed toolbar/navigation/menu/button/icon/progress/card/surface primitives where appropriate.
- Existing routes, labels, guards, language toggle, logout, and routed content remain intact.

### Target iPhone Width

1. Open the authenticated shell at the target iPhone validation width.
2. Use the responsive navigation, language toggle, logout, and primary shell actions.

Expected outcome:

- Navigation and actions remain reachable and usable.
- No navigation information architecture redesign or additional product route is present.

### Shared Loading, Empty, And Error States

1. Review representative loading, empty, and error states on migrated shared surfaces.
2. Confirm user-facing text comes from the existing i18n system.

Expected outcome:

- Loading states use accessible Material-compatible progress presentation.
- Empty and error states use Material-themed surfaces.
- Error states remain accessible for assistive technology.

### Scope Boundary Review

Expected outcome:

- No complex form or table migration is included.
- FullCalendar remains in place.
- #126 dark-mode preference persistence is not implemented.
- Backend, persistence, authorization, API payloads, and CatWorld domain rules are unchanged.
