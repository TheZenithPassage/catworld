# Phase 0 Research: Material Controls Migration

## Decision: Use Existing Angular Material Controls Directly in Owning Components

**Rationale**: Issue #182 requires Material migration where appropriate, and the frontend already depends on Angular Material 21.2.x with standalone component imports. Dashboard, calendar, and stay search filter controls can reuse Material buttons, anchors, card presentation, checkboxes, radios, form fields, inputs, autocomplete, and existing `UiStateComponent` patterns without adding dependencies.

**Alternatives considered**:

- Keep eligible native controls: rejected because it does not satisfy #182 unless no appropriate Material equivalent exists or the control is vendor-owned.
- Add another UI library: rejected because it conflicts with the approved Material migration direction and adds an unrequested dependency.
- Create a broad shared control abstraction: rejected because the issue is a focused migration and current components can own their local behavior directly.

## Decision: Preserve FullCalendar as the Calendar Renderer

**Rationale**: Issue #182 explicitly preserves FullCalendar and product-specific calendar layouts. Calendar filtering and surrounding actions can migrate to Material while FullCalendar's internal toolbar, event DOM, and month grid remain owned by FullCalendar.

**Alternatives considered**:

- Replace FullCalendar controls or renderer: rejected because replacing FullCalendar is out of scope.
- Fork FullCalendar toolbar behavior into app-owned controls: rejected because it risks changing date navigation behavior and exceeds the surrounding-control migration scope.

## Decision: Keep Existing Calendar and Search Filter State Semantics

**Rationale**: `CalendarPage` already owns status visibility, search filters, display options, visible-month preferences, and FullCalendar options. `StaySearchFiltersComponent` already owns cat/owner search, selected IDs, no-match states, and filter emissions. Preserving those methods limits the migration to Material presentation and avoids product behavior changes.

**Alternatives considered**:

- Add new filters or display modes: rejected because #182 explicitly forbids new calendar behavior.
- Move filter state to a shared service or backend endpoint: rejected because it would introduce unrequested architecture and contract changes.

## Decision: Record Native or Vendor-Owned Retention Reasons in the Feature Contract

**Rationale**: #182 requires an explicit reason for any remaining native interactive control that is intentionally retained. The feature contract is the appropriate review artifact for retained controls discovered during implementation, especially FullCalendar-owned controls and dashboard card links where native anchor semantics may be the correct accessible behavior.

**Alternatives considered**:

- Leave retained controls undocumented: rejected because it violates #182.
- Add permanent source documentation for every retained control immediately: rejected unless implementation reveals a durable documentation need beyond this feature artifact.

## Unresolved Decisions

None. No `[NEEDS CLARIFICATION]` markers or material human-decision blockers remain.
