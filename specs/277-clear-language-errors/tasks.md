# Tasks: Clear Visible Errors on Language Change

**Input**: Design documents from `/specs/277-clear-language-errors/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-error-lifetime.md, quickstart.md

**Tests**: Required by the visible-behavior specification, state matrix, validation evidence plan, and semantic-equivalence review.

**Organization**: Tasks are grouped by the three user stories. The shared language-linked error primitive is a blocking prerequisite because every story depends on the same writable-signal semantics.

## Format: `[ID] [P?] [Trace] Description`

- **[P]**: Can run in parallel with other marked tasks after its prerequisites because it touches different files
- **[Trace]**: Maps the task to US1, US2, or US3
- Every task names the exact source, test, artifact, or validation path it affects

## Phase 2: Foundational - Language-Scoped Error Primitive

**Purpose**: Provide the common writable error signal that every affected page can adopt without changing its existing setter/read API.

- [X] T001 Add an error-signal factory backed by Angular `linkedSignal` and dependent only on `I18nService.language` in `frontend/src/app/core/i18n/i18n.service.ts`
- [X] T002 Add semantic-equivalence tests for initial state, writable updates, same-language stability, distinct-language clearing, independent channels, and post-clear reuse in `frontend/src/app/core/i18n/i18n.service.spec.ts`

**Checkpoint**: The common primitive clears only error state on an actual language change and remains an ordinary writable signal to callers.

---

## Phase 3: User Story 1 - Clear Stale-Language Errors (Priority: P1)

**Goal**: Every current routed page clears all of its visible page, operation, and field errors when the application language changes.

**Verification**: Populate every owned error channel for each affected page, render its visible error surface, change `I18nService.language`, and verify that all error DOM is absent while no language-triggered operation occurs.

### Implementation for User Story 1

- [X] T003 [P] [US1] Migrate every auth, account, and calendar error declaration to the i18n error-signal factory in `frontend/src/app/features/auth/pages/login-page/login-page.ts`, `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.ts`, and `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.ts`
- [X] T004 [P] [US1] Migrate every cat create, edit, and overview error declaration to the i18n error-signal factory in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.ts`, `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.ts`, and `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.ts`
- [X] T005 [P] [US1] Migrate every owner create, edit, and overview error declaration to the i18n error-signal factory in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.ts`, `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.ts`, and `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.ts`
- [X] T006 [P] [US1] Migrate every stay create, edit, and overview error declaration to the i18n error-signal factory in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.ts`, `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.ts`, and `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.ts`
- [X] T007 [P] [US1] Migrate every vet create, edit, and overview error declaration to the i18n error-signal factory in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.ts`, `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.ts`, and `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.ts`

### Evidence for User Story 1

- [X] T008 [P] [US1] Add DOM-backed clearing coverage for all auth, account, and calendar error channels, including simultaneous account errors, in `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`, `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.spec.ts`, and `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.spec.ts`
- [X] T009 [P] [US1] Add DOM-backed clearing coverage for all cat create, edit, and overview error channels in `frontend/src/app/features/cats/pages/cat-create-page/cat-create-page.spec.ts`, `frontend/src/app/features/cats/pages/cat-edit-page/cat-edit-page.spec.ts`, and `frontend/src/app/features/cats/pages/cats-overview-page/cats-overview-page.spec.ts`
- [X] T010 [P] [US1] Add DOM-backed clearing coverage for all owner create, edit, and overview error channels in `frontend/src/app/features/owners/pages/owner-create-page/owner-create-page.spec.ts`, `frontend/src/app/features/owners/pages/owner-edit-page/owner-edit-page.spec.ts`, and `frontend/src/app/features/owners/pages/owners-overview-page/owners-overview-page.spec.ts`
- [X] T011 [P] [US1] Add DOM-backed clearing coverage for all stay create, edit, and overview error channels in `frontend/src/app/features/stays/pages/stay-create-page/stay-create-page.spec.ts`, `frontend/src/app/features/stays/pages/stay-edit-page/stay-edit-page.spec.ts`, and `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.spec.ts`
- [X] T012 [P] [US1] Add DOM-backed clearing coverage for all vet create, edit, and overview error channels in `frontend/src/app/features/vets/pages/vet-create-page/vet-create-page.spec.ts`, `frontend/src/app/features/vets/pages/vet-edit-page/vet-edit-page.spec.ts`, and `frontend/src/app/features/vets/pages/vets-overview-page/vets-overview-page.spec.ts`
- [X] T013 [US1] Run the focused i18n and affected-page test command documented in `specs/277-clear-language-errors/quickstart.md` and resolve any omitted-channel or visible-DOM failure

**Checkpoint**: All 15 routed error-owning pages clear their 32 current error channels, including field errors and both account channels.

---

## Phase 4: User Story 2 - Show Retriggered Errors in the Selected Language (Priority: P2)

**Goal**: After clearing, later frontend-owned validation and operation failures can repopulate the same channel using the newly selected language.

**Verification**: Trigger a localized error, switch language and observe its removal, repeat the same invalid or failing action, and verify the newly rendered message uses the selected language; correcting the condition keeps it absent.

### Evidence for User Story 2

- [X] T014 [P] [US2] Add a rendered login-form scenario that clears multiple Spanish validation errors, resubmits unchanged values, and renders the new English validation message in `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`
- [X] T015 [P] [US2] Add an account action-error scenario that clears a localized error, preserves the invalid condition, retriggers it in the selected language, and distinguishes raw-backend clearing from frontend localization in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.spec.ts`
- [X] T016 [US2] Run the retrigger-focused specs and verify corrected conditions do not resurrect cleared messages using the commands in `specs/277-clear-language-errors/quickstart.md`

