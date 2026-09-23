# Quickstart: Validate Safe Login Navigation

## Automated validation

From `frontend/`:

```powershell
npm test -- --watch=false
npm run build
npm run format:check
```

Expected: suite, build, and format check pass; focused tests prove public shell on `/login`, pending/duplicate prevention, completed navigation, and recovery.

## Manual validation

1. Open `/login?returnUrl=/owners`, submit valid credentials, and throttle or hold navigation pending.
2. Verify the public layout remains, authenticated controls never appear, localized Material loading is announced, and duplicate login is impossible.
3. Complete navigation and verify the authenticated shell appears only at the destination.
4. Repeat with a lazy-loaded authenticated destination.
5. Cause navigation failure/cancellation; verify logout, usable non-loading login, retry, and generic localized failure.
6. Repeat visible checks in English/Spanish and narrow/wide viewports.

The manual check covers real timing, lazy loading, responsive presentation, and bilingual behavior not fully proven by component tests. Rerun affected evidence after late changes or report it as stale/not revalidated.

## Validation record — 2026-09-23

- `npm test -- --watch=false`: passed, 62 files and 658 tests.
- `npm run build`: passed with the repository's existing bundle/style budget warnings.
- `npm run format:check`: passed after scoped formatting.
- Isolated Docker project `catworld418`: passed for a normal lazy Calendar login, observable localized post-authentication loading before lazy Accounts completion, authenticated shell only after route completion, and recovery to logged-out localized login when the destination remained `/login`.
- Public login presentation: passed at 1440×900 and 390×844 in English and Spanish.
- Explicit browser network throttling: not run because the available browser-control surface exposes viewport but no network-throttling control. The maintained pending-navigation test holds the Router promise indefinitely and passed, but it is automated rather than manual evidence.
- Cleanup: passed; the isolated containers, network, and volume were removed and the pre-existing CatWorld project was not changed.
