# Research: Cat and Stay Material Forms

## Decision: Reuse the #179 standalone Material form pattern

**Rationale**: The active worktree already contains Material login, owner and vet forms that import only directly used Material modules into standalone page components. They keep signal-backed field state, submit methods, payload shaping, navigation, and component SCSS local to each routed page. Reusing that pattern satisfies issue #180 and avoids a new form abstraction.

**Alternatives considered**:

- Keep native controls: rejected because #180 explicitly requires Material migration.
- Create shared CatWorld form components: rejected because #176/#177/#179 exclude a duplicate component system and the current need can be handled directly in the four page components.

## Decision: Preserve existing date and datetime string inputs inside Material form fields

**Rationale**: Cat date fields currently use `YYYY-MM-DD` string values and stay date/time fields currently use `datetime-local` strings that are sent directly in request payloads. Angular Material datepicker and timepicker packages exist locally, but replacing the stay fields with split date/time object controls would introduce value conversion and interaction behavior beyond this issue. The migrated forms should use Material form-field/input presentation around the existing HTML date and datetime input types to preserve exact payload semantics while still moving the visible form pattern to Material.

**Alternatives considered**:

- Use Material datepicker/timepicker and convert to strings: rejected for this issue because it would add conversion and split-control behavior with mismatch risk not requested by #180.
- Keep bare native date/datetime controls without Material presentation: rejected because #180 requires the agreed Material component where one exists.

## Decision: Use Material-supported selects and Material checkbox components for entity and multi-cat selection

**Rationale**: Cat sex, owner, and vet selections, stay owner selection, and stay multi-cat selection are currently native selects and checkboxes. Angular Material supports native selects inside Material form fields through `matNativeControl`, which preserves existing empty-string and ID value semantics with less bundle cost than overlay selects. Angular Material checkbox matches the stay multi-cat selection role. The implementation must preserve selected IDs, owner-dependent cat filtering, query-param preselection, and multi-cat update behavior.

**Alternatives considered**:

- Keep native selects and checkboxes: rejected because Material replacements exist for these roles.
- Use overlay `mat-select`: rejected for this issue after validation showed it pushed the existing production build over the active initial bundle error budget.
- Introduce searchable selectors: rejected because #180 explicitly places searchable selectors out of scope.

## Decision: Preserve the production budget with targeted stay-create lazy loading

**Rationale**: Keeping Material checkbox for the stay multi-cat control adds enough code to exceed the existing production initial bundle budget when the stay-create page remains eagerly imported through `app.routes.ts`. Lazy-loading the existing `/stays/new` standalone component preserves the URL, guard, query-param behavior, and component ownership while keeping the budget active.

**Alternatives considered**:

- Raise the build budget: rejected because the plan requires existing production budgets to keep passing.
- Replace Material checkbox with native checkbox: rejected because #180 explicitly includes checkboxes where a Material component exists.
- Lazy-load a broader route tree: rejected because only the stay-create route needs budget relief for this issue.

## Decision: Add behavior-oriented frontend unit coverage for migrated forms

**Rationale**: Cat and stay forms currently have complex payload, validation, navigation, and query-param behavior that could regress during template migration. Unit tests can verify Material rendering and business-facing preservation without involving backend changes. Browser/mobile smoke testing remains required for layout, keyboard, and touch usability.

**Alternatives considered**:

- Rely only on build and manual smoke: rejected because behavior-preserving form migration has enough mismatch risk to require targeted automated coverage.
- Add backend tests: rejected because backend contracts and domain rules are unchanged.

## Decision: Narrow global native-form styling only after migrated surfaces no longer need it

**Rationale**: `frontend/src/styles.scss` still includes native control coexistence styling for unmigrated surfaces and filters. Cat and stay native form card styling becomes superseded after this migration, but global native input/select/checkbox styles may still support out-of-scope controls. Cleanup must be limited to styling owned solely by migrated cat/stay forms.

**Alternatives considered**:

- Remove all native form/control styling: rejected because filters and other unmigrated native controls still rely on coexistence styles.
- Leave superseded cat/stay form card styling untouched: rejected because #180 requires removing superseded native-control styling from migrated surfaces.
