# Tasks: Angular Material Foundation

**Input**: Design documents from `specs/001-angular-material-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/frontend-ui-foundation.md, quickstart.md

**Tests**: No separate TDD test tasks are generated because the specification does not request TDD or new business-rule/security/persistence tests. Required validation is captured as executable validation tasks.

**Organization**: Tasks are grouped by verifiable technical outcomes because this feature is technical/enabling work rather than a user journey.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Technical outcome label from spec.md (`TO1`, `TO2`, `TO3`)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend package metadata**: `frontend/package.json`, `frontend/package-lock.json`
- **Frontend global styles/theme**: `frontend/src/styles.scss`
- **Frontend app source**: `frontend/src/app/`
- **Project architecture docs**: `docs/ARCHITECTURE.md`
- **Frontend docs**: `frontend/README.md`

## Phase 1: Setup

**Purpose**: Add the approved Angular Material dependency foundation before theme or documentation work.

- [X] T001 Add compatible `@angular/material` and `@angular/cdk` 21.2.x dependencies in `frontend/package.json` and `frontend/package-lock.json`

---

## Phase 2: Technical Outcome 1 - Install And Theme Material Foundation (Priority: P1)

**Goal**: CatWorld has an approved Angular Material frontend foundation that can be installed, configured, and validated without changing product behavior.

**Verification**: `npm install` completes without Angular/Material peer conflicts, existing product routes and workflows are not intentionally changed, and Material theming is configured through supported APIs while preserving CatWorld identity.

### Implementation for Technical Outcome 1

- [X] T002 [TO1] Configure the CatWorld application-wide Angular Material theme in `frontend/src/styles.scss`
- [X] T003 [TO1] Preserve existing CatWorld global document defaults and native-control coexistence styles in `frontend/src/styles.scss`
- [X] T004 [TO1] Verify `frontend/angular.json` still uses `frontend/src/styles.scss` as the global style entry and does not add unrelated style entry points
- [X] T005 [P] [TO1] Inspect `frontend/src/app/app.routes.ts` and `frontend/src/app/app.config.ts` to confirm no route, authorization, provider, or product workflow changes are required for the foundation

**Checkpoint**: Angular Material/CDK are installed, the Material theme is globally available, and no product behavior or route migration has been introduced.

---

## Phase 3: Technical Outcome 2 - Document Migration Boundaries (Priority: P2)

**Goal**: The migration contract defines how Material theming, component SCSS, shared utilities, FullCalendar-specific styling, native controls, and Material controls coexist during the migration.

**Verification**: Frontend architecture documentation gives later migration issues explicit conventions for styling responsibilities, coexistence, standalone imports, icons, typography, density, and supported customization APIs.

### Implementation for Technical Outcome 2

- [X] T006 [TO2] Document Angular Material as the authenticated administration UI foundation in `docs/ARCHITECTURE.md`
- [X] T007 [TO2] Document Material theming, component SCSS, shared utilities, and FullCalendar-specific styling responsibilities in `docs/ARCHITECTURE.md`
- [X] T008 [TO2] Document temporary coexistence rules for native controls and Material controls in `docs/ARCHITECTURE.md`
- [X] T009 [TO2] Document standalone import, icon, typography, density, and supported customization API conventions in `docs/ARCHITECTURE.md`
- [X] T010 [P] [TO2] Update frontend-local summary and structure guidance for the Material foundation in `frontend/README.md`

**Checkpoint**: Later migration issues can follow `docs/ARCHITECTURE.md` and `frontend/README.md` without re-deciding #177 boundaries.

---

## Phase 4: Technical Outcome 3 - Enforce Foundation Scope (Priority: P3)

**Goal**: The foundation scope stays limited to setup and conventions, leaving complete page, form, table, shell, and feature migrations for later issues.

**Verification**: Review confirms no complete page migration, no FullCalendar replacement, no #126 dark-mode preference implementation, and no separate design-system package.

### Implementation for Technical Outcome 3

- [X] T011 [TO3] Review `frontend/src/app/` changes and remove any complete page, form, table, shell, or feature migration not required for the foundation
- [X] T012 [TO3] Review `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.ts` and `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss` to confirm FullCalendar is not replaced
- [X] T013 [TO3] Review `frontend/src/styles.scss` and `frontend/src/app/` to confirm #126 dark-mode preference behavior is not implemented
- [X] T014 [TO3] Review `frontend/src/app/shared/`, `frontend/src/app/layout/`, and `frontend/package.json` to confirm no separate design-system package or parallel global component system is introduced

**Checkpoint**: The implementation remains a focused #177 foundation PR.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Run required validation and record any limits before implementation is considered complete.

- [X] T015 Run frontend format validation with `npm run format:check` from `frontend/`
- [X] T016 Run frontend CI tests with `npm run test:ci` from `frontend/`
- [X] T017 Run production frontend build with `npm run build` from `frontend/`
- [X] T018 Validate completed implementation against `specs/001-angular-material-foundation/quickstart.md`
- [X] T019 Run final constitution compliance review against `specs/001-angular-material-foundation/plan.md` and `.specify/memory/constitution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before TO1 implementation because theme setup depends on Material/CDK availability.
- **TO1 (Phase 2)**: Depends on Setup.
- **TO2 (Phase 3)**: Can start after the approved plan exists, but should be finalized after TO1 details are known.
- **TO3 (Phase 4)**: Depends on implementation changes from TO1 and any documentation updates from TO2.
- **Polish (Phase 5)**: Depends on TO1, TO2, and TO3 being complete.

