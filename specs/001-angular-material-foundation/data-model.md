# Data Model: Angular Material Foundation

This feature does not add persisted domain entities, API resources, browser storage records, or backend data model changes. The entities below are planning entities used to describe the frontend foundation contract.

## Material Dependency Set

**Purpose**: Represents the frontend dependency change required to make Angular Material available.

**Fields**:

- Angular Material package version line: must be compatible with the current Angular 21.2.x frontend.
- Angular CDK package version line: must match the Material package line.
- Lockfile state: must reflect the installed compatible dependency set.

**Validation Rules**:

- Material and CDK must be on the same 21.2.x line.
- Dependency installation must not require an unrelated Angular major upgrade.
- Production build, tests, and format check must pass after dependency installation.

## CatWorld Material Theme

**Purpose**: Represents the application-wide theme that lets Material components inherit CatWorld's visual identity.

**Fields**:

- Color roles derived from CatWorld's existing visual identity.
- Typography configuration aligned with current readable administration UI.
- Density setting appropriate for operational screens.
- Application-level defaults needed by Material components.

**Validation Rules**:

- Theme setup must use supported Material theming APIs and public interfaces.
- Theme setup must preserve recognizable CatWorld visual identity.
- Theme setup must not implement the #126 user-facing dark-mode preference.
- Theme setup must not rely on fragile overrides of internal Material component structure.

## Styling Responsibility Boundary

**Purpose**: Defines which styling concerns belong to global theme/styles, component SCSS, shared utilities, and FullCalendar-specific styling.

**Fields**:

- Material theming responsibilities.
- Component SCSS responsibilities.
- Shared utility responsibilities.
- FullCalendar-specific styling responsibilities.
- Unsupported customization examples.

**Validation Rules**:

- Global styles must remain limited to theme setup, document/application defaults, shared utilities, and external-library integration.
- Component SCSS must remain responsible for local layout, responsive composition, and product-specific presentation.
- FullCalendar-specific styling must remain explicitly separate where Material has no corresponding component or interaction model.

## Migration Coexistence Rule

**Purpose**: Describes how native controls and Material controls coexist while child issues migrate screens incrementally.

**Fields**:

- Existing native control status.
- New or migrated control expectation.
- Prohibited mixed-scope changes.
- Later migration issue responsibilities.

**Validation Rules**:

- #177 must not migrate complete forms, tables, shell, feature pages, or full application pages.
- Existing native controls may remain temporarily until their owning migration issue replaces them.
- New or migrated controls after the foundation should use Material where Material provides the corresponding component.
- CatWorld must not maintain a permanent competing native component system after Material replacements are in place.

## Frontend Documentation Contract

**Purpose**: Represents the architecture documentation that later migration issues use as their source of truth.

**Fields**:

- Foundation decision reference to #176 and #177.
- Dependency and theming boundary.
- Styling responsibility boundary.
- Standalone import convention.
- Icon convention.
- Typography and density convention.
- Supported customization API rule.
- Out-of-scope migration boundaries.

**Validation Rules**:

- Documentation must be updated before the feature is considered complete.
- Documentation must not claim that complete page migrations are done by #177.
- Documentation must preserve the distinction between implemented behavior, assumptions, and future migration work.
