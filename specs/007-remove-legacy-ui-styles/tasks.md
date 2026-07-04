# Tasks: Remove Legacy UI Styles

**Input**: Design documents from `/specs/007-remove-legacy-ui-styles/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Evidence tasks are required because issue #183, the specification, and the semantic-equivalence review require frontend regression, source audit, keyboard validation, and target viewport smoke checks.

**Organization**: Tasks are grouped by verifiable technical outcome.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Trace]**: Which technical outcome this task belongs to (TO1, TO2, TO3, TO4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend source and tests**: `frontend/src/`
- **Architecture documentation**: `docs/ARCHITECTURE.md`
- **Feature artifacts**: `specs/007-remove-legacy-ui-styles/`

## Architecture and Technology Assessment Gate

Plan inspection result: `Assessment required: No`. The feature relies on the already approved Angular Material foundation and does not introduce a new framework, dependency, shared infrastructure, persistence strategy, security model, shared contract, or costly architectural pattern.

## Validation Evidence Rules

- Source audit and diff review must prove the legacy global native-control styling system no longer affects migrated authenticated administration surfaces.
- Retained native controls or control-like links must have documented reasons.
- Material theme setup, document defaults, layout, responsive composition, CatWorld presentation, and FullCalendar integration styles must remain intact.
- Validation evidence is complete only when it passes after the latest relevant frontend or documentation changes.

---

## Phase 1: Foundational Audit

**Purpose**: Identify the exact cleanup and documentation surface before editing shared styles.

- [X] T001 Audit `frontend/src/styles.scss`, `frontend/src/app/**/*.html`, `frontend/src/app/**/*.scss`, and `docs/ARCHITECTURE.md` for legacy native button, input, select, textarea, table, checkbox, and control-like link styling or retained controls covered by issue #183
- [X] T002 Review `specs/007-remove-legacy-ui-styles/contracts/ui-style-contract.md` against the audit findings and note whether retained native-control documentation is needed in `docs/ARCHITECTURE.md`

**Checkpoint**: Audit findings are known before shared stylesheet edits begin

---

## Phase 2: Technical Outcome 1 - Remove Superseded Native UI Styling

**Goal**: CatWorld no longer maintains a parallel native component styling system for controls and tables replaced by Angular Material.

**Verification**: Source audit shows no undocumented native controls or legacy native-control/table component-system styles remain in authenticated migrated surfaces.

### Evidence for Technical Outcome 1

- [X] T003 [TO1] Run a source audit with `rg` over `frontend/src/styles.scss` and `frontend/src/app` for native `button`, `input`, `select`, `textarea`, `table`, `.action`, and control-like link usage that is not Angular Material or documented retention
- [X] T004 [TO1] Review the final diff of `frontend/src/styles.scss` and affected `frontend/src/app/**/*.scss` files to verify removed selectors only supported superseded native UI infrastructure

### Implementation for Technical Outcome 1

- [X] T005 [TO1] Remove superseded global native button, input, select, textarea, and legacy checkbox component-system selectors from `frontend/src/styles.scss` while preserving document defaults and Material theme setup
- [X] T006 [P] [TO1] Remove or narrow component-level legacy native-control or native-table styles identified by T001 in affected files under `frontend/src/app`
- [X] T007 [TO1] Replace, narrow, or document any remaining authenticated native controls or control-like links found in affected files under `frontend/src/app` and `docs/ARCHITECTURE.md`

**Checkpoint**: Technical Outcome 1 is objectively verifiable by source audit and diff review

---

## Phase 3: Technical Outcome 2 - Preserve Approved Styling Responsibilities

**Goal**: Removing legacy CSS preserves Material theming, document defaults, layout, responsive composition, CatWorld presentation, and FullCalendar integration.

**Verification**: Source review and smoke checks show approved style responsibilities still exist and are not replaced by a new native component system.

### Evidence for Technical Outcome 2

- [X] T008 [TO2] Review `frontend/src/styles.scss` after cleanup to confirm Material theme setup, design tokens, document defaults, shared utility classes, and responsive defaults remain
- [X] T009 [TO2] Review `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.scss` after cleanup to confirm FullCalendar integration styles remain explicit and separate from Material customization
- [X] T010 [TO2] Review `frontend/src/app/app.routes.ts`, `frontend/src/app/core/i18n/translations/*.ts`, and affected `frontend/src/app/**/*.html` files to confirm routes, localized copy, and role-sensitive visibility were not changed by the cleanup

### Implementation for Technical Outcome 2

- [X] T011 [TO2] Restore or adjust only approved non-component-system styles in `frontend/src/styles.scss` or affected files under `frontend/src/app` if T008, T009, or T010 finds an unintended preservation regression

**Checkpoint**: Technical Outcome 2 is objectively verifiable by source review and later browser smoke checks

---

## Phase 4: Technical Outcome 3 - Update Architecture Source of Truth

**Goal**: `docs/ARCHITECTURE.md` describes Angular Material as the default UI foundation and records customization and retained-native-control boundaries.

**Verification**: Documentation no longer describes temporary native-control coexistence as an active migration state and records any retained native controls with reasons.

### Evidence for Technical Outcome 3

- [X] T012 [TO3] Review `docs/ARCHITECTURE.md` after editing to confirm it names Angular Material as the default UI foundation and removes obsolete temporary coexistence language
- [X] T013 [TO3] Review `docs/ARCHITECTURE.md` against `specs/007-remove-legacy-ui-styles/contracts/ui-style-contract.md` to confirm custom styling boundaries and retained-native-control reasons are documented

### Implementation for Technical Outcome 3

- [X] T014 [TO3] Update `docs/ARCHITECTURE.md` and `frontend/README.md` to describe completed Material defaults, approved custom styling boundaries, and intentionally retained native controls or integration controls with reasons

**Checkpoint**: Technical Outcome 3 is objectively verifiable by documentation review

---

## Phase 5: Technical Outcome 4 - Validate Migrated Frontend

**Goal**: The migrated frontend passes required automated validation and manual keyboard/viewport checks after the latest relevant changes.

**Verification**: Required commands pass and manual smoke checks are recorded with explicit status.

### Evidence for Technical Outcome 4

- [X] T015 [TO4] Run `npm run format:check` from `frontend/package.json` after the latest relevant file changes
- [X] T016 [TO4] Run `npm run test:ci` from `frontend/package.json` after the latest relevant frontend changes
- [X] T017 [TO4] Run `npm run build` from `frontend/package.json` after the latest relevant frontend changes
- [X] T018 [TO4] Perform manual keyboard validation using `specs/007-remove-legacy-ui-styles/quickstart.md` and record pass/fail/partial status in final validation notes
- [X] T019 [TO4] Perform target-iPhone and small-laptop smoke tests using `specs/007-remove-legacy-ui-styles/quickstart.md` and record pass/fail/partial status in final validation notes

**Checkpoint**: Technical Outcome 4 is objectively verifiable by command results and manual validation notes

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final scope and freshness checks required by the CatWorld workflow.

- [X] T020 Review `git diff --name-only` against `specs/007-remove-legacy-ui-styles/plan.md` source map and justify or remove any unplanned touched surface
- [X] T021 Re-run or explicitly mark stale/not-revalidated any validation affected by late changes to `frontend/src`, `docs/ARCHITECTURE.md`, or `specs/007-remove-legacy-ui-styles`
- [X] T022 If `AGENTS.md` changed only because of a Spec Kit active-plan pointer, restore the `AGENTS.md` pointer block to the `main` version before final reporting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational Audit (Phase 1)**: No dependencies; must complete before cleanup edits.
- **Technical Outcome 1 (Phase 2)**: Depends on Phase 1 audit findings.
- **Technical Outcome 2 (Phase 3)**: Depends on TO1 cleanup changes for final preservation review.
- **Technical Outcome 3 (Phase 4)**: Depends on Phase 1 audit findings and TO1 retained-control decisions.
- **Technical Outcome 4 (Phase 5)**: Depends on TO1, TO2, and TO3 being implemented.
- **Polish (Phase 6)**: Depends on all technical outcomes.

### Technical Outcome Dependencies

- **TO1**: Depends on Phase 1 audit.
- **TO2**: Depends on TO1 cleanup so preservation can be reviewed against final styles.
- **TO3**: Depends on Phase 1 audit and TO1 retained-control decisions.
- **TO4**: Depends on TO1, TO2, and TO3.

### Within Each Technical Outcome

- Complete source audit/review evidence before treating implementation tasks as done.
- Complete implementation before final validation commands and manual smoke checks.
- Rerun affected validation after late frontend or documentation changes.

### Parallel Opportunities

- T006 can run in parallel with T005 after T001 when affected component files are independent of `frontend/src/styles.scss`.
- T008 and T009 can run in parallel after TO1 cleanup.
- T012 and T013 can run in parallel after T014.
- T015, T016, and T017 can run independently after all relevant frontend changes are complete.

---

## Parallel Example: Technical Outcome 1

```bash
Task: "Remove superseded global native-control selectors from frontend/src/styles.scss"
Task: "Remove or narrow component-level legacy styles in affected frontend/src/app files"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete Phase 1 audit.
2. Complete Phase 2 cleanup.
3. Verify TO1 with source audit and diff review.

### Incremental Delivery

1. Remove superseded native UI styling and verify the boundary.
2. Preserve approved styling responsibilities and review affected surfaces.
3. Update architecture documentation from migration coexistence to completed Material defaults.
4. Run automated and manual validation.

### Parallel Team Strategy

After the foundational audit, one worker can edit global styles while another reviews component-level styles, then documentation and validation proceed after cleanup decisions are known.

---

## Notes

- Do not change backend, persistence, migrations, routes, authorization, translations, or product behavior for this issue.
- Do not commit, push, open a pull request, or update GitHub issues unless explicitly instructed.
