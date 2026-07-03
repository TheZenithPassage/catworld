# UI Contract: Material Cat and Stay Forms

## Scope

This contract applies to the existing cat create/edit and stay create/edit routed
pages:

- `frontend/src/app/features/cats/pages/cat-create-page/`
- `frontend/src/app/features/cats/pages/cat-edit-page/`
- `frontend/src/app/features/stays/pages/stay-create-page/`
- `frontend/src/app/features/stays/pages/stay-edit-page/`

## Form Presentation Contract

- Every in-scope text, textarea, date, datetime, select, checkbox, and submit
  control uses the agreed Angular Material component, Material-supported native
  control, or Material presentation where one fits the current control role.
- Page-level loading and backend-error states use Material-compatible
  presentation where it preserves the existing behavior.
- Field-level validation messages are shown through Material field errors
  without changing validation timing or submit eligibility.
- Form layout, grouping, related links, summaries, and responsive composition
  remain owned by the routed page component SCSS.

## Behavior Preservation Contract

- Cat create/edit request payloads keep existing string, trimmed string,
  nullable optional string, owner ID, vet ID, and date-string semantics.
- Stay create request payloads keep existing `catIds`, `startAt`, `endAt`, and
  nullable `notes` semantics.
- Stay edit request payloads keep existing `startAt`, `endAt`, and nullable
  `notes` semantics.
- Cat create preserves owner and vet query-param defaults plus return behavior
  back to stay creation when applicable.
- Cat create related owner/vet links preserve their query-parameter behavior.
- Stay create preserves owner query-param preselection, cat query-param
  preselection, owner-dependent cat filtering, multi-cat selection, and related
  owner/cat creation links.
- Stay edit preserves owner/cat summary display, closed-stay modification
  blocking, edit-page load errors, and update navigation.
- Backend string and validation-map errors remain visible to the user.

## Out-of-Scope Contract

- No backend endpoints, DTOs, services, repositories, migrations, authorization
  rules, or stay business rules change.
- No searchable selector, draft restoration, cat photo control, vaccine warning,
  pricing behavior, calculated-night behavior, or unrelated route/page redesign
  is introduced.
- No broad Material module, new design-system package, or reusable form
  abstraction is introduced.

## Validation Contract

- Automated tests verify Material rendering and preserved payload, validation,
  error, selection, and navigation behavior for the four pages.
- `npm run format:check`, `npm run test:ci`, and `npm run build` pass from
  `frontend/`.
- Keyboard/touch smoke testing verifies cat and stay forms at 320, 375, and
  390 CSS pixels after final styling changes.
