# Research: Clear Visible Errors on Language Change

## Decision 1: Treat existing writable error signals as the complete clearing boundary

**Decision**: Migrate the 32 `string | null` error signals owned by the 15 routed error-rendering pages. Do not change the dashboard, authentication interceptor, `UiStateComponent`, templates, styles, translation catalogs, API services, or backend.

**Rationale**: Repository inspection found that every current visible page, operation, and field error is rendered from one of these signals. The dashboard has no error state, the interceptor redirects without owning visible text, and `UiStateComponent` is deliberately presentation-only. This boundary clears both shared-state and local account-page markup without widening scope.

**Alternatives considered**:

- Change only `UiStateComponent`: rejected because Material field errors and account-page alerts do not all use it, and a child presentation component cannot clear its parent's state reliably.
- Hide errors globally with CSS or root markup: rejected because it cannot distinguish a newly triggered error from a stale one and would couple behavior to presentation structure.
- Reload or recreate routed pages: rejected because the issue requires preserving form values and page state.

## Decision 2: Use a language-linked writable signal through the existing i18n service

**Decision**: Add a narrow `I18nService` factory returning `WritableSignal<string | null>` backed by Angular's public `linkedSignal` API. Its linked computation reads only `language` and returns `null`. Replace each ordinary error signal declaration with a factory call while retaining every existing setter and reader.

**Rationale**: The installed Angular 21.2 type definitions expose `linkedSignal` as a public writable signal initialized and reset by a reactive computation. It preserves the existing `set` API, resets only when the distinct language signal changes, and avoids lifecycle registration. Its initial computation completes before constructor-triggered synchronous load errors are set, avoiding the initial-run erasure risk of a naive `effect`.

**Alternatives considered**:

- Add an `effect` to every page: rejected because effects run initially, require explicit previous-language guards, duplicate behavior across 15 pages, and increase scheduling/race risk.
- Add a custom event bus or callback registry: rejected because registration cleanup, missed channels, and indirect mutation add shared infrastructure without a confirmed need.
- Reset forms or their Angular control state: rejected because all visible Material field messages already come from owned error signals, and control resets could alter dirty/touched/submitted state beyond the requested error lifetime.
- Store translation keys and translate errors in place: rejected because the issue explicitly excludes translating existing errors in place and some backend-provided strings have no frontend translation key.

## Decision 3: Preserve existing error generation and backend-text boundaries

**Decision**: Leave every submit, retry, API mapping, and translation lookup unchanged. After a reset, a later failure sets the same signal using the then-current frontend translations. Raw backend strings are cleared but remain raw if returned again.

**Rationale**: Frontend-owned validation, load fallback, and status-mapped messages already read `text()` when the error is generated, so retriggering after a switch naturally selects the new language. Translating backend strings would require backend or contract work that issue #122 explicitly excludes.

**Alternatives considered**:

- Cache and retranslate the previous error: rejected as directly out of scope.
- Map all backend strings into new frontend keys: rejected because it changes existing error semantics and shared contracts beyond the issue.

## Decision 4: Validate the common primitive and every current owner

**Decision**: Add focused factory tests, an error-clearing assertion to every affected page spec, and representative DOM/state/retrigger/no-side-effect tests. Finish with the full frontend test, format, and production build gates.

**Rationale**: Factory tests prove the reactive primitive, while page coverage proves no current error channel was omitted. Representative behavior tests prove user-visible disappearance and preservation without duplicating the same large scenario in every page.

**Alternatives considered**:

- Test only the factory: rejected because it would not detect a page left on an ordinary signal.
- Add an E2E framework: rejected because the repository has no E2E suite and a new framework is disproportionate for this focused issue.
