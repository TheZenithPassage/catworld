# Phase 0 Research: MatTable Operational Tables

## Decision: Use Angular Material `MatTable` Directly in Each Existing Page

**Rationale**: Issue #181 explicitly requires the five existing native application tables to use `MatTable`. Prior #176/#177 decisions approved Angular Material as CatWorld's frontend UI foundation, and the current standalone Angular component structure already imports Material modules directly where used.

**Alternatives considered**:

- Keep native tables: rejected because it does not satisfy #181.
- Create a shared table abstraction: rejected because pagination, sorting, configurable columns, and a broad table framework are out of scope.
- Use another table library: rejected because it would conflict with the approved Angular Material foundation and add an unrequested dependency.

## Decision: Preserve Current Component-Owned State and Actions

**Rationale**: The existing pages already own filters, computed row lists, selected-row IDs, role selections, pending states, cancellation behavior, API calls, and navigation. Preserving those methods limits the change to presentation and avoids backend, contract, authorization, and product behavior changes.

**Alternatives considered**:

- Introduce a common table data source service: rejected as unnecessary for current filtering and explicitly out-of-scope table capabilities.
- Move filtering or pagination to backend endpoints: rejected because backend search and pagination endpoints are out of scope.

## Decision: Keep Responsive Table Overflow Local to Component Wrappers

**Rationale**: The issue requires responsive wrappers and product-specific layout in component SCSS and forbids page-wide horizontal overflow. Each migrated table can be wrapped locally so wide content scrolls inside the table region while the page remains stable.

**Alternatives considered**:

- Keep global native table overflow styles: rejected because superseded native-table styles should be removed from migrated surfaces.
- Collapse table rows into card layouts: rejected because it would change table semantics and row scanning behavior beyond the requested migration.

## Decision: No Data Model, API Contract, Persistence, or Authorization Change

**Rationale**: The issue is a frontend table/control migration and explicitly requires preserving existing data and actions. Existing services, DTO expectations, route guards, backend rules, database schema, and stay invariants remain unchanged.

**Alternatives considered**:

- Add API pagination/sorting/search support: rejected because it is explicitly out of scope.
- Add new fields or filters: rejected because the issue requires preserving current columns and filters.

## Unresolved Decisions

None. No `[NEEDS CLARIFICATION]` markers or material human-decision blockers remain.
