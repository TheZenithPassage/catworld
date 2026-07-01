# Material Forms UI Contract

## Scope

This contract applies to the migrated login, owner create/edit, and vet
create/edit forms for issue #179.

## Form Control Contract

- Every applicable interactive text field uses Angular Material form-field and
  input primitives.
- Submit and navigation actions on migrated forms use Angular Material button
  primitives where they replace native buttons or action links.
- Field labels, validation text, loading text, backend errors, button labels,
  and navigation labels remain sourced from the existing i18n service.
- Field names, `ngModel` bindings, signal state, autocomplete attributes, and
  submit methods preserve current request payloads and behavior.

## Validation Contract

- Field-level Material validation presentation must not change when a form may
  be submitted.
- Missing required values must produce the same translated messages as before.
- Backend validation maps and backend error strings must remain visible through
  page-level error presentation without becoming field-specific behavior unless
  a future issue explicitly changes that contract.
- Loading and submitting states must keep existing disabled behavior and must
  prevent duplicate submits at least as effectively as the current forms.

## Responsive Contract

- Each migrated form owns its layout and responsive composition in its component
  SCSS.
- At 320, 375, and 390 CSS pixels, form fields, Material labels, validation
  text, backend errors, and action buttons must remain usable without
  incoherent overlap.

## Boundary Contract

- This contract does not apply to cat forms, stay forms, searchable entity
  selectors from #160, tables, calendar behavior, or unrelated pages.
- This contract does not authorize backend, persistence, API payload, route,
  guard, authorization, or domain-rule changes.
