# Material Controls UI Contract

## Scope

This contract covers the Material migration for:

- Dashboard navigation cards and quick actions
- Calendar header actions
- Calendar status filters
- Calendar display option controls
- Stay search filters used by the calendar and related stay surfaces
- Existing feedback/action controls discovered during the remaining-control scan

It is a UI contract only. Backend API payloads, persistence, authorization,
route guards, stay invariants, and domain business rules remain unchanged.

## General Control Contract

- Existing routes, query params, service calls, local state, translated labels,
  loading states, empty states, error states, disabled states, selected states,
  checked states, and feedback states remain unchanged.
- Existing interactive controls use Angular Material equivalents where a
  suitable equivalent preserves the current behavior.
- Material migration must not add new filters, sorting, display modes, routes,
  backend calls, authorization rules, persistence behavior, dark mode, or
  FullCalendar replacement behavior.
- Keyboard users can reach migrated controls in logical order and visible focus
  remains apparent.
- Target-iPhone and supported desktop layouts avoid incoherent overlap, clipped
  critical labels, and page-wide horizontal overflow.

## Dashboard Contract

- Dashboard quick actions use Material action controls while preserving their
  existing routes and translated labels.
- Dashboard card navigation preserves anchor/link navigation semantics and the
  existing destinations for stays, calendar, cats, owners, and vets.
- If a dashboard card remains a native anchor because Angular Material has no
  equivalent card-link control that preserves link semantics, the retention
  reason must be recorded in this contract.

## Calendar Contract

- Calendar header actions use Material action controls while preserving their
  routes to the stays overview and stay creation flow.
- Status filters use Material checkbox semantics while preserving current
  visibility state for each stay status.
- Filtered daily labels use a Material checkbox while preserving current
  filtered-display behavior.
- Unfiltered display modes use Material radio semantics while preserving the
  existing selected display mode and stored preference behavior.
- Stay search filters preserve cat and owner search text, option selection,
  selected IDs, clear behavior, no-match messages, and filter emission behavior.
- FullCalendar remains the month-grid renderer. FullCalendar's own toolbar,
  month grid, event DOM, and vendor-owned buttons are retained because replacing
  them would replace or fork FullCalendar behavior, which #182 excludes.

## Retained Native or Vendor-Owned Controls

Initial scan result:

- Application shell controls: out of scope for #182 and already covered by
  earlier Material shell work.
- Form-page controls: out of scope for #182 and covered by earlier form
  migration work.
- Operational table-specific controls: out of scope for #182 and covered by
  earlier MatTable work, except that the shared stay search filter component is
  in scope because it is also a calendar filter.
- Shared `UiStateComponent` action: already uses Material button behavior and
  needs no native-control retention reason.

This section must be kept current after implementation with every intentionally
retained native or vendor-owned interactive control found in scope.

- FullCalendar internal toolbar buttons and event elements: retained because
  they are generated and owned by FullCalendar, and replacing them would violate
  the explicit requirement to preserve FullCalendar.
- Calendar app-owned filters and display options: migrated to Material
  checkbox and radio controls; no app-owned native calendar filter control is
  intentionally retained.
- Stay search filter inputs, options, and clear actions: migrated to Material
  form-field, input, autocomplete, option, and button controls.
- Stays overview status filter checkboxes: retained as native controls because
  they belong to the earlier operational-table surface rather than the
  calendar/dashboard control migration scope for #182.
- Dashboard card anchors: retained as native anchors wrapping Material card
  presentation because they are route links, and Angular Material does not
  provide a card-link control that preserves native link semantics more
  accurately than an anchor.

## Responsive and Keyboard Contract

- Dashboard and calendar controls wrap predictably on narrow screens.
- Stay search filter controls remain usable on target-iPhone width, including
  option selection and clear actions.
- Horizontal overflow, when required by FullCalendar, remains local to the
  calendar wrapper instead of widening the full page.
- Keyboard focus reaches all available app-owned controls. If browser tooling
  cannot directly verify physical Tab traversal, the final report must state
  that limitation rather than reporting it as fully passed.

## Style Cleanup Contract

- Superseded native control styles are removed only when no in-scope surface
  still depends on them.
- Global styles needed by forms, application shell, operational tables,
  FullCalendar, shared states, or intentionally retained native controls remain
  intact.
