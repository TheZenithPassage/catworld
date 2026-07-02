# Phase 0 Research: Material Form Migration

## Decision: Reuse Angular Material form controls directly in each page

**Rationale**: The #177 foundation already approved Angular Material/CDK as the UI foundation, and the in-scope login, owner, and vet forms are standalone page components with straightforward fields. Direct standalone imports keep the implementation local, reviewable, and consistent with the current Angular structure.

**Alternatives considered**:

- Continue native controls: rejected because #179 explicitly requires Material controls where they exist.
- Create a reusable form component library: rejected because the current forms are simple and #176/#177 exclude a competing design system or broad abstraction without concrete need.

## Decision: Preserve template-driven signal state and submit methods

**Rationale**: The current forms store field state in Angular signals, use `FormsModule` with `ngModel`, and build request payloads inside existing submit methods. Keeping that state model preserves validation timing, payload shape, navigation, and backend-error behavior while the template presentation changes.

**Alternatives considered**:

- Convert to reactive forms: rejected because #179 does not require a form-state architecture change and doing so would increase regression risk.
- Move validation to new shared helpers: rejected because the existing validation rules are simple, page-owned, and behavior-preserving.

## Decision: Use Material validation and shared state presentation without changing validation timing

**Rationale**: Field-level required errors can be expressed with `mat-error` while the existing submit methods remain authoritative for when errors appear. Page-level backend or load errors can reuse #178's `UiStateComponent` when it matches the current page-level behavior.

**Alternatives considered**:

- Show validation eagerly on every empty field: rejected because it would change validation timing.
- Keep backend errors in native `.error-message` boxes: rejected for migrated form pages where #178 provides a Material-compatible shared feedback pattern.

## Decision: Keep responsive layout in page SCSS and remove only superseded migrated-form native styling

**Rationale**: #179 requires form layout and responsive composition to stay in component SCSS. Global native form styles still support out-of-scope cat and stay forms during migration, so cleanup must remove only rules made unnecessary for login, owner, and vet pages or narrow the global selectors to unmigrated forms.

**Alternatives considered**:

- Remove all native form global styling immediately: rejected because cat and stay forms are out of scope and still depend on coexistence styling.
- Move form layout into global utilities: rejected because the issue requires component SCSS ownership and the constitution favors focused changes.
