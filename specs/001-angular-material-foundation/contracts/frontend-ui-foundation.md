# Frontend UI Foundation Contract

This contract defines the conventions that #177 establishes for later Angular Material migration issues. It is a planning contract, not an implementation checklist.

## Scope

- Applies to the authenticated CatWorld Angular administration interface.
- Establishes Angular Material and CDK as the default foundation for interactive UI components, application-wide theming, and shared UI behavior.
- Preserves existing routes, behavior, internationalization, authorization behavior, and backend contracts unless a later child issue explicitly states otherwise.
- Does not migrate complete forms, tables, shell, feature pages, or full application pages in #177.

## Dependency Contract

- Use Angular Material and Angular CDK versions compatible with the current Angular 21.2.x frontend.
- Keep Material and CDK on matching version lines.
- Do not perform an unrelated Angular major upgrade as part of #177.
- Validate dependency changes with frontend format check, CI tests, and production build.

## Theming Contract

- Configure one application-wide Material theme using supported Material theming APIs.
- Preserve CatWorld's warm, soft, readable administration identity.
- Material theming owns Material color roles, typography configuration, density configuration, and component-level theme tokens exposed by public APIs.
- Do not implement the #126 dark-mode preference in #177.
- Do not depend on private/internal Material DOM structure, selectors, or implementation details for customization.

## Styling Responsibility Contract

- Global styles may contain Material theme setup, document/application defaults, truly shared utilities, and external-library integration.
- Component SCSS owns local layout, responsive composition, and product-specific presentation.
- Shared utilities must stay small, semantic, and broadly useful across approved migrated surfaces.
- FullCalendar-specific styling remains separate where Material does not provide the relevant interaction or structure.
- Existing native control styles may remain temporarily only to support unmigrated surfaces.

## Coexistence Contract

- Existing native buttons, inputs, selects, textareas, and tables may remain until their owning migration issue replaces them.
- New migrated controls should use Angular Material when Material provides the corresponding component.
- A later issue may document an explicit exception when Material does not provide the relevant interaction or structure.
- #177 must not create a permanent parallel global component system.

## Standalone Import Contract

- Import Material modules at the standalone component that directly uses them, or at a narrowly scoped shared component that owns a real CatWorld pattern.
- Avoid a broad global Material module that re-exports many unused Material modules.
- Shared wrappers should be introduced only when they encode behavior, accessibility, or presentation that CatWorld will reuse across approved migration issues.

## Icon Contract

- Prefer text labels for primary operational actions.
- Use icons to support recognition, compact secondary actions, or common Material affordances when useful.
- Decorative icons must be hidden from assistive technology.
- Icon-only controls must have an accessible name and a clear visible or tooltip-supported affordance.
- Do not introduce icon usage in #177 solely to redesign complete pages.

## Typography and Density Contract

- Typography should be configured through the Material theme and preserve current readability.
- Density should be configured through the Material theme and remain suitable for operational screens on desktop and the target iPhone.
- Per-component typography or density overrides should be local exceptions with a documented product reason.

## Validation Contract

The implementation is complete only when:

- `cd frontend && npm run format:check` passes.
- `cd frontend && npm run test:ci` passes.
- `cd frontend && npm run build` passes.
- Review confirms no complete page, form, table, shell, or feature migration was mixed into #177.
- Review confirms `docs/ARCHITECTURE.md` reflects the implemented foundation and customization boundaries.
