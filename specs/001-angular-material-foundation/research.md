# Research: Angular Material Foundation

## Decision: Use Angular Material and CDK on the Angular 21.2.x line

**Rationale**: The current frontend is on Angular 21.2.x with npm-managed dependencies. Npm package metadata checked during planning shows `@angular/material@21.2.x` peers against Angular `^21.0.0 || ^22.0.0` and requires the matching `@angular/cdk@21.2.x`. This satisfies #177's compatibility requirement without requiring an unrelated Angular upgrade.

**Alternatives considered**:

- Use the newest Material major regardless of Angular compatibility. Rejected because #177 requires compatibility with the current Angular version and no unrelated upgrade.
- Pin a lower Material major. Rejected because it would intentionally diverge from the current Angular major and create avoidable peer/version risk.
- Defer dependency selection to later migration issues. Rejected because #177 exists to establish the foundation before later migrations.

## Decision: Apply one CatWorld Material theme through public Material theming APIs

**Rationale**: #176 confirms that Angular Material is the default source for application-wide theming and that customization must use supported theming APIs and public interfaces. The existing CatWorld palette, typography feel, and rounded/soft visual identity should inform the theme, while unsupported overrides of internal Material component structure remain out of bounds.

**Alternatives considered**:

- Keep all current global CSS as the effective component system. Rejected because #176 says CatWorld must not maintain a parallel global component system for native buttons, inputs, selects, textareas, or tables after Material replacements are in place.
- Override Material internals to exactly mimic current native controls. Rejected because fragile internal overrides conflict with #176 and raise upgrade risk.
- Adopt a stock Material theme with no CatWorld identity. Rejected because #177 requires preserving CatWorld's visual identity.

## Decision: Keep styling responsibilities explicit and layered

**Rationale**: #176 confirms the boundaries: global styles are limited to Material theme setup, document/application defaults, shared utilities, and external-library integration; component SCSS remains responsible for local layout, responsive composition, and product-specific presentation; FullCalendar remains custom where Material does not provide the relevant interaction or structure.

**Alternatives considered**:

- Move all styling into global styles. Rejected because it recreates broad, competing styling infrastructure and weakens component ownership.
- Move all styling into component SCSS. Rejected because theme setup, document defaults, and shared utilities need a single application-level place.
- Force FullCalendar styling through Material theme tokens only. Rejected because FullCalendar is an external library with its own DOM and interaction model.

## Decision: Allow temporary coexistence between native and Material controls

**Rationale**: #177 explicitly asks for a coexistence strategy and forbids complete page migration in the foundation PR. Existing native controls may remain until their owning migration issue replaces them. New or migrated controls should follow Material conventions once the foundation exists.

**Alternatives considered**:

- Convert all controls in #177. Rejected because #177 excludes complete page, form, table, shell, and feature migrations.
- Keep native controls indefinitely as equal alternatives. Rejected because #176 says CatWorld must not maintain a parallel global component system after Material replacements are in place.
- Block all future frontend work until every surface is migrated. Rejected because #176 allows independent backend work and child issue sequencing.

## Decision: Use standalone Material imports at the consuming component or narrowly scoped shared component boundary

**Rationale**: The current Angular application uses standalone components and route-level composition. Standalone imports preserve local visibility and avoid creating a broad Material module that imports more components than a screen uses. Shared wrappers should be introduced only when they encode a real CatWorld pattern, not just to re-export Material modules.

**Alternatives considered**:

- Create a global Material module. Rejected because it hides component dependencies and encourages broad imports.
- Import Material only in root application configuration. Rejected because individual component dependencies become less explicit.
- Create wrapper components for every Material primitive immediately. Rejected because #177 excludes a separate design-system package and premature abstraction.

## Decision: Establish icon, typography, and density conventions without forcing page migration

**Rationale**: #177 asks for conventions but not complete UI migration. Icons should be used where they improve recognition, paired with text for primary operational actions when possible, and made accessible when icon-only controls are eventually used. Typography and density should be set through the Material theme and should preserve current readable operational layouts.

**Alternatives considered**:

- Introduce an icon-heavy redesign in #177. Rejected because product behavior and complete page migrations are out of scope.
- Leave icon, typography, and density choices unspecified. Rejected because later migration issues need a consistent convention.
- Use ad hoc per-component typography and density overrides. Rejected because it weakens the shared foundation and increases maintenance cost.

## Decision: Update architecture documentation as the source of truth

**Rationale**: #177 requires relevant frontend architecture documentation to be updated, and the constitution requires source-of-truth documentation updates when architecture or contracts change. `docs/ARCHITECTURE.md` is the project-level source of truth, while `frontend/README.md` can summarize frontend-local structure and validation if implementation changes make it stale.

**Alternatives considered**:

- Put all conventions only in code comments. Rejected because later migration issues need discoverable architecture guidance.
- Create a separate design-system documentation area. Rejected because #177 excludes a separate design-system package and the current docs structure already has architecture sources of truth.
