# Implementation Plan: Material Form Migration

**Branch**: `feat/179-migrate-login-owner-and-vet-forms-to-angular-material` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-material-form-migration/spec.md`

## Summary

Migrate the login, owner create/edit, and vet create/edit forms to Angular Material form controls and validation presentation while preserving existing signal-based form state, request payloads, validation timing, backend-error behavior, loading and disabled states, translations, navigation, and route/API contracts. The implementation will reuse the approved #177 Material foundation and #178 shared feedback presentation, import only the Material modules each standalone form component directly uses, keep form layout in component SCSS, and remove native form styling that is superseded solely for these migrated surfaces.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and repository documentation.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, Angular Material 21.2.x, Angular CDK 21.2.x, Angular animations 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature reuses the installed Angular Material/CDK foundation and shared `UiStateComponent`; it does not add dependencies.

**Storage**: N/A. No backend persistence, browser storage, database schema, API payload shape, or Flyway migration is affected.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus a mobile form smoke test at 320, 375, and 390 CSS pixels. Existing frontend unit tests run through the Angular unit-test builder with Vitest/jsdom. Login has existing behavior coverage; owner and vet form behavior coverage must be added or updated where the migration changes rendered structure.

**Target Platform**: Angular administration UI served by the existing frontend build and production Nginx path. Login is public; owner and vet forms are authenticated administration routes. Migrated forms must remain usable on desktop and at 320, 375, and 390 CSS pixels.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only form presentation work.

**Performance Goals**: N/A. No performance target is specified. Existing frontend production build budgets remain active and must still pass.

**Constraints**: Preserve existing request payloads, validation rules, translation access, navigation, submit behavior, loading behavior, disabled behavior, backend-error behavior, route contracts, API contracts, authorization behavior, backend behavior, persistence, and CatWorld domain rules. Keep form layout and responsive composition in component SCSS. Do not migrate cat or stay forms, searchable entity selectors from #160, tables, calendar behavior, shell behavior, or unrelated pages.

**Scale/Scope**: Five routed form pages: `LoginPage`, `OwnerCreatePage`, `OwnerEditPage`, `VetCreatePage`, and `VetEditPage`.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The work supports existing CatWorld administration workflows and does not add cross-species, multi-tenant, generic platform, or non-cat-boarding product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. Existing backend validation and API authority are preserved. Frontend validation presentation remains assistive and does not become the sole protection for persisted integrity.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Stay status and stay invariants are not affected; stay forms are out of scope.
- **Specification and planning discipline**: Pass. The specification distinguishes behavior, scope, exclusions, dependencies, assumptions, and validation. The Material approach is already approved by #176/#177 and reused here.
- **Architecture and technology assessment**: Pass for planning by reference. This feature establishes a reusable form migration pattern and has accessibility/correctness responsibilities, but it does not reopen the UI framework decision because #176/#177 approved Angular Material and #178 established shared feedback presentation.
- **Focused changes and proportional validation**: Pass. Scope is limited to five frontend forms plus focused tests, docs, format, test, build, and mobile smoke validation.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes are planned. `docs/ARCHITECTURE.md` and `frontend/README.md` are source-of-truth documentation candidates for implemented form migration conventions.

## Architecture and Technology Assessment

**Assessment required**: Yes, by reference. The issue applies a cross-form UI pattern with validation and accessibility responsibilities, but the significant framework and shared foundation decisions are already approved and still applicable.

**Decision trigger**: significant cross-cutting concern; non-trivial accessibility or correctness responsibility; confirmed repeated approved use; meaningful migration cost.

**Options considered**:

- Existing platform/framework/project capability: Keep the native label/input/button forms and existing native global form styles. This would avoid local migration work but conflicts with #179 and the approved #176/#177 migration direction.
- Established library/framework/service: Use Angular Material form fields, inputs, buttons, and existing shared Material-compatible state presentation on top of the #177 foundation. This matches the approved Material foundation, current Angular version, issue acceptance criteria, and prior shared feedback conventions.
- Focused custom implementation: Build custom CatWorld form controls or a form component library. This would create the competing component system excluded by #176/#177 and increase accessibility and maintenance responsibility without confirmed value.

**Selected approach**: Use Angular Material form-field, input, button, progress/state, and shared feedback primitives from the existing #177/#178 foundation directly in each in-scope standalone form page. Preserve current signal-based form state and submit methods; keep layout and responsive composition in page component SCSS.

**Why selected**: This directly satisfies #179, reuses the approved foundation, avoids duplicate UI infrastructure, keeps behavior changes out of scope, and establishes a simple reusable pattern for later complex forms without introducing a broad form abstraction.

**Confirmed medium-term use**: #176 identifies later form and table migration issues. #179 explicitly establishes the reusable form pattern for later complex forms while excluding cat and stay forms from this change.

**Maintenance and operational consequences**: The frontend continues to own Angular Material/CDK upgrades alongside Angular upgrades. Form customization must stay within Material public APIs and page component SCSS. Existing tests must cover behavior that could regress through template and disabled-state changes, and mobile smoke validation must cover the small-width form layouts.

**Reversibility and migration path**: Reverting #179 is local to the five form page components, their page SCSS, related tests, and small documentation updates. Later cat/stay form migrations can copy the pattern or introduce a separately approved abstraction if repeated complexity justifies it.

**Human approval**: Approved by prior decisions. GitHub issue #176 approved Angular Material as the default frontend UI foundation, issue #177's plan recorded human approval for that foundation and migration boundary on 2026-06-29, and issue #178 established shared Material feedback presentation. This plan applies those still-current decisions to issue #179 without selecting a materially different approach.

## Project Structure

### Documentation (this feature)

```text
specs/003-material-form-migration/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- material-forms.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/features/auth/pages/login-page/
frontend/src/app/features/owners/pages/owner-create-page/
frontend/src/app/features/owners/pages/owner-edit-page/
frontend/src/app/features/vets/pages/vet-create-page/
frontend/src/app/features/vets/pages/vet-edit-page/
frontend/src/app/shared/ui-state/
frontend/src/styles.scss
docs/ARCHITECTURE.md
frontend/README.md
```

**Structure Decision**: Keep each form owned by its existing routed standalone page component. Import Material modules directly into the component that uses them. Use `UiStateComponent` only for page-level loading/error feedback where it fits the existing behavior; field-level validation presentation remains owned by the form template. Do not create a broad Material module, design-system package, or reusable form abstraction in this issue.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records non-applicability for persistence, API payload, and structured data changes.
- [contracts/material-forms.md](./contracts/material-forms.md) records the migrated form UI contract.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts and planned implementation are frontend form presentation only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, API payload, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected approach matches the approved #176/#177 Material foundation and #178 shared feedback conventions while avoiding duplicate form infrastructure.
- **Focused validation**: Still pass. Quickstart validation includes the issue-required frontend commands, behavior review, and mobile smoke checks at 320, 375, and 390 CSS pixels.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are planned only for implemented form migration conventions; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The cross-form Material migration is justified by issue #179 and the previously approved Material migration decision.
