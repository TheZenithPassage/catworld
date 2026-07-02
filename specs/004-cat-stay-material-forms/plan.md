# Implementation Plan: Cat and Stay Material Forms

**Branch**: `feat/180-migrate-cat-and-stay-forms-to-angular-material` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-cat-stay-material-forms/spec.md`

## Summary

Migrate the existing cat create/edit and stay create/edit workflows to the Angular Material form pattern established by issue #179 while preserving signal-backed form state, request payloads, validation timing, backend-error behavior, loading and disabled states, translations, related-record navigation, query-parameter behavior, stay owner/cat selection behavior, and stay date/time string semantics. The implementation will reuse the approved #177 Material foundation, import only directly used Material modules in each standalone page, keep product-specific responsive layout in component SCSS, and remove native form/card styling that is superseded solely for these migrated cat and stay surfaces.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and repository documentation.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, Angular Material 21.2.x, Angular CDK 21.2.x, Angular animations 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature reuses the installed Angular Material/CDK foundation and shared `UiStateComponent`; it does not add dependencies.

**Storage**: N/A. No backend persistence, browser storage, database schema, API payload shape, or Flyway migration is affected.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus keyboard/touch mobile form smoke testing at 320, 375, and 390 CSS pixels. Existing frontend unit tests run through the Angular unit-test builder with Vitest/jsdom. Cat and stay form behavior coverage must be added because the migration changes rendered structure, disabled states, validation presentation, backend-error presentation, select/checkbox presentation, and date/time form markup while preserving payload and navigation behavior.

**Target Platform**: Angular administration UI served by the existing frontend build and production Nginx path. Cat and stay forms are authenticated administration routes. Migrated forms must remain usable on desktop and at 320, 375, and 390 CSS pixels, including target-iPhone widths.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only form presentation work.

**Performance Goals**: N/A. No performance target is specified. Existing frontend production build budgets remain active and must still pass.

**Constraints**: Preserve existing request payloads, date and datetime string values, optional blank-to-null behavior, validation rules, translation access, related-record links, query-parameter behavior, owner/vet interactions, stay owner/cat selection, stay status modification rules, navigation, loading behavior, disabled behavior, backend-error behavior, route contracts, API contracts, authorization behavior, backend behavior, persistence, and CatWorld domain rules. Keep form layout and responsive composition in component SCSS. Existing production build budgets remain active and must pass; route implementation may be adjusted only when the user-visible path and guard contract remain unchanged. Do not implement searchable selectors, draft restoration, cat photo controls, vaccine warnings, pricing behavior, calculated-night behavior, backend contract changes, or unrelated product redesign.

**Scale/Scope**: Four routed form pages: `CatCreatePage`, `CatEditPage`, `StayCreatePage`, and `StayEditPage`.

## Constitution Check

_GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment._

_GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design._

- **Domain focus and sustainable evolution**: Pass. The work supports existing CatWorld cat and stay administration workflows and does not add cross-species, multi-tenant, generic platform, or non-cat-boarding product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. Existing backend validation, authorization, and stay business-rule authority are preserved. Frontend validation presentation remains assistive and does not become the sole protection for persisted integrity.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Stay status remains derived from dates and cancellation data, and core stay invariants remain backend-protected. The frontend stay forms preserve existing date validation, owner/cat selection behavior, closed-stay modification blocking, and payload semantics without changing backend rules.
- **Specification and planning discipline**: Pass. The specification distinguishes behavior, scope, exclusions, dependencies, assumptions, open questions, observable states, and validation-sensitive behavior. The Material approach is already approved by #176/#177 and the direct form pattern is established by #179.
- **Architecture and technology assessment**: Pass for planning by reference. This feature applies a cross-form UI pattern with accessibility and correctness responsibilities, but it does not reopen the UI framework decision because #176/#177 approved Angular Material and #179 established the form migration pattern.
- **Focused changes and proportional validation**: Pass. Scope is limited to four frontend form pages plus focused tests, docs, format, test, build, and mobile smoke validation.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes are planned. `docs/ARCHITECTURE.md` and `frontend/README.md` are source-of-truth documentation candidates for implemented cat/stay Material form conventions.

## Architecture and Technology Assessment

**Assessment required**: Yes, by reference. The issue applies a cross-form UI pattern with accessibility and validation-presentation responsibilities, but the significant framework and shared foundation decisions are already approved and still applicable.

**Decision trigger**: significant cross-cutting concern; non-trivial accessibility or correctness responsibility; confirmed repeated approved use; meaningful replacement or migration cost.

**Options considered**:

- Existing platform/framework/project capability: Keep the native label/input/select/checkbox/button forms and existing native global form styles. This would avoid local migration work but conflicts with #180 and the approved #176/#177/#179 migration direction.
- Established library/framework/service: Use Angular Material form fields, inputs, selects, checkboxes, buttons, and existing shared Material-compatible state presentation on top of the #177 foundation and #179 form pattern. This matches the approved Material foundation, current Angular version, issue acceptance criteria, and prior form conventions.
- Focused custom implementation: Build custom CatWorld form controls, custom date/time widgets, or a broader form abstraction. This would create the competing component system excluded by #176/#177/#179 and increase accessibility and maintenance responsibility without confirmed value.

**Selected approach**: Use Angular Material form-field, input, select, checkbox, button, and shared feedback primitives from the existing #177/#179 foundation directly in each in-scope standalone form page. Preserve current signal-backed form state and submit methods. Use Material input presentation for existing `date` and `datetime-local` string controls to avoid changing payload semantics or splitting stay date/time behavior. Keep layout and responsive composition in page component SCSS.

**Why selected**: This directly satisfies #180, reuses the approved foundation and established form pattern, avoids duplicate UI infrastructure, and keeps behavior changes out of scope. Preserving native date/datetime input value semantics inside Material form fields avoids a risky conversion from existing API strings to date/time objects.

**Confirmed medium-term use**: #176 identifies later form and table migration issues. #180 explicitly migrates the complex cat and stay forms so later issues such as #119, #154, #160, #162, #165, #168, and #173 can build on the migrated surfaces.

**Maintenance and operational consequences**: The frontend continues to own Angular Material/CDK upgrades alongside Angular upgrades. Form customization must stay within Material public APIs and page component SCSS. Existing tests must cover behavior that could regress through template, select, checkbox, date/time, and disabled-state changes, and mobile smoke validation must cover small-width cat and stay layouts.

**Reversibility and migration path**: Reverting #180 is local to the four form page components, their page SCSS, related tests, global native-form style cleanup, and documentation updates. Future searchable selectors or date/time UI redesign can be planned separately without changing backend contracts from this issue.

**Human approval**: Approved by prior decisions. GitHub issue #176 approved Angular Material as the default frontend UI foundation, issue #177's plan recorded human approval for that foundation and migration boundary on 2026-06-29, and issue #179 established the local Material form pattern for login, owner and vet forms. Issue #180 explicitly requests applying that established pattern to cat and stay forms. This plan applies those still-current decisions without selecting a materially different framework, shared abstraction, persistence strategy, or API contract.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. Native form fields, selects, checkboxes, buttons, field-level/page-level error presentation, and form card styling are being replaced by Angular Material presentation while preserving existing behavior.

**Old behavior/source of truth**: Existing cat and stay page components under `frontend/src/app/features/cats/pages/*` and `frontend/src/app/features/stays/pages/*`; current models in `cat.model.ts` and `stay.model.ts`; current service contracts; current translated copy; `docs/ARCHITECTURE.md` stay model rules; #179 Material form examples in login, owner, and vet pages.

**New mechanism semantics**: Angular Material form fields, `matInput`, `mat-select`, `mat-checkbox`, Material buttons, `UiStateComponent`, and component SCSS. Existing `date` and `datetime-local` HTML input types remain the value source for date/datetime strings while using Material input presentation.

**Mismatch risks**: Field errors could appear at different times; `mat-select` value handling could change empty-string optional selection semantics; `mat-checkbox` events could alter multi-cat selection order or duplicates; Material buttons and disabled state could change submit behavior; `date` and `datetime-local` wrapping could alter payload strings; replacing page-level error markup with `UiStateComponent` could change alert semantics or scroll behavior; removing global form styles could affect unmigrated surfaces or table/filter controls; small-width layouts could overlap with Material field subscript content.

**Mitigation**: Keep existing signal state, submit methods, payload shaping, query-param helpers, and navigation methods. Add explicit field error signals only where needed to render Material errors without changing submit timing. Use Material-supported native selects that match existing string IDs and empty values. Use `mat-checkbox` change events to call existing selection methods. Preserve `type="date"` and `type="datetime-local"` value strings through `matInput`. Lazy-load the stay-create route only if needed to keep the existing production build budget passing while preserving the `/stays/new` path and guard contract. Limit global style cleanup to selectors superseded by migrated cat/stay forms while preserving coexistence styles for remaining native controls and filters.

**Proof required**: Unit tests for Material rendering, validation blocking, payload shaping, backend errors, load states, related navigation/query params, owner/vet selection, stay owner/cat filtering, multi-cat selection, stay closed-state edit blocking, and date/datetime string preservation. Manual or browser-controlled keyboard/touch smoke at 320, 375, and 390 CSS pixels must verify form usability and lack of incoherent overlap after the final relevant styling changes.

## Validation Evidence Plan

| Surface / Requirement                                                                                                                             | Responsible Layer                        | Evidence Type                                              | Freshness / Manual Notes                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Cat create/edit Material rendering and validation presentation                                                                                    | Angular DOM / Material component markup  | Unit tests plus review                                     | Rerun after cat template, component, or SCSS changes                                                                             |
| Cat payload shaping, blank-to-null values, backend errors, owner/vet selection, related create links, and query-param return flow                 | Angular component tests and router mocks | Unit tests                                                 | Rerun after cat component/template changes                                                                                       |
| Stay create Material rendering, owner filtering, multi-cat checkboxes, query-param preselection, related owner/cat links, and payload shaping     | Angular component tests and DOM tests    | Unit tests                                                 | Rerun after stay create component/template changes                                                                               |
| Stay edit Material rendering, closed-stay blocking, date/datetime preservation, notes blank-to-null values, backend errors, and update navigation | Angular component tests and DOM tests    | Unit tests                                                 | Rerun after stay edit component/template changes                                                                                 |
| Date, datetime, optional-value, select, checkbox, keyboard and touch usability                                                                    | DOM review plus browser/mobile smoke     | Manual or browser-controlled smoke                         | Must be performed after final styling and rerun after relevant late changes                                                      |
| Responsive composition at 320, 375, and 390 CSS pixels                                                                                            | Browser visible-device check             | Manual or browser-controlled smoke                         | Must be fresh after SCSS/global style cleanup                                                                                    |
| Backend contracts, persistence, authorization, stay invariants, route contracts, and out-of-scope issue work                                      | Source review                            | Diff/source-map review                                     | No backend, migration, API, route-guard, searchable-selector, photo, warning, pricing, or calculated-night changes should appear |
| Source-of-truth documentation for Material form coexistence                                                                                       | Docs review                              | Documentation diff review                                  | Update if implemented conventions or remaining native-control boundaries change                                                  |
| Required frontend gates                                                                                                                           | Frontend command line                    | `npm run format:check`, `npm run test:ci`, `npm run build` | Must be rerun after all relevant code/doc changes before final report                                                            |

## Project Structure

### Documentation (this feature)

```text
specs/004-cat-stay-material-forms/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- material-cat-stay-forms.md
`-- tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/features/cats/pages/cat-create-page/
frontend/src/app/features/cats/pages/cat-edit-page/
frontend/src/app/features/cats/models/cat.model.ts
frontend/src/app/features/cats/services/cat-api.service.ts
frontend/src/app/features/stays/pages/stay-create-page/
frontend/src/app/features/stays/pages/stay-edit-page/
frontend/src/app/features/stays/models/stay.model.ts
frontend/src/app/features/stays/services/stay-api.service.ts
frontend/src/app/features/stays/utils/stay-status.util.ts
frontend/src/app/app.routes.ts
frontend/src/app/shared/forms/trim-required.directive.ts
frontend/src/app/shared/ui-state/
frontend/src/styles.scss
docs/ARCHITECTURE.md
frontend/README.md
```

**Structure Decision**: Keep each form owned by its existing routed standalone page component. Import Material modules directly into the component that uses them. Use `UiStateComponent` for page-level loading/error feedback where that matches existing behavior; field-level validation presentation remains owned by the form page template. Preserve route paths and guards, with targeted lazy loading allowed only to keep the existing production build budget passing. Do not create a broad Material module, design-system package, searchable selector, date/time abstraction, or reusable form abstraction in this issue.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records non-applicability for persistence, API payload, and structured data changes.
- [contracts/material-cat-stay-forms.md](./contracts/material-cat-stay-forms.md) records the migrated cat/stay form UI contract.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts and planned implementation are frontend form presentation only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, API payload, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected approach matches the approved #176/#177 Material foundation and #179 form pattern while avoiding duplicate form infrastructure.
- **Focused validation**: Still pass. Quickstart validation includes the issue-required frontend commands, behavior review, source-map review, and keyboard/touch mobile smoke checks at 320, 375, and 390 CSS pixels.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are planned only for implemented form migration conventions; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The cross-form Material migration is justified by issue #180 and the previously approved Material migration decisions.
