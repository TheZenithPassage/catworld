# Implementation Plan: Clear Visible Errors on Language Change

**Branch**: `fix/122-clear-visible-errors-language-changes` | **Date**: 2026-07-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/277-clear-language-errors/spec.md`

## Summary

Clear all frontend-owned visible error state when `I18nService.language` changes while leaving every non-error signal and active request untouched. Add a narrow error-signal factory to the existing i18n service using Angular's public writable `linkedSignal` capability, then migrate the 32 string-or-null error signals owned by the 15 routed error-rendering pages to that factory. Existing error setters and localization lookups remain responsible for generating fresh messages after later validation, retry, or operation failures.

## Technical Context

**Language/Version**: TypeScript 5.9 with Angular 21.2; CI runtime Node.js 22 and npm package manager metadata at npm 11.9

**Primary Dependencies**: Existing `@angular/core` signals API, Angular Forms, Angular Material 21.2, RxJS 7.8, Vitest 4, and jsdom 28; no new dependency

**Storage**: N/A. The existing language preference in browser local storage is unchanged; the feature introduces no domain data, API payload, browser storage, or persistence change.

**Testing**: Angular unit-test builder with Vitest/jsdom through `npm run test:ci`; production build through `npm run build`; Prettier verification through `npm run format:check`

**Target Platform**: Browser-based Angular administration application built for the repository's existing frontend deployment; CI validation on Node.js 22

**Project Type**: CatWorld full-stack web administration system with a frontend-only change

**Performance Goals**: N/A. The issue defines behavioral pass/fail outcomes and no supported latency or throughput target.

**Constraints**: Clear errors only after an actual application-language change; preserve form values, route, filters, selections, calendar state, loading/submitting/pending state, and active requests; make no API call, retry, navigation, reload, translation-catalog change, or backend change solely because language changed.

**Scale/Scope**: 15 routed frontend pages and their 32 currently identified `string | null` error channels; the dashboard and authentication interceptor own no visible error channel.

## Constitution Check

*GATE 1 result: Pass. Repository research resolved the relevant technical facts, and no material product, architecture, persistence, security, shared-contract, authorization, UX, operational, or correctness-sensitive decision remains open.*

*GATE 2 result: Pass. Phase 1 adds only a UI behavior contract and validation guide. No architecture or technology assessment requiring approval is triggered, and the post-design review below remains compliant.*

- **Domain focus and sustainable evolution**: Pass. The work is limited to CatWorld's existing administration UI and adds no platform, cross-species, multi-tenant, or speculative abstraction.
- **Layered monolith responsibilities**: Pass. No backend layer changes. Frontend pages continue to own their operation and validation errors, while the existing i18n service provides only language-scoped signal behavior.
- **Backend and database authority**: Pass. Backend validation, authorization, calculations, response semantics, and raw backend error content remain authoritative and unchanged. This feature changes only when already-rendered frontend error text remains visible.
- **Schema evolution**: N/A. No schema or persistence change.
- **Protected stay model**: Pass. Stay dates, cancellation, participating cats, overlap rules, and every stay operation remain unchanged.
- **Specification and planning discipline**: Pass. The specification defines the visible clearing behavior, retrigger behavior, state-preservation matrix, edge cases, and explicit exclusions. Repository inspection identifies every current routed error surface.
- **Architecture and technology assessment**: Pass. The implementation is routine use of the existing approved Angular framework's public writable-signal API and a small error-specific method in the existing i18n service. It introduces no framework, library, shared infrastructure, replacement platform, accessibility mechanism, persistence strategy, or costly migration decision.
- **Focused changes and proportional validation**: Pass. The source change is constrained to the i18n service and existing page error declarations. Service-level semantics, each page's error inventory, representative DOM/state preservation, formatting, tests, and production build provide proportional evidence.
- **Operational safety and sources of truth**: Pass. No secrets, real data, deployment exposure, recovery procedure, or operational contract changes. The existing frontend architecture remains accurate; feature artifacts document the issue-specific behavior.

### Post-Design Constitution Re-check

Phase 1 introduces no data model, backend contract, persistence, authorization, route, styling, translation-copy, or operational change. The UI contract keeps error ownership in pages, uses the existing i18n boundary only to scope error lifetime, and explicitly prohibits state resets and implicit operations. All Gate 1 conclusions therefore remain valid after design.

## Architecture and Technology Assessment

**Assessment required**: No. Although the requested behavior spans existing pages, the implementation choice is an ordinary local use of the already-approved Angular signals capability plus a small method on the existing language service. There is no new significant shared infrastructure, dependency, framework, accessibility responsibility, persistence/contract decision, or meaningful replacement cost.

**Decision trigger**: N/A

**Options considered**:

- Existing platform/framework/project capability: Use Angular's public `linkedSignal` writable-signal behavior, scoped only to `I18nService.language`, while preserving the current signal setter API. This directly fits the confirmed requirement with low code and migration cost.
- Established library/framework/service: N/A. Adding an error-state/event library would duplicate the installed framework and introduce unjustified dependency and lifecycle complexity.
- Focused custom implementation: Component effects or a custom callback registry could clear errors, but would require initial-run/race guards or registration cleanup across every page and would be less reversible than the framework primitive.

**Selected approach**: N/A as a new architectural decision. Use the existing Angular signals framework through an error-specific factory on `I18nService`, and replace only the current error signal declarations.

**Why selected**: N/A for approval purposes. This is the smallest mechanism that clears all owned error channels on a distinct language value while retaining their existing writable-signal API and leaving unrelated page state unobserved.

**Confirmed medium-term use**: N/A beyond issue #122's current 15 routed error-owning pages.

**Maintenance and operational consequences**: N/A beyond keeping future visible page errors on the same error-signal factory when they must follow the application-wide language-change contract. No runtime service, deployment step, or dependency upgrade is added.

**Reversibility and migration path**: N/A as a significant decision. Each migrated declaration can return to a normal writable signal independently, and the factory can be removed without data or contract migration.

**Human approval**: N/A because assessment is not required. The plan does not select a significant architecture or technology direction.

## Semantic Equivalence and Replacement Review

**Review required**: Yes. Existing error-state declarations move from ordinary writable signals to language-linked writable signals; their setter semantics must remain equivalent except for the requested reset boundary.

**Old behavior/source of truth**: The 15 routed page components own 32 `signal<string | null>(null)` channels. Page methods set localized or backend-provided text when validation or operations fail and clear it during later page actions. Templates render those channels through `UiStateComponent`, Material field errors, or the account page's local alert markup. Because stored strings are snapshots, a language change does not clear them.

**New mechanism semantics**: An error-specific factory returns an Angular `WritableSignal<string | null>` whose linked computation reads only `I18nService.language` and resets to `null` when that language value actually changes. Existing `set(null)`, `set(message)`, reads, templates, and later error-generation paths remain unchanged.

**Mismatch risks**: An initial observer could erase a synchronous constructor-time load failure; tracking `text` rather than `language` could reset on unrelated recomputation; clearing non-error state could lose form/page progress; a callback/event registry could miss pages or leak registrations; field-level errors or the account page's second channel could be omitted; an in-flight response could be retried or suppressed; raw backend text could be incorrectly presented as frontend-translated.

**Mitigation**: Use `linkedSignal`, whose initial computation occurs before constructor-triggered load setters and whose only dependency is the language signal. Migrate every inventory-listed error channel, including field errors and both account errors. Do not observe or write any other component state and do not modify the language toggle, requests, router, templates, styles, translation catalogs, or backend. Preserve raw backend handling and require only clearing for those messages.

**Proof required**: Unit-test the factory's initial, set, language-reset, independent-channel, same-language, and post-reset setter behavior. In every affected page spec, prove all owned error channels clear when language changes. Add representative DOM, form-value, page-state, no-retry/no-navigation, and selected-language retrigger assertions. Run fresh full frontend tests, formatting verification, and production build; perform a representative routed browser smoke check if the local application can be exercised without changing scope.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| All 32 page-, operation-, and field-error channels clear on language change (FR-001, FR-002) | `I18nService` signal semantics plus each owning page component/DOM | Factory unit tests and all 15 affected page specs | Rerun after any service or migrated declaration change |
| Retriggered frontend-localized validation and fallback errors use the selected language (FR-005, FR-006) | Page submit/error mapping and rendered DOM | Representative login/form and operation-error tests | Use frontend translation paths; raw backend strings are clearing-only evidence |
| Form values, route, loaded records, filters, selections, calendar state, and pending work remain unchanged (FR-003, FR-008) | Owning component signals, router spies, and DOM | Representative form, overview/account, and calendar component tests; optional routed smoke | Rerun after page test or signal-declaration changes |
| Language switching causes no submit, request retry, API call, navigation, or reload (FR-004, FR-007) | Page API mocks, router mocks, and root language mechanism | Call-count/navigation assertions and source review | Rerun after i18n or root shell changes; root shell is not expected to change |
| Existing alert semantics, Material field presentation, responsive layout, focus, and keyboard behavior remain unchanged | Existing templates, `UiStateComponent`, Angular Material, and component styles | DOM tests and changed-surface review; representative manual smoke if available | No template/style/focus mechanism is planned; report manual evidence separately |
| Frontend remains buildable and formatted (TR-001) | Angular build and repository formatting configuration | `npm run build`, `npm run format:check` | Run after the final relevant source/test change |

## Project Structure

### Documentation (this feature)

```text
specs/277-clear-language-errors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-error-lifetime.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/src/app/
├── core/i18n/
│   ├── i18n.service.ts
│   └── i18n.service.spec.ts
└── features/
    ├── accounts/pages/account-management-page/
    ├── auth/pages/login-page/
    ├── calendar/pages/calendar-page/
    ├── cats/pages/{cat-create-page,cat-edit-page,cats-overview-page}/
    ├── owners/pages/{owner-create-page,owner-edit-page,owners-overview-page}/
    ├── stays/pages/{stay-create-page,stay-edit-page,stays-overview-page}/
    └── vets/pages/{vet-create-page,vet-edit-page,vets-overview-page}/
```

Each listed page directory contributes its existing component `.ts` file and matching `.spec.ts` test. No HTML, SCSS, route, translation-catalog, service API, or backend source change is planned.

**Structure Decision**: Keep language ownership and the new error-signal factory in the existing root-provided `I18nService`. Keep error creation, API mapping, validation, and all non-error state in the owning standalone page components. Do not add a callback registry, new state service, global event bus, directive, route refresh, or template-level workaround.

## Complexity Tracking

No constitution exception or additional architectural complexity is required.
