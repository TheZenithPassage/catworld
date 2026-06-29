# Implementation Plan: Angular Material Foundation

**Branch**: `feat/177-angular-material-foundation` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-angular-material-foundation/spec.md`

## Summary

Establish Angular Material as CatWorld's frontend UI foundation for the authenticated administration interface without changing product behavior. The implementation will add compatible Angular Material/CDK dependencies, configure one application-wide CatWorld Material theme through public Material APIs, document migration boundaries, and preserve all existing routes, authorization behavior, internationalization, FullCalendar usage, and page-level behavior.

## Technical Context

**Language/Version**: Backend Java 17 remains unchanged. Frontend uses Angular 21.2.x, TypeScript 5.9.x, SCSS, Node.js 22 in frontend CI, and npm 11.9.0 per `frontend/package.json` and `docs/ARCHITECTURE.md`.

**Primary Dependencies**: Existing frontend dependencies include Angular 21.2.x, RxJS 7.8.x, FullCalendar 6.1.x, Vitest 4.0.x, jsdom 28.x, and Prettier 3.8.x. This feature adds Angular Material and Angular CDK on the Angular 21.2.x line. Npm metadata checked during planning shows `@angular/material@21.2.x` depends on matching `@angular/cdk@21.2.x` and peers against Angular `^21.0.0 || ^22.0.0`, which is compatible with the current Angular 21 line.

**Storage**: N/A. No backend persistence, browser storage, database schema, or Flyway migration is affected.

**Testing**: Required validation is `cd frontend && npm run format:check`, `cd frontend && npm run test:ci`, and `cd frontend && npm run build`. Frontend tests run through the Angular unit-test builder with Vitest/jsdom as represented by current package metadata and scripts.

**Target Platform**: Authenticated Angular administration UI served by the existing frontend build and production Nginx path. Existing CI uses Node.js 22. Browser behavior must remain compatible with current supported CatWorld usage; #176 separately requires keyboard interaction and target iPhone validation for migrated surfaces, while #177 only establishes the foundation and conventions.

**Project Type**: CatWorld full-stack web administration system with a Spring Boot backend and Angular frontend. This feature is frontend-only enabling work.

**Performance Goals**: No new performance target is specified. Existing production build budgets in `frontend/angular.json` remain active and must still pass.

**Constraints**: Preserve existing product behavior, routes, authorization behavior, internationalization, and FullCalendar usage. Do not migrate complete forms, tables, shell, feature pages, or full application pages. Do not implement #126 dark-mode preference, replace FullCalendar, build a separate design-system package, alter backend behavior, or introduce unsupported Material customization.

**Scale/Scope**: One foundation PR for #177. It supports later child issues under #176 but does not perform their page/control migrations.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The work supports the existing CatWorld administration UI and does not add cross-species, multi-tenant, generic platform, or non-cat-boarding product scope.
- **Layered monolith responsibilities**: Pass. Backend controller, service, repository, database, DTO, and mapper boundaries are not touched.
- **Backend and database authority**: Pass. No business rule, authorization rule, validation authority, or important calculation is moved to the frontend. Frontend remains presentation behavior only.
- **Schema evolution**: Pass. No schema changes or persistence changes are planned; Flyway is not involved.
- **Protected stay model**: Pass. Stay status and stay invariants are not affected.
- **Specification and planning discipline**: Pass. The specification distinguishes scope, exclusions, assumptions, edge cases, and the need for an architecture and technology assessment before implementation.
- **Architecture and technology assessment**: Pass for planning. The feature introduces a significant dependency, cross-cutting UI foundation, accessibility/correctness responsibility, and future migration cost. The assessment below records the options, selected approach, tradeoffs, reversibility, and approval source.
- **Focused changes and proportional validation**: Pass. Scope is limited to dependency/theme setup, migration-boundary documentation, and validation. Required frontend format, tests, and production build are proportional to this frontend foundation change.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, backup, or recovery behavior changes are planned. `docs/ARCHITECTURE.md` and `frontend/README.md` are the relevant source-of-truth documentation candidates for the implemented foundation.

## Architecture and Technology Assessment

**Assessment required**: Yes. This feature introduces a significant frontend dependency, a shared/cross-cutting UI foundation, non-trivial accessibility and interaction expectations, confirmed repeated use across #176 child issues, and meaningful migration/replacement cost.

**Decision trigger**: significant shared capability; significant cross-cutting concern; confirmed repeated approved use; non-trivial accessibility or correctness responsibility; significant dependency; meaningful replacement or migration cost.

**Options considered**:

- Existing platform/framework/project capability: Continue with Angular, native controls, and CatWorld's current global/component SCSS. This has the lowest immediate dependency cost, but #176 explicitly rejects maintaining a parallel global component system for native buttons, inputs, selects, textareas, and tables after replacements are in place. It would leave later migration issues without shared accessibility, theming, table, dialog, and form conventions.
- Established library/framework/service: Adopt Angular Material and CDK as the default frontend UI foundation. This matches the current Angular framework, provides supported theming APIs, interactive components, accessibility-oriented primitives, and first-party compatibility with Angular. It carries dependency and upgrade ownership, but it is the prior approved direction in #176 and is the best fit for repeated forms, tables, dialogs, navigation controls, filters, actions, and feedback states.
- Focused custom implementation: Build or continue custom CatWorld component utilities. This could preserve exact current presentation, but would require ongoing accessibility, keyboard interaction, table, dialog, overlay, and form-control maintenance without confirmed value. #176 explicitly excludes a generic design-system package or parallel global component system.

**Selected approach**: Adopt Angular Material and CDK as CatWorld's frontend UI foundation for the authenticated administration interface, using Material public theming/customization APIs plus local component SCSS for layout and product-specific presentation.

**Why selected**: This approach satisfies #177 and the confirmed #176 decisions with the smallest approved foundation for later migrations. It keeps CatWorld on Angular-native tooling, gives later child issues a consistent component and styling contract, preserves custom FullCalendar/product layout areas where Material does not provide the relevant interaction, and avoids inventing a design-system package.

**Confirmed medium-term use**: #176 identifies #178, #179, #180, #181, #182, and #183 as follow-on migration and cleanup issues that depend on this foundation. The foundation is expected to support forms, operational tables, dialogs, navigation controls, filters, actions, and feedback states across the authenticated administration interface.

**Maintenance and operational consequences**: The frontend owns Material/CDK dependency upgrades alongside Angular upgrades. Customization must stay inside supported Material theming APIs and public component APIs. Component SCSS remains responsible for local layout, responsive composition, and product-specific presentation. Global styles remain limited to theme setup, document/application defaults, shared utilities, and external-library integration. Build budgets, tests, format, and production build remain the operational validation gates.

**Reversibility and migration path**: Before child migrations, reverting the foundation is mostly dependency, global style, and documentation removal. After child migrations, replacing Material would be a medium-to-high migration cost because forms, tables, dialogs, navigation controls, filters, actions, and feedback states would depend on Material contracts. Keeping #177 limited to setup and conventions reduces initial lock-in while making the later migration path explicit.

**Human approval**: Approved. The user explicitly approved this feature plan and the selected Angular Material approach on 2026-06-29. The primary architectural direction is also supported by GitHub issue #176, which records Angular Material as the default source of interactive components, application-wide theming, and shared UI behavior. This #177 plan applies that still-current decision to the foundation issue and does not introduce a conflicting framework or design-system direction.

## Project Structure

### Documentation (this feature)

```text
specs/001-angular-material-foundation/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- frontend-ui-foundation.md
`-- tasks.md             # Future /speckit-tasks output, not created by /speckit-plan
```

