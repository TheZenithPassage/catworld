# Implementation Plan: Remove Legacy UI Styles

**Branch**: `chore/183-remove-legacy-ui-styles-and-validate-angular-material-migration` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-remove-legacy-ui-styles/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Remove the remaining superseded native-control and native-table styling that only supported pre-Material authenticated administration surfaces, document any intentionally retained native controls, update the architecture source of truth so Angular Material is the completed default UI foundation, and validate the migrated frontend with automated and manual checks. The technical approach is a source audit plus focused CSS/SCSS/documentation cleanup that preserves Material theming, document defaults, shared utilities, layout, responsive composition, CatWorld presentation, and FullCalendar integration.

## Technical Context

**Language/Version**: Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, and npm 11.9.0 from `frontend/package.json`. Repository also contains Java 17/Spring Boot backend code, but this feature does not touch backend runtime code.

**Primary Dependencies**: `@angular/material` 21.2.x, `@angular/cdk` 21.2.x, Angular animations, FullCalendar 6.1.x, RxJS 7.8.x, Vitest 4.0.x, Prettier 3.8.x.

**Storage**: N/A. No persistence, browser storage, API payload, schema, or data model changes.

**Testing**: `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, `cd frontend && npm run build`, plus manual keyboard validation and target-device smoke tests required by issue #183.

**Target Platform**: Browser-based Angular administration frontend built by Angular CLI. CI runs frontend validation on Node.js 22 per `docs/ARCHITECTURE.md`.

**Project Type**: CatWorld full-stack web administration system; this feature affects only the frontend presentation layer and architecture documentation.

**Performance Goals**: N/A. No confirmed throughput, latency, bundle-size, or rendering performance target beyond the existing production build budget.

**Constraints**: Preserve existing routes, behavior, translations, role-sensitive visibility, backend APIs, authorization, persistence, Material theme setup, layout, responsive composition, CatWorld-specific presentation, and FullCalendar integration. Do not implement dark mode or replace FullCalendar.

**Scale/Scope**: Authenticated administration frontend surfaces covered by epic #176, the global frontend stylesheet, affected component styles/templates discovered by audit, and `docs/ARCHITECTURE.md`.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to CatWorld administration UI cleanup and does not introduce platform, multi-tenant, cross-species, or speculative abstractions.
- **Layered monolith responsibilities**: Compliant. Backend controller, service, repository, database, DTO, and mapper responsibilities are untouched.
- **Backend and database authority**: Compliant. No business rules, authorization, validation, calculations, API behavior, or database constraints change.
- **Schema evolution**: Compliant. No schema changes or Flyway migrations are required.
- **Protected stay model**: Compliant. Stay status and stay invariants are untouched.
- **Specification and planning discipline**: Compliant. The spec defines objective technical outcomes, explicit exclusions, preservation expectations, edge cases, and validation evidence. There are no open questions or clarification markers.
- **Architecture and technology assessment**: No new significant architecture, framework, library, persistence, security, shared-contract, or operational decision is introduced. The plan relies on the already approved Angular Material foundation from issue #176 and removes temporary coexistence styling after the approved migration work.
- **Focused changes and proportional validation**: Compliant. Changes are scoped to frontend style/template audit results, architecture documentation, and feature artifacts. Validation includes format, tests, build, source review, keyboard checks, and target-device smoke tests proportional to global style cleanup risk.
- **Operational safety and sources of truth**: Compliant. No secrets, real data, deployment exposure, backup, or recovery procedures change. `docs/ARCHITECTURE.md` is updated because the frontend UI foundation source of truth changes from migration coexistence to completed Material defaults.

## Architecture and Technology Assessment

**Assessment required**: No. This feature does not introduce or replace a significant framework, dependency, shared infrastructure, persistence strategy, security model, shared contract, or costly architectural pattern; it completes cleanup under the already approved Angular Material foundation.

**Decision trigger**: N/A.

**Options considered**:

- Existing platform/framework/project capability: N/A. Angular Material is already the approved foundation and this issue removes temporary legacy support.
- Established library/framework/service: N/A. No new dependency or service is needed.
- Focused custom implementation: N/A. No new custom UI framework or component system is permitted by scope.

**Selected approach**: N/A. Use the existing approved Material foundation and delete superseded native-control styling.

**Why selected**: N/A. The applicable decision was already made by issue #176 and its dependent migration issues; #183 is the validation and cleanup issue.

**Confirmed medium-term use**: N/A.

**Maintenance and operational consequences**: N/A beyond reducing future maintenance by removing parallel native-component CSS.

**Reversibility and migration path**: Removed CSS can be restored from Git if a regression is found, but retained native controls should instead be documented and locally styled only when Material replacement is out of scope.

**Human approval**: N/A because assessment is not required. The plan references the prior approved Material foundation documented in `docs/ARCHITECTURE.md` and issue #176.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. Removing legacy global/component CSS after a UI primitive migration can alter visible state, focus, target size, responsive layout, and third-party integration presentation even when no template behavior changes.

**Old behavior/source of truth**: Existing migrated Angular templates and component styles under `frontend/src/app`, global styles in `frontend/src/styles.scss`, existing frontend tests, `docs/ARCHITECTURE.md`, and issue #183 preservation requirements.

**New mechanism semantics**: Angular Material components already provide button, form-field, input, select, checkbox, table, menu, toolbar, icon, dialog-like overlay, theme token, typography, density, focus, and accessibility semantics where Material replacements were completed. FullCalendar remains a separate third-party integration boundary.

**Mismatch risks**: Retained native controls may lose usable sizing or focus styles; FullCalendar or vendor-owned markup may be mistaken for legacy CatWorld controls; generic selectors may still support document defaults or shared layout; Material components may accidentally inherit removed classes; role-sensitive or responsive controls may regress visually without changing TypeScript behavior.

**Mitigation**: Audit templates and styles before removal, delete only selectors whose sole purpose is superseded native component-system styling, preserve document defaults and integration styles, document retained native controls and reasons, and verify with tests plus manual keyboard and viewport smoke checks.

**Proof required**: Source audit notes, diff review of changed CSS/SCSS/templates, frontend format check, frontend unit tests, production build, manual keyboard validation, target-iPhone smoke test, and small-laptop smoke test after the latest relevant frontend changes.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Legacy native-control and native-table CSS removal (TR-001, SC-001, SC-002) | `frontend/src/styles.scss` and affected component SCSS/templates | Source audit and diff review | Rerun audit after CSS/template changes |
| Approved Material theme, document defaults, layout, utilities, CatWorld presentation, and FullCalendar styling preservation (TR-002) | Global stylesheet, component styles, visible browser UI | Source review plus manual smoke | Rerun after style changes |
| Existing routes, behavior, translations, role-sensitive visibility, and frontend interactions (TR-003) | Angular tests and visible browser UI | `npm run test:ci`, manual keyboard smoke, viewport smoke | Rerun after template/component changes |
| Retained native controls documented with reasons (TR-004) | `docs/ARCHITECTURE.md` or feature audit note | Documentation review | Recheck after audit changes |
| Material default foundation and customization boundaries (TR-005) | `docs/ARCHITECTURE.md` | Documentation diff review | Recheck before final scope review |
| Frontend format, build, and production bundle validity (TR-006, SC-004) | Frontend toolchain | `npm run format:check`, `npm run build` | Rerun after all relevant frontend/docs/spec changes where applicable |
| Target-iPhone and small-laptop usability (SC-005) | Browser viewport/manual visible-device check | Manual smoke checks | Record status explicitly; do not mark passed if unavailable |

## Project Structure

### Documentation (this feature)

```text
specs/007-remove-legacy-ui-styles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-style-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
docs/
└── ARCHITECTURE.md

frontend/
├── README.md
└── src/
    ├── styles.scss
    └── app/
        └── **/*.{html,scss,ts,spec.ts}
```

**Structure Decision**: Keep implementation in the existing Angular frontend and documentation structure. Touch `frontend/src/styles.scss`, affected component templates/styles/tests only when the audit finds superseded native-control styling or undocumented retained controls, `docs/ARCHITECTURE.md` for architecture source-of-truth updates, and `frontend/README.md` if the frontend-local UI foundation notes would otherwise conflict with the completed migration. No backend directories, migrations, API contracts, or deployment files are in scope.

## Complexity Tracking

No additional complexity is required.

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
| N/A | N/A | N/A | N/A |
