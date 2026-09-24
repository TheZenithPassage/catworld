# Implementation Plan: Safe Login Navigation Transition

**Branch**: `chore/418-avoid-authenticated-shell-during-pending-login-navigation` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

## Summary

Keep the public shell authoritative while the active route is `/login`, even after valid credentials establish an in-memory session. Extend the root Router `NavigationEnd` awareness, keep login pending until `navigateByUrl` settles, reuse `UiStateComponent` for localized Material loading feedback, block duplicate submits, and clear the session plus restore a generic localized error when navigation does not complete away from login.

## Technical Context

**Language/Version**: TypeScript 5.9.2 on Angular 21.2; HTML and SCSS

**Primary Dependencies**: Angular Router and Material/CDK 21.2, RxJS 7.8, existing CatWorld auth, i18n, and shared UI state

**Storage**: N/A — in-memory authentication only

**Testing**: Vitest via Angular CLI, production build, Prettier check, and manual routed-navigation checks

**Target Platform**: Browser-hosted Angular application; CI uses Node.js 22

**Project Type**: Full-stack monolith with an independently built Angular frontend; frontend-only change

**Performance Goals**: N/A — correctness must hold for the full duration of eager or lazy navigation

**Constraints**: Preserve HTTP Basic auth, `returnUrl`, guards, logout, public shell, and i18n; add no dependency, state framework, router abstraction, or loading component

**Scale/Scope**: One root shell, one login route, eager and lazy authenticated destinations, English and Spanish, and two focused test boundaries

## Constitution Check

- **Domain focus and sustainable evolution**: Pass. Confirmed CatWorld need; no speculative abstraction.
- **Architecture responsibilities**: Pass. Auth ownership stays in `AuthSessionService`; route state stays with Angular Router.
- **Authoritative enforcement**: Pass. Backend auth remains authoritative; this corrects frontend transition presentation and recovery.
- **Schema evolution**: N/A.
- **Protected domain invariants**: N/A.
- **Specification and planning discipline**: Pass. Pending, success, failure, cancellation, retry, localization, shell visibility, and exclusions are resolved.
- **Architecture and technology assessment**: Pass. The approved issue selects existing Router, session, Material, and localization capabilities.
- **Focused changes and proportional validation**: Pass. Changes remain at the root shell, login flow, auth translations, focused tests, and architecture documentation.
- **Operational safety and sources of truth**: Pass. No credentials/data are introduced; implemented behavior will be documented.

Post-design re-check: Pass. No new framework, infrastructure, persistence, security policy, or backend contract is introduced.

## Architecture and Technology Assessment

**Assessment required**: Yes — shell visibility and the accessible login transition are cross-cutting and correctness-sensitive, while the approved issue fixes the implementation family.

**Decision trigger**: significant cross-cutting concern; non-trivial accessibility or correctness responsibility

**Options considered**:

- Existing platform/project capability: Extend `NavigationEnd`, await `navigateByUrl`, retain `AuthSessionService`, and reuse `UiStateComponent`. Best fit and lowest risk.
- Established library/service: A state or routing library would add unnecessary lifecycle and lock-in cost.
- Focused custom implementation: A global transition store or new loading component would duplicate existing ownership.

**Selected approach**: Existing Angular and CatWorld capabilities.

**Why selected**: It implements the approved anchors with the smallest surface and preserves accessibility, localization, and route contracts.

**Confirmed medium-term use**: Current login transition for eager and lazy authenticated destinations only.

**Maintenance and operational consequences**: Preserve route/session ordering in root tests, asynchronous navigation outcomes in login tests, and complete bilingual translations. No operational dependency.

**Reversibility and migration path**: Local component changes are reversible without data migration.

**Human approval**: Approved by the explicit handoff to execute #418, whose contract mandates this approach and excludes the alternatives.

## Semantic Equivalence and Replacement Review

**Review required**: Yes, narrowly. Post-authentication button-only submitting presentation becomes shared page-level loading; shell selection changes from session-only to session-plus-route.

**Old behavior/source of truth**: `app.html` selects shell solely from `authenticated()`; `LoginPage.submit()` ends submitting before navigation; existing auth tests define validation, errors, and return URL.

**New mechanism semantics**: Public shell remains on `/login`; accepted credentials show shared loading until routing settles; unsuccessful routing logs out and restores retry with generic localized feedback.

**Mismatch risks**: Premature authenticated controls, duplicate requests, treating `false` as success, retained loading/session after rejection, changed credential/error behavior, incomplete translations, or query-parameter misclassification.

**Mitigation**: Normalize completed URLs, model promise settlement explicitly, recover via existing logout/error copy, and preserve existing validation/return URL.

**Proof selection from Validation Evidence Plan**: Focused `App` and `LoginPage` tests, full frontend suite/build, and manual eager/lazy navigation inspection.

## Validation Evidence Plan

| Distinct Behavior / Grouped Surfaces | Regression Concern and Maintenance Reason | Selected Validation | Responsible Layer | Freshness / Manual Notes |
|--------------------------------------|-------------------------------------------|---------------------|-------------------|--------------------------|
| Root shell across session/route transitions | Authenticated controls on `/login` are the core regression | Extend focused `App` tests; full frontend suite | Root shell and Router | Rerun after shell/route changes |
| Login pending, duplicate prevention, success/failure/cancellation | Regression can strand users authenticated/loading or duplicate login | Extend focused `LoginPage` tests | Login, Auth API/session, Router promise | Rerun after login/session/navigation changes |
| Accessible loading, i18n, responsive presentation | Shared semantics reduce risk; real timing and bilingual rendering still need confirmation | Focused assertions, build, directed/manual inspection | Login template, shared UI state, translations | Manual eager/lazy bilingual check after final changes |
| Existing guards, return URL, HTTP Basic, backend contracts | Must remain unchanged | Existing suite and diff inspection; no duplicate tests | Existing auth tests and review | Rerun full suite |

## Project Structure

### Documentation (this feature)

```text
specs/001-login-navigation-state/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md
```

### Source Code (repository root)

| Product Path | Responsibility / Planned Change | Validation Location or Command |
|--------------|---------------------------------|--------------------------------|
| `frontend/src/app/app.ts` | Track completed login-route state | `frontend/src/app/app.spec.ts` |
| `frontend/src/app/app.html` | Select shell/layout from session plus route | `frontend/src/app/app.spec.ts` |
| `frontend/src/app/features/auth/pages/login-page/login-page.ts` | Hold pending state and recover failed settlement | `login-page.spec.ts` |
| `frontend/src/app/features/auth/pages/login-page/login-page.html` | Render shared loading and suppress form while navigating | `login-page.spec.ts` |
| `frontend/src/app/core/i18n/translations/auth.translations.ts` | Add bilingual loading copy | Build, tests, manual inspection |
| `frontend/src/app/app.spec.ts` | Protect route-aware shell | `npm test -- --watch=false` |
| `frontend/src/app/features/auth/pages/login-page/login-page.spec.ts` | Protect async transition outcomes | `npm test -- --watch=false` |
| `docs/ARCHITECTURE.md` | Record implemented transition contract | Directed review |

**Structure Decision**: Preserve existing standalone Angular components/services. No new production file or abstraction.

## Complexity Tracking

No exceptional complexity or constitutional deviation is required.