**Checkpoint**: Cleared channels remain reusable and frontend-localized errors are generated from the active language rather than translated in place.

---

## Phase 5: User Story 3 - Preserve In-Progress Page State (Priority: P3)

**Goal**: Language switching changes only error lifetime and does not reset forms, routes, page controls, loaded data, or active work.

**Verification**: Establish representative form and stateful-page values alongside visible errors, switch language, and verify only errors clear while state and API/router call counts remain unchanged.

### Evidence for User Story 3

- [X] T017 [P] [US3] Extend the login scenario to assert username/password values, control interaction state, API call count, and router navigation remain unchanged by the language switch in `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`
- [X] T018 [P] [US3] Verify accounts, role selections, create-form values, pending state, and API/router call counts survive clearing both account errors in `frontend/src/app/features/accounts/pages/account-management-page/account-management-page.spec.ts`
- [X] T019 [P] [US3] Verify calendar display mode, visible date/event state, and request count survive clearing its load error in `frontend/src/app/features/calendar/pages/calendar-page/calendar-page.spec.ts`
- [X] T020 [P] [US3] Verify stay overview search/status filters, loaded rows, pending operation state, and request count survive clearing its error in `frontend/src/app/features/stays/pages/stays-overview-page/stays-overview-page.spec.ts`
- [X] T021 [US3] Run the state-preservation specs and cover the validation-matrix rows for visible client validation, visible operation rejection, no-error language changes, correction, API-call behavior, and preserved values using `specs/277-clear-language-errors/quickstart.md`

**Checkpoint**: Language switching is isolated to error channels and produces no implicit submission, retry, request, navigation, reload, or state reset.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Prove the completed feature against repository gates, semantic-equivalence boundaries, freshness requirements, and the approved source map.

- [X] T022 Run `npm run format:check` from `frontend/` and record the fresh result against `specs/277-clear-language-errors/quickstart.md`
- [X] T023 Run the complete `npm run test:ci` suite from `frontend/` and record the fresh result against `specs/277-clear-language-errors/quickstart.md`
- [X] T024 Run the production `npm run build` from `frontend/` and record the fresh result against `specs/277-clear-language-errors/quickstart.md`
- [X] T025 Perform the replacement-boundary review with `rg` over `frontend/src/app/` to confirm no inventory-listed visible error declaration still uses an ordinary signal and no template, style, route, translation, API, or backend workaround was introduced; compare findings with `specs/277-clear-language-errors/plan.md`
- [X] T026 Perform the representative browser smoke scenario in `specs/277-clear-language-errors/quickstart.md` when existing local application prerequisites are available, otherwise record it explicitly as skipped rather than passed
- [X] T027 Review `git status --short` and `git diff --name-only` against the source map in `specs/277-clear-language-errors/plan.md`, justify or remove unplanned surfaces, and rerun any validation affected by later changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Starts immediately and blocks all story implementation.
- **User Story 1 (Phase 3)**: Depends on T001-T002 and provides the shared clearing behavior.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because retrigger evidence starts from a completed language-change reset.
- **User Story 3 (Phase 5)**: Depends on User Story 1; it may be developed alongside User Story 2 where test-file ownership does not overlap.
- **Polish (Phase 6)**: Depends on all three stories and must be fresh after the last relevant change.

### User Story Dependencies

- **US1 (P1)**: Foundational primitive only; first verifiable increment.
- **US2 (P2)**: US1 clearing behavior; no new production mechanism.
- **US3 (P3)**: US1 clearing behavior; no dependency on US2's localized retrigger evidence.

### Within Each User Story

- Migrate the owning production declarations before relying on the new behavior in their tests.
- DOM evidence supplements signal assertions for visible behavior.
- A focused test checkpoint follows each story.
- Full test, format, and build validation occurs only after all planned behavior and evidence changes are complete.

### Parallel Opportunities

- After T001-T002, T003-T007 can run in parallel by feature area.
- T008-T012 can run in parallel after their corresponding production migration because their file groups do not overlap.
- T014 and T015 can run in parallel.
- T017-T020 can run in parallel after earlier edits to the same spec files are integrated.
- US2 and the non-overlapping portions of US3 can proceed in parallel after US1.

---

## Parallel Example: User Story 1

```text
Task: "Migrate and test auth/account/calendar error channels in frontend/src/app/features/{auth,accounts,calendar}/pages/"
Task: "Migrate and test cat error channels in frontend/src/app/features/cats/pages/"
Task: "Migrate and test owner error channels in frontend/src/app/features/owners/pages/"
Task: "Migrate and test stay error channels in frontend/src/app/features/stays/pages/"
Task: "Migrate and test vet error channels in frontend/src/app/features/vets/pages/"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Implement and test the language-scoped writable error signal.
2. Migrate all inventory-listed page error channels.
3. Add per-page DOM clearing coverage.
4. Run the focused US1 test set and stop if any page retains visible error text.

### Incremental Delivery

1. Complete US1 for comprehensive stale-error removal.
2. Add US2 retrigger evidence without changing existing error-generation semantics.
3. Add US3 state-preservation and no-side-effect evidence.
4. Run the fresh full repository frontend gate and scope review.

### Parallel Team Strategy

1. Complete T001-T002 centrally.
2. Split T003-T012 by feature-area file group.
3. Integrate those non-overlapping changes before assigning US2/US3 tests that revisit login, account, calendar, or stay specs.
4. Run focused and complete validation from one integrated working tree.

---

## Notes

- Raw backend error strings participate in clearing but are not expected to become translated on retrigger.
- Future error channels are outside the current inventory but should use the same factory when they must follow the UI contract.
- No task introduces backend changes, translation copy, templates, styles, routing, form resets, an event bus, or a new dependency.
- Validation is complete only when evidence is fresh after the final relevant change.
