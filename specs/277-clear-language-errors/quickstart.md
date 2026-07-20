# Quickstart: Validate Language-Change Error Clearing

## Prerequisites

- Node.js 22, matching frontend CI
- npm with the repository lockfile
- Commands run from `frontend/`

For a clean dependency install when needed:

```powershell
npm ci
```

## Automated Validation

Run the focused i18n and affected-page tests while iterating:

```powershell
npm run test:ci -- --include "src/app/core/i18n/i18n.service.spec.ts" --include "src/app/features/**/pages/**/*.spec.ts"
```

Then run the complete frontend gate:

```powershell
npm run format:check
npm run test:ci
npm run build
```

Expected outcomes:

- The error-signal factory remains writable, clears only after a distinct language change, and accepts a fresh message afterward.
- Every affected page's owned error signals clear after changing `I18nService.language`.
- Representative rendered page and Material field errors disappear from the DOM.
- Repeating a frontend-localized validation or failed action shows the selected-language message.
- Form values and representative loaded, filtered, selected, and calendar state remain unchanged.
- No language-change test observes a new API call, submission, retry, navigation, or reload.
- Formatting, all frontend tests, and the production build complete successfully.

## Representative Browser Smoke Check

When the local application and its existing authentication/backend prerequisites are available:

1. Open a form page and enter values that produce both field-level and page-level feedback where possible.
2. Change the application language from the shell.
3. Confirm that every visible error disappears while entered values, route, and current workflow remain in place.
4. Repeat the invalid action and confirm the newly produced frontend-localized error uses the selected language.
5. On a stateful overview or calendar page, retain a filter, selection, or display state, expose an error through existing behavior, switch language, and confirm only the error disappears.
6. Repeat the language switch with no error visible and confirm no request, navigation, or reset occurs.

Raw backend strings need only demonstrate clearing; translating them is outside this feature.

## Freshness Requirement

Rerun every affected automated or manual check after later changes to the i18n service, an error declaration, its owning page behavior, or the relevant test setup. If a check cannot be rerun, report it as stale or not revalidated rather than passed.
