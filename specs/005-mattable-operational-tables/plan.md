# Implementation Plan: MatTable Operational Tables

**Branch**: `feat/181-migrate-operational-overviews-account-management-mattable` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-mattable-operational-tables/spec.md`

## Summary

Migrate the owner, cat, vet, stay, and account-management native tables to Angular Material `MatTable` while preserving existing columns, row content, filters, translations, navigation, loading/empty/error states, account role-sensitive behavior, and stay cancellation behavior. The implementation will reuse the approved #177 Angular Material foundation and #178 shared feedback/action conventions, import only directly used Material modules into the existing standalone page components, keep table layout and responsive wrappers in component SCSS, and remove superseded native table/row-action styling from the migrated surfaces without adding pagination, sorting, configurable columns, backend endpoints, or product behavior.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and repository documentation.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, Angular Material 21.2.x, Angular CDK 21.2.x, Angular animations 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature reuses the installed Angular Material/CDK foundation and shared `UiStateComponent`; it does not add dependencies.

**Storage**: N/A. No backend persistence, browser storage, database schema, API payload shape, or Flyway migration is affected.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus keyboard and responsive table smoke testing. Existing frontend unit tests run through the Angular unit-test builder with Vitest/jsdom. Account management has existing behavior coverage; operational overview coverage must be added or updated where table migration changes rendered structure, action controls, selected-row behavior, filtering, and empty/error states.

**Target Platform**: Angular administration UI served by the existing frontend build and production Nginx path. Migrated tables are authenticated administration surfaces and must remain usable on supported desktop and small-laptop layouts. Narrow screens must use local responsive wrappers that avoid page-wide horizontal overflow.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only presentation and interaction-preservation work.

**Performance Goals**: N/A. No performance target is specified. Existing frontend production build budgets remain active and must still pass.

**Constraints**: Preserve existing columns, row content, translations, filters, navigation, role-sensitive actions, request/API behavior, route contracts, authorization assumptions, backend behavior, loading/empty/error states, selected-row scrolling, stay status/cancellation behavior, and account current-user logout behavior. Keep responsive wrappers and product-specific layout in component SCSS. Existing production build budgets remain active and must pass; route implementation may use the existing `loadComponent` pattern only when the user-visible path and guard contract remain unchanged. Do not add pagination, sorting, configurable columns, backend search or pagination endpoints, new fields, new filters, detail dialogs, permanent-deletion behavior, backend changes, persistence changes, or unrelated product redesign.

**Scale/Scope**: Five table surfaces: `OwnersOverviewPage`, `CatsOverviewPage`, `VetsOverviewPage`, `StaysOverviewPage`, and `AccountManagementPage`.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The work supports existing CatWorld administration workflows and does not add cross-species, multi-tenant, generic platform, or non-cat-boarding product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. Existing backend validation, authorization, stay status derivation, and account-management authority remain unchanged. Frontend tables remain presentation and interaction surfaces only.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Stay status remains derived from dates and cancellation data, and core stay invariants remain backend-protected. The stay table migration preserves existing display and cancellation availability without changing backend stay rules.
- **Specification and planning discipline**: Pass. The specification distinguishes observable behavior, scope, edge cases, exclusions, assumptions, state-sensitive behavior, and validation. The Material approach is already approved by #176/#177 and the shared feedback/action conventions are established by #178.
- **Architecture and technology assessment**: Pass for planning by reference. This issue applies an approved UI framework to a repeated table migration with accessibility and replacement-risk responsibilities, but it does not reopen the UI framework or dependency decision because #176/#177 approved Angular Material and #181 explicitly requires `MatTable`.
- **Focused changes and proportional validation**: Pass. Scope is limited to five frontend table surfaces, focused tests, format, test, build, and keyboard/responsive smoke validation.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes are planned. `docs/ARCHITECTURE.md` and `frontend/README.md` are source-of-truth documentation candidates only if implemented table conventions need documentation updates; no source-of-truth backend or operations changes are planned.

## Architecture and Technology Assessment

**Assessment required**: Yes, by reference. The feature replaces repeated table presentation and action primitives with `MatTable` and Material controls, which carries accessibility and semantic-equivalence responsibility, but the significant framework and dependency decisions are already approved and still applicable.

**Decision trigger**: significant cross-cutting concern; non-trivial accessibility or correctness responsibility; confirmed repeated approved use; meaningful replacement or migration cost.

**Options considered**:

- Existing platform/framework/project capability: Keep native `table`, native buttons, native links, and existing global/component table styles. This would avoid local migration work but conflicts with #181 and the approved #176/#177 Material migration direction.
- Established library/framework/service: Use Angular Material `MatTable`, Material buttons/anchors, and Material-compatible controls on top of the #177 foundation and #178 shared state conventions. This matches the approved Material foundation, current Angular version, and #181 acceptance criteria.
- Focused custom implementation: Build custom CatWorld table/action components or a broader table abstraction. This would create competing table infrastructure outside #181 scope, add accessibility and maintenance responsibility, and conflict with the issue's direct `MatTable` requirement.

**Selected approach**: Use Angular Material `MatTable` and Material buttons/anchors/related controls directly in the five in-scope standalone page components. Preserve the existing component state, service calls, routing, filtering, and action methods. Keep table layout, selected-row styling, responsive wrappers, and product-specific presentation in the owning component SCSS.

**Why selected**: This directly satisfies #181, reuses the approved foundation, avoids duplicate UI infrastructure, keeps behavior changes out of scope, and limits the migration to page-owned table templates and styles rather than a new shared table abstraction.

**Confirmed medium-term use**: #176 identifies operational tables as part of the Material migration epic, and #181 covers the approved table migration scope after #177 and #178. This feature provides the Material table pattern for current owner, cat, vet, stay, and account-management surfaces without generalizing beyond those confirmed tables.

**Maintenance and operational consequences**: The frontend continues to own Angular Material/CDK upgrades alongside Angular upgrades. Table customization must stay within Material public APIs and component SCSS. Keyboard focus, visible focus, action labels, local overflow, and table readability need tests or smoke checks after final template/style changes.

**Reversibility and migration path**: Reverting #181 is local to the five page components, their SCSS, focused tests, and cleanup of now-unused native table styles. Later pagination/sorting/configurable-column work can be planned separately because this issue intentionally avoids those `MatTable` capabilities.

**Human approval**: Approved by prior decisions and issue scope. GitHub issue #176 approved Angular Material as the default frontend UI foundation, issue #177's plan recorded human approval for that foundation and migration boundary on 2026-06-29, issue #178 established shared Material feedback/action conventions, and issue #181 explicitly requires `MatTable` for these five tables. This plan applies those still-current decisions without selecting a materially different framework, shared abstraction, persistence strategy, or API contract.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. Native tables, native row/page controls, selected-row styling, account table wrapper styling, and global native overview table styles are being replaced or removed while preserving existing behavior.

**Old behavior/source of truth**: Existing page components under `frontend/src/app/features/owners/pages/owners-overview-page/`, `frontend/src/app/features/cats/pages/cats-overview-page/`, `frontend/src/app/features/vets/pages/vets-overview-page/`, `frontend/src/app/features/stays/pages/stays-overview-page/`, and `frontend/src/app/features/accounts/pages/account-management-page/`; current models and services; current translation files under `frontend/src/app/core/i18n/translations/`; existing shared `UiStateComponent`; existing account-management tests; existing global native table styles in `frontend/src/styles.scss`.

**New mechanism semantics**: Angular Material `MatTable` with `mat-header-cell`, `mat-cell`, `mat-header-row`, and `mat-row`; Material button/anchor controls for row and page actions; Material form field/input/select controls only where needed for existing filters or account role controls; component-level wrappers for local horizontal overflow; `UiStateComponent` remains the page-level loading/empty/error presentation where already used.

**Mismatch risks**: Row content could lose the current column order or secondary-line formatting; Material table DOM could break selected-row IDs and scroll targets; Material buttons/anchors could change router navigation, disabled behavior, or action labels; account role select migration could change selected role values or pending disabled states; stay cancellation could lose confirm, pending, unavailable, or error behavior; filter inputs could change search value timing; replacing global table styles could accidentally affect FullCalendar or unmigrated native controls; local overflow wrappers could hide keyboard focus or cause page-wide overflow on narrow screens.

**Mitigation**: Keep existing signals, computed values, service calls, action methods, router links, IDs, query-parameter behavior, and formatter methods. Use explicit displayed-column arrays per page that match the current column order. Preserve row IDs for owner/stay selected-row scrolling. Use Material anchors with `routerLink` for existing navigation and Material buttons for existing click actions. Use current role/action methods for account management. Limit global style cleanup to native overview table selectors that are superseded by this feature, leaving generic native form/control coexistence styles and FullCalendar-specific table overrides intact.

**Proof required**: Unit tests or DOM tests for rendered Material table headers/content/actions, owner/stay selected-row IDs, cat owner navigation query params, filtering/empty states, account current-user marker and role/enabled actions, stay cancellation/unavailable action behavior, and loading/error state preservation where practical. Manual or browser-controlled keyboard/responsive smoke must verify focus reachability, visible focus, local horizontal overflow, no page-wide horizontal overflow, and readable desktop/small-laptop layouts after final styling changes.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Owner table columns, search, clear, selected-row ID, edit navigation, states | Angular DOM / Material table markup / router link | Unit or DOM tests plus source review | Rerun after owner template, component, or SCSS changes |
| Cat table columns, owner query-param navigation, search, clear, edit navigation, states | Angular DOM / Material table markup / router link | Unit or DOM tests plus source review | Rerun after cat template, component, or SCSS changes |
| Vet table columns, search, clear, edit navigation, states | Angular DOM / Material table markup / router link | Unit or DOM tests plus source review | Rerun after vet template, component, or SCSS changes |
| Stay table columns, status filters, search filters, selected-row ID, edit/cancel/unavailable actions, cancellation pending/error states | Angular component tests, DOM tests, source review | Unit or DOM tests plus cancellation behavior tests | Rerun after stay template, component, or SCSS changes |
| Account table columns, current-user marker, role select/save, enable/disable, pending disabled states, self-demotion/logout behavior | Existing and updated Angular component tests / DOM tests | Unit tests | Rerun after account template, component, or SCSS changes |
| Keyboard focus, visible focus, local overflow, desktop/small-laptop readability, narrow-screen overflow | Browser visible-device check and keyboard smoke | Manual or browser-controlled smoke | Must be performed after final styling and rerun after relevant late changes |
| Backend contracts, persistence, authorization, stay invariants, route contracts, and out-of-scope issue work | Source/diff review | Scope review | No backend, migration, API, auth, route-guard, pagination, sorting, configurable-column, detail-dialog, or deletion changes should appear |
| Global and component style cleanup | Source review and responsive smoke | Diff review plus browser smoke | Ensure removed native table/row-action styles are superseded only on migrated surfaces |
| Required frontend gates | Frontend command line | `npm run format:check`, `npm run test:ci`, `npm run build` | Must be rerun after all relevant code/doc changes before final report |

## Project Structure

### Documentation (this feature)

```text
specs/005-mattable-operational-tables/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- material-operational-tables.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/features/owners/pages/owners-overview-page/
frontend/src/app/features/cats/pages/cats-overview-page/
frontend/src/app/features/vets/pages/vets-overview-page/
frontend/src/app/features/stays/pages/stays-overview-page/
frontend/src/app/features/stays/components/stay-search-filters/
frontend/src/app/features/stays/utils/stay-search-filter.util.ts
frontend/src/app/features/stays/utils/stay-status.util.ts
frontend/src/app/features/accounts/pages/account-management-page/
frontend/src/app/features/*/models/
frontend/src/app/features/*/services/
frontend/src/app/core/i18n/translations/
frontend/src/app/shared/ui-state/
frontend/src/app/app.routes.ts
frontend/src/styles.scss
frontend/README.md
docs/ARCHITECTURE.md
```

**Structure Decision**: Keep each table owned by its existing routed standalone page component. Import Material modules directly into the components that use them. Keep table column definitions and displayed-column ordering local to the page. Use existing `UiStateComponent` for page-level loading/empty/error presentation where it already fits. Use the existing route-level `loadComponent` pattern only if needed to keep the production build within current budgets while preserving paths and guards. Do not create a broad Material module, shared table abstraction, sorting/pagination data source layer, or backend contract change in this issue.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records non-applicability for persistence, API payload, and structured data changes.
- [contracts/material-operational-tables.md](./contracts/material-operational-tables.md) records the migrated table UI contract.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts and planned implementation are frontend table presentation only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, API payload, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected approach matches the approved #176/#177 Material foundation and #178 shared feedback/action conventions while avoiding duplicate table infrastructure.
- **Focused validation**: Still pass. Quickstart validation includes the issue-required frontend commands, behavior review, source-map review, and keyboard/responsive smoke checks for migrated tables.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are planned only if implemented table conventions alter source-of-truth frontend documentation; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The cross-table Material migration is justified by issue #181 and the previously approved Material migration decisions.
