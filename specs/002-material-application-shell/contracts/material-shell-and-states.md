# Material Shell And Shared State Contract

## Scope

This contract applies to the authenticated Angular administration shell and
shared loading, empty, and error state presentation migrated by issue #178.

## Shell Contract

- The shell preserves existing product routes:
  - `/`
  - `/stays`
  - `/stays/new`
  - `/stays/:id/edit`
  - `/calendar`
  - `/owners`
  - `/owners/new`
  - `/owners/:id/edit`
  - `/cats`
  - `/cats/new`
  - `/cats/:id/edit`
  - `/vets`
  - `/vets/new`
  - `/vets/:id/edit`
  - `/accounts`
- The shell preserves existing guard behavior:
  - authenticated operational routes continue to use `authGuard`
  - accounts remains restricted by `adminGuard`
- The shell uses Angular Material primitives where appropriate for toolbar,
  responsive navigation, menus, buttons, icons, progress, cards, and surfaces.
- The shell keeps CatWorld brand, language toggle, logout, and route labels
  sourced from `app-shell.translations.ts`.
- The shell remains usable at desktop and target iPhone width without adding
  product routes or redesigning navigation information architecture.

## Shared State Contract

- Loading states use Material-compatible progress presentation and an accessible
  status name sourced from existing i18n text.
- Empty states use a Material-themed surface and existing page-specific i18n
  copy.
- Error states use a Material-themed surface with `role="alert"` or equivalent
  accessible announcement semantics when the state represents an actionable
  load or action failure.
- Shared states do not own data fetching, filtering, retries, routing, or
  domain decisions. Pages continue to own those behaviors.

## Exclusions

- Complex form and table migration remains out of scope.
- FullCalendar remains in place and is not replaced by Material.
- Backend, persistence, authorization, API payload, and domain rule contracts
  remain unchanged.
- No duplicate global design system, broad Material module, or parallel shell
  component library is introduced.
