# UI Contract: Error Lifetime Across Language Changes

## Trigger

The contract applies when the application's current `AppLanguage` changes from one supported value to another through the existing `I18nService.language` state, including the shell language toggle.

Setting or retaining the same language value is not a language change and does not clear errors.

## Error Clearing

- Every active routed page's visible page-level, operation-level, dialog/workflow-level, and field-level error channel becomes empty when the language changes.
- If several error channels are populated, all of them clear for the same change.
- The clearing behavior applies to frontend-localized messages and raw backend-provided messages alike.
- No previously visible error is translated or replaced in place.

## State Preservation and Side Effects

- Form values and every non-error component signal retain their current values.
- The active route, open workflow, loaded records, filters, sorting, selections, pagination, calendar display state, and applicable focus/scroll state are not reset by this contract.
- Loading, submitting, cancelling, and other in-flight or pending work continues unchanged.
- The language change does not submit a form, retry or cancel a request, call an API, navigate, reload, or recreate a page solely to clear errors.
- Success, loading, empty, disabled, and other non-error feedback retain their existing behavior.

## Later Error Generation

- A later validation, retry, or operation failure may populate the cleared channel again through its existing page-owned error path.
- Frontend-localized error paths read the then-current translations, so a repeated condition appears in the selected language.
- Backend-provided free text remains governed by the backend response. This feature clears stale backend text but does not translate or remap it.
- Correcting the condition keeps the cleared channel empty unless a later action produces a new error.

## Coverage Boundary

The current contract surface is the 15 routed pages identified in `research.md`. Future routed pages that introduce visible error state must use the same language-scoped error lifetime when they are expected to participate in application-wide language switching.