### Technical Outcome Dependencies

- **TO1 (P1)**: Depends on T001 dependency setup.
- **TO2 (P2)**: Depends on the approved architecture assessment and should reflect the final TO1 implementation choices.
- **TO3 (P3)**: Depends on TO1 and TO2 so the scope review can inspect all implemented changes.

### Within Each Technical Outcome

- Complete dependency and theme setup before validation.
- Complete documentation updates before final scope review.
- Run validation only after implementation and documentation tasks are complete.
- Stop at any checkpoint if the implementation drifts into out-of-scope page migration or unsupported customization.

### Parallel Opportunities

- T005 can run in parallel with T002-T004 because it inspects separate app configuration/routing files.
- T010 can run in parallel with T006-T009 because it edits `frontend/README.md` while the others edit `docs/ARCHITECTURE.md`.
- T012, T013, and T014 can run in parallel after TO1 and TO2 are complete because they inspect distinct scope boundaries.
- T015, T016, and T017 should usually run after all implementation tasks, but failures can be investigated independently once command output is available.

---

## Parallel Example: Technical Outcome 1

```bash
Task: "Configure the CatWorld application-wide Angular Material theme in frontend/src/styles.scss"
Task: "Inspect frontend/src/app/app.routes.ts and frontend/src/app/app.config.ts to confirm no route, authorization, provider, or product workflow changes are required for the foundation"
```

---

## Parallel Example: Technical Outcome 2

```bash
Task: "Document Angular Material foundation and migration boundaries in docs/ARCHITECTURE.md"
Task: "Update frontend-local summary and structure guidance in frontend/README.md"
```

---

## Parallel Example: Technical Outcome 3

```bash
Task: "Review FullCalendar files to confirm FullCalendar is not replaced"
Task: "Review styles and app files to confirm #126 dark-mode preference behavior is not implemented"
Task: "Review shared/layout/package structure to confirm no separate design-system package is introduced"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 Setup.
2. Complete Phase 2 TO1.
3. Stop and verify Angular Material/CDK are installed, the CatWorld Material theme is available, and product behavior is not intentionally changed.

### Incremental Delivery

1. Add Material/CDK dependency foundation.
2. Add the global CatWorld Material theme and coexistence-preserving style setup.
3. Document migration boundaries and conventions.
4. Review out-of-scope boundaries.
5. Run frontend validation and quickstart checks.

### MVP Scope

The MVP is Phase 1 plus Phase 2: compatible Material/CDK dependencies and a supported CatWorld Material theme with no product behavior change. Phases 3-5 are still required before #177 is complete because documentation, scope review, and validation are explicit issue requirements.

---

## Notes

- Do not commit unless the user explicitly asks for a commit.
- Do not migrate complete pages, forms, tables, shell, or feature pages in this feature.
- Do not implement #126 dark-mode preference.
- Do not replace FullCalendar.
- Do not create a separate design-system package.
- Keep Material customization inside supported public Material theming APIs and public component APIs.
