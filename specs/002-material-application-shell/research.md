# Research: Material Application Shell

## Decision: Reuse The #177 Angular Material Foundation

**Rationale**: `frontend/package.json`, `frontend/src/styles.scss`, `docs/ARCHITECTURE.md`, and `frontend/README.md` already show Angular Material/CDK 21.2.x and the CatWorld Material theme are present. Issue #178 says to add Material/CDK/animations/theme only if #177 has not already done so, so this implementation must consume the existing foundation.

**Alternatives considered**:

- Add a second foundation or theme: rejected because it would duplicate #177 and conflict with #178 boundaries.
- Continue handcrafted shell controls: rejected because #178 explicitly requires Material shell primitives.

## Decision: Keep The Shell In The Root App Component

**Rationale**: `frontend/src/app/app.html`, `frontend/src/app/app.scss`, and `frontend/src/app/app.ts` already own authenticated navigation, brand, language switching, logout, and the `router-outlet`. Migrating this component in place preserves route behavior and avoids a new shell library.

**Alternatives considered**:

- Introduce a separate layout shell package: rejected because #178 forbids duplicate global design systems and parallel shell component libraries.
- Move shell behavior into feature pages: rejected because navigation is cross-cutting and already centralized in the root app.

## Decision: Add Narrow Shared UI State Presentation

**Rationale**: Loading, empty, and error markup is repeated across overview and edit/create surfaces. A small shared component under `frontend/src/app/shared/` can provide Material-compatible state presentation while leaving data fetching, route behavior, and page-specific workflows unchanged.

**Alternatives considered**:

- Keep repeated plain paragraphs and local `.error-message` blocks: rejected because #178 requires reusable shared states to follow the Material theme.
- Create a broad component library: rejected because it would exceed scope and create the parallel component system #178 excludes.

## Decision: Preserve Existing Routes, Guards, API Calls, And I18n Source

**Rationale**: The issue requires all existing routes, guards, API calls, translations, and domain workflows to remain intact. Any new shell accessibility labels or tooltips must be added through `app-shell.translations.ts` rather than hard-coded user-facing copy.

**Alternatives considered**:

- Add new route structure for mobile navigation: rejected because #178 forbids navigation information architecture redesign and new product routes.
- Hard-code labels for Material icon controls: rejected because repository instructions require the existing internationalization system for user-facing application copy.
