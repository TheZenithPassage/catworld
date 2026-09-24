# Tasks: Safe Login Navigation Transition

## Phase 1: Setup

**Purpose**: Confirm the current feature context and affected frontend boundaries.

- [X] T001 Review the approved state contract and validation guide in `specs/001-login-navigation-state/contracts/ui-contract.md` and `specs/001-login-navigation-state/quickstart.md`

---

## Phase 2: Foundational

**Purpose**: Add the shared localized copy needed by the pending-navigation presentation.

- [X] T002 Add complete English and Spanish post-authentication navigation-loading copy in `frontend/src/app/core/i18n/translations/auth.translations.ts`

**Checkpoint**: The typed translation contract exposes equivalent loading feedback in both supported languages.

---

## Phase 3: User Story 1 — Remain in the public shell during post-login navigation (P1)

**Goal**: Keep `/login` in the public shell, show accessible loading after authentication, and prevent duplicate authentication while routing is pending.

**Independent Verification**: Hold eager and lazy authenticated navigation pending after valid credentials and observe the public shell, shared localized loading state, and exactly one authentication request; complete navigation and observe the authenticated shell only at the destination.

- [X] T003 [US1] Extend completed-route awareness and derive login-flow shell visibility in `frontend/src/app/app.ts`
- [X] T004 [US1] Gate authenticated toolbar and public main layout on both session and active login flow in `frontend/src/app/app.html`
- [X] T005 [P] [US1] Preserve the submitting state through destination navigation and ignore duplicate submit attempts in `frontend/src/app/features/auth/pages/login-page/login-page.ts`
- [X] T006 [US1] Render `UiStateComponent` localized loading feedback instead of the credential form during post-authentication navigation in `frontend/src/app/features/auth/pages/login-page/login-page.html`
- [X] T007 [US1] Add focused routed shell and login pending/completion/duplicate-request coverage in `frontend/src/app/app.spec.ts` and `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`

**Checkpoint**: User Story 1 is independently observable for normal and lazy destinations without exposing authenticated shell content on `/login`.

---

## Phase 4: User Story 2 — Recover from unsuccessful destination navigation (P1)

**Goal**: Clear authentication and restore a retryable localized login state when navigation rejects, resolves false, is cancelled, or otherwise does not leave login.

**Independent Verification**: Exercise unsuccessful navigation outcomes and observe logout, non-loading usable form, generic localized failure feedback, and a successful subsequent retry.

- [X] T008 [US2] Handle rejected, false, cancelled, and still-on-login navigation outcomes through existing logout and localized recovery behavior in `frontend/src/app/features/auth/pages/login-page/login-page.ts`
- [X] T009 [US2] Add focused unsuccessful-navigation recovery and retry coverage in `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts`

**Checkpoint**: Every specified unsuccessful navigation outcome returns CatWorld to a logged-out, retryable public login flow without raw error details.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Keep source-of-truth documentation current and collect fresh full-scope validation.

- [X] T010 Document the implemented route-aware authentication-shell transition in `docs/ARCHITECTURE.md`
- [X] T011 Run `npm test -- --watch=false`, `npm run build`, and `npm run format:check` from `frontend/` after the latest relevant changes
- [ ] T012 Perform and record the normal/throttled eager/lazy, English/Spanish, narrow/wide manual scenarios from `specs/001-login-navigation-state/quickstart.md`
- [X] T013 Review the complete branch diff against `specs/001-login-navigation-state/spec.md`, confirm only authorized focused test coverage remains, and verify `.specify/memory/constitution.md` is absent from the diff

---

## Dependencies & Execution Order

- T001 precedes implementation.
- T002 precedes T006 and the localized assertions in T007/T009.
- T003 and T004 establish the root-shell boundary; T005 and T006 establish the pending login surface. They converge in T007.
- User Story 2 depends on the pending navigation lifecycle introduced for User Story 1, so T008-T009 follow T005-T007.
- T010 follows stable implementation. T011-T013 follow every relevant code, test, translation, and documentation change.

## Parallel Opportunities

- After T002, T003-T004 (root shell) and T005 (login lifecycle) affect separate source files and can be developed independently before T006-T007 integrate their behavior.
- T010 can be drafted after behavior stabilizes while focused test work is being completed, but final validation must run after both.

## Implementation Strategy

1. Complete T001-T002.
2. Deliver the first verifiable increment with T003-T007: public shell and accessible pending state until successful navigation completes.
3. Add bounded recovery with T008-T009.
4. Update architecture and run all fresh automated/manual validation through T010-T013.

All tasks use the required checklist format. Total tasks: 13; User Story 1: 5; User Story 2: 2; setup/foundational/polish: 6.