### Source Code (repository root)

```text
frontend/package.json
frontend/package-lock.json
frontend/angular.json
frontend/src/styles.scss
frontend/src/app/
frontend/src/app/shared/
frontend/src/app/layout/
docs/ARCHITECTURE.md
frontend/README.md
```

**Structure Decision**: Keep foundation implementation inside the existing Angular application. Use `frontend/src/styles.scss` for Material theme setup, document/application defaults, shared utilities, and external-library integration boundaries. Use feature and component SCSS for layout, responsive composition, and product-specific presentation. Use existing `frontend/src/app/shared/` and `frontend/src/app/layout/` only for narrowly scoped reusable UI or shell integration needed by the foundation; do not create a separate design-system package.

## Phase 0 Research Summary

Phase 0 research is captured in [research.md](./research.md). All planning unknowns are resolved without `[NEEDS CLARIFICATION]` markers.

## Phase 1 Design Summary

Phase 1 design artifacts are complete:

- [data-model.md](./data-model.md) records the non-persistent planning entities and validation rules.
- [contracts/frontend-ui-foundation.md](./contracts/frontend-ui-foundation.md) records the frontend UI foundation contract for later migration issues.
- [quickstart.md](./quickstart.md) records implementation validation scenarios and expected outcomes.

## Post-Design Constitution Check

- **Domain and backend principles**: Still pass. Phase 1 artifacts are frontend foundation and documentation contracts only.
- **Schema, persistence, and stay model**: Still pass. No storage, Flyway, database, or stay invariant work is introduced.
- **Architecture and technology assessment**: Still pass. The selected approach matches #176 and defines constrained Material usage, supported customization APIs, and reversibility boundaries.
- **Focused validation**: Still pass. Quickstart validation includes the exact issue-required frontend commands plus review checks for no complete page migration and no product behavior change.
- **Operational/source-of-truth safety**: Still pass. Documentation updates are planned where source-of-truth behavior changes; no operational exposure or secrets are affected.

## Complexity Tracking

No constitution-level complexity exceptions are required. The added dependency and cross-cutting UI foundation are justified in the Architecture and Technology Assessment and are already approved by #176.
