# Implementation Plan: Material Controls Migration

**Branch**: `feat/182-migrate-calendar-dashboard-and-remaining-controls-to-angular-material` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-material-controls-migration/spec.md`

## Summary

Migrate the dashboard actions, calendar filters/display controls/surrounding actions, and remaining eligible non-form/non-table controls to Angular Material while preserving existing routes, filter semantics, translations, authorization-sensitive availability, keyboard behavior, responsive behavior, and FullCalendar rendering. The implementation will reuse the approved Angular Material foundation already present in the frontend, import only directly used Material modules into existing standalone components, keep FullCalendar and product-specific calendar layout custom, and record explicit reasons for retained native or vendor-owned interactive controls.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and repository documentation.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, Angular Material 21.2.x, Angular CDK 21.2.x, Angular animations 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature reuses installed Material button, card, checkbox, radio, form-field, input, autocomplete, and shared state patterns where appropriate; it does not add dependencies.

**Storage**: No backend persistence or database storage is affected. Existing calendar browser preferences in localStorage for display mode and visible month are preserved, but no new browser storage key or data shape is introduced.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus calendar, dashboard, keyboard, and target-iPhone smoke tests. Existing frontend unit tests run through the Angular unit-test builder with Vitest/jsdom. Focused tests should be added or updated where Material migration changes rendered structure, control semantics, dashboard navigation controls, calendar filters, display options, or stay search filters.

**Target Platform**: Angular administration UI served by the existing frontend build and production Nginx path. Migrated controls are authenticated administration surfaces and must remain usable on supported desktop and target-iPhone viewports.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only presentation and interaction-preservation work.

**Performance Goals**: N/A. No performance target is specified. Existing frontend production build budgets remain active and must still pass.

**Constraints**: Preserve existing routes, filters, display behavior, calendar local preferences, translations, authorization-sensitive visibility/availability, service calls, API contracts, backend behavior, loading/empty/error states, and FullCalendar rendering. Keep FullCalendar and product-specific calendar layouts custom. Do not add new filters, sorting, display modes, route behavior, backend calls, persistence behavior, authorization rules, dark mode, full-month occupancy mode, or broad design-system refactors. Record an explicit reason for intentionally retained native or vendor-owned interactive controls.

**Scale/Scope**: Dashboard page controls and navigation links; calendar page header actions, status filters, display option controls, and stay search filter component; shared feedback action controls if remaining native behavior is discovered; global styles only where superseded native control styling is no longer needed. Forms, application shell, operational tables, backend, API contracts, persistence, and FullCalendar internals are outside implementation scope except for review and retention notes.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The work supports existing CatWorld administration UI surfaces and does not add cross-species, multi-tenant, generic platform, or unrelated product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. Existing backend validation, authorization, stay status derivation, and data integrity remain unchanged. Frontend controls remain presentation and interaction surfaces only.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Calendar and stay search controls display and filter existing stay data only. Stay status remains derived from dates and cancellation data, and core stay invariants remain backend-protected.
- **Specification and planning discipline**: Pass. The specification distinguishes observable behavior, scope, edge cases, exclusions, assumptions, state-sensitive behavior, FullCalendar boundaries, and validation. No unresolved major product or architecture decisions remain.
- **Architecture and technology assessment**: Pass. This issue applies the already approved Angular Material foundation to remaining eligible controls and does not introduce a new framework, dependency, persistence strategy, API contract, or shared infrastructure decision.
- **Focused changes and proportional validation**: Pass. Scope is limited to frontend control migration and explicit exception documentation, with focused unit/DOM tests plus format, test, build, keyboard, calendar, dashboard, and target-iPhone smoke validation.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, recovery, or operations behavior changes are planned. Source-of-truth updates are limited to feature artifacts unless implementation reveals a durable frontend documentation change.

## Architecture and Technology Assessment

**Assessment required**: No. This is routine use of the already approved Angular Material frontend stack and existing FullCalendar integration, with no new significant framework, library, shared infrastructure, persistence, security, operational, or API-contract decision.

**Decision trigger**: N/A for architecture approval. Semantic-equivalence review is still required because UI primitives and interaction mechanisms are being replaced.

**Options considered**:

- Existing platform/framework/project capability: Use the existing Angular Material/CDK dependency and current standalone component import pattern. This fits the issue and prior approved Material migration direction.
- Established library/framework/service: N/A as a new choice. Angular Material is already installed and approved; adding another component library would be unrequested and out of scope.
- Focused custom implementation: Keep or expand custom native controls. This is appropriate only where Material has no suitable equivalent or where the control is owned by FullCalendar; otherwise it conflicts with #182.

**Selected approach**: N/A as a new architecture decision. Apply existing Angular Material controls directly in the owning standalone components and keep FullCalendar-owned rendering intact.

**Why selected**: Reuses the approved UI foundation, minimizes migration scope, avoids duplicate shared infrastructure, and keeps behavior-preserving work close to the existing dashboard, calendar, and search-filter components.

**Confirmed medium-term use**: #176 and #177 established the Material migration direction; #178-#181 covered shell, feedback/forms, and table-related surfaces. This issue completes the remaining eligible controls in that approved sequence.

**Maintenance and operational consequences**: The frontend continues to own Angular Material/CDK upgrades with Angular upgrades. Native control retention notes must be updated if future work replaces retained vendor or card-link controls.

**Reversibility and migration path**: Changes are local to dashboard, calendar, stay search filters, related tests, styles, and feature artifacts. Reverting this issue does not require backend, database, API, or migration rollback.

**Human approval**: N/A for this plan because no new significant technical decision is selected. The plan references the still-applicable approved Angular Material foundation and does not materially change that approach.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. Dashboard links/actions, calendar checkboxes/radios/actions, stay search filter inputs/buttons/options, and remaining feedback/action controls can change semantics when replaced with Material components.

**Old behavior/source of truth**: Existing components and styles under `frontend/src/app/features/dashboard/pages/dashboard-page/`, `frontend/src/app/features/calendar/pages/calendar-page/`, `frontend/src/app/features/stays/components/stay-search-filters/`, `frontend/src/app/shared/ui-state/`, `frontend/src/app/core/i18n/translations/`, and `frontend/src/styles.scss`; existing FullCalendar integration in `CalendarPage`; current route definitions in `frontend/src/app/app.routes.ts`; issue #182 and this specification.

**New mechanism semantics**: Angular Material buttons and anchors for navigation/actions; Material checkbox and radio controls for calendar status and display options; Material form-field/input/autocomplete/button controls for stay search filters where equivalent; Material card visuals for dashboard presentation where suitable; FullCalendar's own vendor-rendered toolbar/buttons remain owned by FullCalendar.

**Mismatch risks**: Material checkbox/radio change events could alter filter update timing; Material autocomplete could change option selection, clearing, or no-match states; Material anchors/buttons could change router behavior or disabled semantics; dashboard card navigation could lose link semantics if converted to non-anchor cards; Material form-field labels/placeholders could change translated copy; responsive Material wrappers could cause text clipping or page-wide overflow; FullCalendar internal buttons could be mistaken for app-owned controls and replaced out of scope.

**Mitigation**: Preserve existing signals, methods, route links, query params, service calls, localStorage preference shape, labels, translation keys, and FullCalendar options. Keep dashboard card navigation as real anchors if no Material card-link control preserves semantics; record the retention reason. Use Material components only where they preserve existing behavior. Keep responsive/product-specific layout in component SCSS. Record FullCalendar vendor-owned controls as intentionally retained because replacing them would replace or fork FullCalendar behavior, which #182 excludes.

**Proof required**: Unit or DOM tests for dashboard Material actions/links, calendar status filtering, display mode toggles, filtered daily labels toggle, stay search filter selection/clear/no-match behavior, and UI-state retry action if touched. Browser/manual smoke for calendar behavior, dashboard navigation controls, keyboard focus, target-iPhone viewport, local overflow, and FullCalendar rendering. Diff review must confirm no backend, persistence, route-guard, authorization, new filter, new display mode, or dark-mode work appears.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Dashboard actions and card navigation preserve routes, labels, and focus | Angular DOM / router link / Material button or card markup | Unit or DOM tests plus dashboard smoke | Rerun after dashboard template, component, or SCSS changes |
| Calendar header actions preserve routes and translated labels | Angular DOM / router link / Material button markup | Unit or DOM tests plus calendar smoke | Rerun after calendar template or SCSS changes |
| Calendar status filters preserve visibility state and filtering | Angular DOM / component signals / Material checkbox | Unit or DOM tests plus calendar smoke | Rerun after calendar control or filtering changes |
| Calendar display options preserve unfiltered display mode and filtered daily-label behavior | Angular DOM / component signals / Material radio/checkbox | Unit or DOM tests plus calendar smoke | Rerun after calendar display option changes |
| Stay search filters preserve cat/owner search, option selection, no-match states, and clearing | Angular DOM / component state / Material input/autocomplete/button | Unit or DOM tests | Rerun after search filter template, component, or SCSS changes |
| FullCalendar remains integrated and product-specific rendering remains custom | Calendar source review / browser smoke | Source review plus visible smoke | Rerun after calendar template, options, or styles change |
| Retained native or vendor-owned controls have explicit reasons | Feature contract / source review | Inventory review | Update after final control scan |
| Keyboard focus, visible focus, target-iPhone layout, local overflow, and no incoherent overlap | Browser visible-device check and keyboard smoke | Manual or browser-controlled smoke | Must be performed after final styling and rerun after relevant late changes |
| Backend contracts, persistence, authorization, stay invariants, route guards, and out-of-scope issue work | Source/diff review | Scope review | No backend, migration, API, auth, route-guard, new filter/display mode, dark-mode, or FullCalendar replacement changes should appear |
| Required frontend gates | Frontend command line | `npm run format:check`, `npm run test:ci`, `npm run build` | Must be rerun after all relevant code/doc changes before final report |

## Project Structure

### Documentation (this feature)

```text
specs/006-material-controls-migration/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- material-controls.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/features/dashboard/pages/dashboard-page/
frontend/src/app/features/calendar/pages/calendar-page/
frontend/src/app/features/stays/components/stay-search-filters/
frontend/src/app/features/stays/utils/stay-search-filter.util.ts
frontend/src/app/features/stays/services/stay-status-visibility-preferences.service.ts
frontend/src/app/features/stays/utils/stay-status.util.ts
frontend/src/app/core/i18n/translations/dashboard.translations.ts
frontend/src/app/core/i18n/translations/calendar.translations.ts
frontend/src/app/core/i18n/translations/stays.translations.ts
frontend/src/app/shared/ui-state/
frontend/src/app/app.routes.ts
frontend/src/styles.scss
```

**Structure Decision**: Keep each control owned by its existing routed page or small feature component. Import Material modules directly into standalone components that use them. Keep FullCalendar options and product-specific calendar rendering in `CalendarPage`. Keep search filter behavior in `StaySearchFiltersComponent`. Do not create a broad shared control abstraction, replace FullCalendar, add new routes, or change backend/service contracts.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records non-applicability for domain, persistence, API payload, and structured data changes.
- [contracts/material-controls.md](./contracts/material-controls.md) records the migrated controls UI contract and native/vendor retention contract.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts and planned implementation are frontend presentation/control migration only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, API payload, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected implementation path uses already approved Angular Material and existing FullCalendar integration without a new significant technical decision.
- **Focused validation**: Still pass. Quickstart validation includes the issue-required frontend commands, behavior review, source-map review, and keyboard/calendar/dashboard/target-iPhone smoke checks.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are limited to feature artifacts unless implementation reveals a durable frontend documentation need; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The control migration is justified by issue #182 and the previously approved Material migration decisions.
