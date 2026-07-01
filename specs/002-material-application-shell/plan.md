# Implementation Plan: Material Application Shell

**Branch**: `feat/178-material-application-shell` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-material-application-shell/spec.md`

## Summary

Migrate the authenticated CatWorld application shell and shared loading, empty, and error states to Angular Material while preserving existing routes, guards, API calls, translations, and stay/cat/customer workflows. The implementation will reuse the #177 Material foundation, migrate shell controls and surfaces in `frontend/src/app/app.*`, introduce narrowly scoped reusable Material-compatible shared state presentation, update affected i18n keys only when needed for accessibility, and keep complex forms, tables, FullCalendar replacement, backend, persistence, and API contracts out of scope.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and repository documentation.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, Angular Material 21.2.x, Angular CDK 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature reuses the installed Angular Material/CDK foundation from #177 and adds the matching `@angular/animations` 21.2.x package needed for Material overlays instead of introducing another UI framework or design-system package.

**Storage**: N/A. No backend persistence, browser storage, database schema, API payload, or Flyway migration is affected.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, and `cd frontend && npm run build`. Frontend tests run through the Angular unit-test builder with Vitest/jsdom as represented by current package metadata and scripts.

**Target Platform**: Authenticated Angular administration UI served by the existing frontend build and production Nginx path. Existing CI uses Node.js 22. The migrated shell must remain usable on desktop and target iPhone width.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only presentation and shared UI state work.

**Performance Goals**: No new performance target is specified. Existing production build budgets in `frontend/angular.json` remain active and must still pass.

**Constraints**: Preserve existing product routes, guards, authorization behavior, API calls, internationalization system, domain workflows, and FullCalendar usage. Do not migrate complex forms or tables. Do not redesign navigation information architecture, add routes, implement #126 dark-mode preference persistence, replace FullCalendar, alter backend behavior, or introduce a duplicate global design system or shell component library.

**Scale/Scope**: One frontend shell/shared-state migration issue under the #176 Material migration epic. The scope covers the root application shell and reusable loading/empty/error state presentation for migrated shared surfaces, not full feature-page form/table migrations.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The work supports the existing CatWorld administration interface and does not add cross-species, multi-tenant, generic platform, or non-cat-boarding product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. No business rule, authorization rule, validation authority, or important calculation is moved to the frontend. The frontend remains presentation behavior only.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Stay status and stay invariants are not affected.
- **Specification and planning discipline**: Pass. The specification distinguishes behavior, scope, exclusions, dependencies, assumptions, and validation. The Material approach is already approved by #176/#177 and is still applicable to this child migration.
- **Architecture and technology assessment**: Pass for planning. This issue applies the previously approved Angular Material foundation to the shell and shared states. The plan records why that prior approval applies; no new significant framework, dependency, persistence, security, or shared-contract decision is introduced.
- **Focused changes and proportional validation**: Pass. Scope is limited to shell/shared-state presentation, targeted docs, tests, format, and build validation.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes are planned. `docs/ARCHITECTURE.md` and `frontend/README.md` are source-of-truth documentation candidates for the implemented shell/shared-state conventions.

## Architecture and Technology Assessment

**Assessment required**: Yes, by reference. The feature touches cross-cutting UI behavior and accessibility-sensitive shell/navigation states, but it does not reopen the UI framework decision because #176/#177 already approved Angular Material as the frontend foundation.

**Decision trigger**: significant cross-cutting concern; non-trivial accessibility or correctness responsibility; confirmed repeated approved use.

**Options considered**:

- Existing platform/framework/project capability: Continue the handcrafted shell and ad hoc loading/empty/error markup. This would avoid local migration work but conflicts with #178's explicit scope and the approved #176/#177 Material migration direction.
- Established library/framework/service: Use Angular Material shell, navigation, menu, button, icon, progress, card, and surface primitives on top of the existing #177 foundation. This matches the approved foundation, current Angular version, supported theming APIs, and the issue's acceptance criteria.
- Focused custom implementation: Build custom CatWorld shell/state components without Material primitives. This would keep exact current markup but would create the parallel shell/component library that #178 explicitly excludes.

**Selected approach**: Use Angular Material/CDK primitives from the existing #177 foundation for shell controls, responsive navigation, primary shell actions, and shared loading/empty/error state presentation. Keep local SCSS responsible for layout, responsive composition, and CatWorld-specific presentation.

**Why selected**: This directly satisfies #178, reuses the approved #177 foundation, avoids duplicate UI infrastructure, and keeps the migration focused on shell/shared-state presentation without touching backend or domain behavior.

**Confirmed medium-term use**: #176 identifies #178 through later child migration issues as part of the Material migration. #177 explicitly identifies #178 as a follow-on migration issue that should consume the foundation and boundaries.

**Maintenance and operational consequences**: The frontend continues to own Angular Material/CDK upgrades alongside Angular upgrades. Shell and shared-state customization must stay within Material public APIs and local component SCSS. Accessibility names, icon-only affordances, and responsive navigation behavior must remain covered by review and tests where practical.

**Reversibility and migration path**: Reverting #178 would restore the root shell markup/styles and shared-state presentation while keeping the #177 foundation. Replacement cost is local to shell/shared-state components until later feature-page migrations consume the shared patterns more broadly.

**Human approval**: Approved by prior decisions. GitHub issue #176 approved Angular Material as the default frontend UI foundation and issue #177's plan recorded human approval for that foundation and migration boundary on 2026-06-29. This plan applies that still-current decision to issue #178 without selecting a materially different approach.

## Project Structure

### Documentation (this feature)

```text
specs/002-material-application-shell/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- material-shell-and-states.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/app.html
frontend/src/app/app.scss
frontend/src/app/app.ts
frontend/src/app/app.spec.ts
frontend/src/app/core/i18n/translations/app-shell.translations.ts
frontend/src/app/shared/
frontend/src/app/features/*/pages/*/*.html
frontend/src/app/features/*/pages/*/*.ts
frontend/src/app/features/*/pages/*/*.spec.ts
docs/ARCHITECTURE.md
frontend/README.md
```

**Structure Decision**: Keep the application shell in the existing root `App` component because it already owns global navigation, authentication actions, language switching, and routed content. Add only narrowly scoped shared UI state component(s) under `frontend/src/app/shared/` when they replace repeated loading/empty/error presentation. Import Material modules directly into standalone components that use them; do not create a broad global Material module or separate shell library.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records non-applicability for persistence and structured data changes.
- [contracts/material-shell-and-states.md](./contracts/material-shell-and-states.md) records the shell and shared-state UI contract.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts are frontend shell/shared-state UI contracts only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, API payload, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected approach matches the approved #176/#177 Material foundation and avoids duplicate shell/UI infrastructure.
- **Focused validation**: Still pass. Quickstart validation includes the issue-required frontend commands plus review checks for desktop and target iPhone shell behavior, shared state accessibility, no route/API/domain changes, and no complex form/table migration.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are planned only for implemented shell/shared-state conventions; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The cross-cutting shell migration is justified by issue #178 and the previously approved Material migration decision.
