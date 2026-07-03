# Material Operational Tables UI Contract

## Scope

This contract covers the migrated Material table presentation for:

- Owner overview
- Cat overview
- Vet overview
- Stay overview
- Account management

It is a UI contract only. Backend API payloads, persistence, authorization,
route guards, and domain business rules remain unchanged.

## Table Contract

- Each in-scope native application table renders through Angular Material
  `MatTable`.
- Column order, headers, row content, secondary-line content, empty-value
  formatting, and localized copy match the existing table surface.
- Existing filters remain available with the same user-observable behavior.
- Existing loading, empty, filtered-empty, and error states remain clear and
  localized.
- Existing row and page actions remain available with the same routing,
  click behavior, pending/disabled behavior, confirmation behavior, and
  role-sensitive visibility.
- No pagination, sorting, configurable columns, backend search, backend
  pagination, new fields, or new filters are introduced.

## Surface-Specific Contract

### Owner Overview

- Columns: name, primary phone, secondary phone, address, social, actions.
- Search filters owner rows by the existing owner-name search behavior.
- Clear search resets search text and selected owner query params as before.
- Selected owner row retains an ID target for existing scroll-into-view behavior.
- Edit action routes to the existing owner edit route.

### Cat Overview

- Columns: name, owner, sex, birth date, appearance, care, health, vet, actions.
- Search filters cat rows by the existing cat-name and owner-name behavior.
- Owner link routes to the owner overview with the existing search and selected
  owner query parameters.
- Edit action routes to the existing cat edit route.

### Vet Overview

- Columns: name, phone number, address, actions.
- Search filters vet rows by the existing vet-name search behavior.
- Edit action routes to the existing vet edit route.

### Stay Overview

- Columns: state, start, end, cats, owner, notes, actions.
- Status filters and stay search filters preserve existing behavior.
- Selected stay row retains an ID target for existing scroll-into-view behavior.
- Edit action remains available only when the current stay status allows editing.
- Cancel action preserves existing confirmation, pending label/disabled state,
  reload behavior, and backend error presentation.
- Unavailable actions continue to show the existing status-specific label.

### Account Management

- Columns: username, role, enabled, actions.
- Current account marker remains visible beside the current username.
- Role selection, save role action, enabled/disabled marker, enable/disable
  action, pending disabled states, error handling, not-found refresh, and
  self-demotion/self-disable logout behavior remain unchanged.

## Responsive and Keyboard Contract

- Desktop and small-laptop layouts keep table headers, row content, and actions
  readable without overlapping controls.
- Narrow layouts use a component-local responsive wrapper. Horizontal overflow,
  when needed, is contained to the table region and does not widen the full page.
- Keyboard users can reach filters and all available table actions in logical
  order. Focus must remain visible inside local overflow wrappers.

## Style Cleanup Contract

- Superseded native-table and row-action styles are removed only when their
  migrated surfaces no longer use them.
- Global styles needed by remaining native controls, FullCalendar, application
  shell, form pages, shared states, or unmigrated surfaces remain intact.
