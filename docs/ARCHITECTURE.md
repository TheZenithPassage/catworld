# CatWorld Architecture

CatWorld is a full-stack administration system for cat-boarding operations.

This document describes the currently implemented architecture and domain behavior. It is not a permanent limit on future CatWorld product scope.

This document focuses on the backend architecture, domain model, persistence decisions and testing strategy.

## Scope

CatWorld currently covers:

- Owner management.
- Cat management.
- Reference vet management.
- Stay booking management.
- Permanent stay deletion for authorized correction of mistaken records.
- Database-backed HTTP Basic application authentication.
- ADMIN-only application account management with fixed `ADMIN` and `STAFF` roles.
- Safe ADMIN-only application account deletion with creator and enabled-admin protection.
- Lookup of current, future, completed and cancelled stays.

## Stack

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Flyway
- Docker Compose
- JUnit 5
- Mockito
- Angular
- Angular animations
- Angular Material
- Angular CDK
- TypeScript
- SCSS
- FullCalendar
- GitHub Actions
- PlantUML

## Architecture Style

CatWorld is intentionally developed as a layered monolith.

```txt
controller -> service -> repository -> database
```

Main package responsibilities:

- `controller`: HTTP endpoints, request validation entry point and response status handling.
- `service`: business rules, transactions and application use cases.
- `repository`: persistence access through Spring Data JPA.
- `model`: JPA entities and domain behavior.
- `dto`: input and output contracts exposed by the API.
- `mapper`: conversion between DTOs and entities.
- `exception`: custom exceptions and global HTTP exception handling.

The project keeps business rules out of controllers. Controllers delegate to services and focus on the HTTP contract.

## Domain Model

### Main Entities

#### Owner

Represents a cat owner and contact information.

An `Owner` can have:

- multiple cats
- multiple stays
- one application account recorded as its creator

#### Vet

Represents a reference veterinarian.

A `Vet` can be associated with multiple cats, but a cat can also exist without a vet.

Each `Vet` stores the application account that created it.

#### Cat

Represents a cat registered in the boarding system.

A `Cat` belongs to one `Owner` and may optionally reference one `Vet`.

Each `Cat` stores the application account that created it.

#### Stay

Represents one boarding stay.

A `Stay` contains:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`
- `owner`
- participating cats through `StayCat`
- the application account that created it

#### StayCat

Represents the link between a `Stay` and a `Cat`.

The project uses an explicit link entity instead of a plain `@ManyToMany`.

#### UserAccount

Represents an application login account.

A `UserAccount` contains:

- unique username
- encoded password hash
- fixed `ADMIN` or `STAFF` role
- enabled state
- auditing timestamps

`UserAccount` does not store its own creator. Operational creator attribution
is stored only on owner, cat, vet and stay records.

## Stay Model

### Key Rule

A `Stay` represents **one boarding stay**.

It can include:

- one cat
- multiple cats from the same owner

All cats inside the same `Stay` share:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`

If one cat needs a different checkout time, a separate cancellation or a different lifecycle, it should be modeled as a separate `Stay`.

## Relationships

Main relationships:

- An `Owner` may have zero or more `Cat` records; each `Cat` belongs to one `Owner`.
- A `Vet` may be referenced by zero or more cats; each `Cat` may reference zero or one `Vet`.
- An `Owner` may have zero or more `Stay` records; each `Stay` belongs to one `Owner`.
- A `Stay` contains one or more `StayCat` links.
- A `Cat` may have zero or more `StayCat` links.
- Each `Owner`, `Cat`, `Vet` and `Stay` references the `UserAccount` that
  created it.

The persisted `Stay <-> Cat` relationship is materialized through `StayCat`.

## Modeling Decisions

### Stay Stores the Owner

`Stay` stores a direct reference to `Owner`.

Reasons:

- Preserve historical ownership more clearly.
- Avoid changing past stay history if a cat owner changes later.
- Simplify queries involving stays by owner.

Even though the owner could be derived from the cats, storing it directly makes the stay aggregate easier to query and safer historically.

### Stay-Cat Uses a Link Entity

The relationship between `Stay` and `Cat` is represented with `StayCat`.

Reasons:

- Make the relationship explicit in the domain model.
- Control the database structure directly.
- Prevent duplicate pairs with a composite primary key.
- Leave room for future relationship-specific fields if needed.

### Stay Status Is Dynamic

Stay status is not persisted.

It is computed from:

- `startAt`
- `endAt`
- `cancelledAt`
- current time

Possible statuses:

- `RESERVED`
- `CHECKED_IN`
- `CHECKED_OUT`
- `CANCELLED`

This avoids storing redundant state that can become inconsistent with the dates.

## Stay Business Rules

Current rules:

- A `Stay` must include at least one cat.
- All cats in a `Stay` must belong to the same `Owner`.
- The `Stay` owner must match every cat owner.
- The same cat cannot be repeated inside the same `Stay`.
- `endAt` must be after `startAt`.
- A cat cannot have overlapping active stays.
- Cancelled stays are ignored during overlap validation.
- Closed stays cannot be modified.
- Cancelled stays cannot be cancelled again.
- Permanent stay deletion is separate from cancellation. Authorized deletion
  removes the stay and its `StayCat` links, preserves cat, owner, vet and
  application-account records, and is not blocked by dynamic stay status.

## Persistence

The application uses MySQL in local development through Docker Compose.

Schema management is handled by Flyway migrations under:

```txt
src/main/resources/db/migration
```

Hibernate schema auto-update is not used for development schema evolution. The application validates the schema instead.

Important schema points:

- `owners` stores owner contact data.
- `vets` stores reference vet data.
- `cats` has `owner_id` and optional `vet_id`.
- `stays` has `owner_id`.
- `stays` does not have `cat_id`.
- `stay_cat` stores the relationship between stays and cats.
- `stay_cat` prevents duplicate pairs through primary key `(stay_id, cat_id)`.
- `status` is not persisted.
- `user_accounts` stores persistent application users for HTTP Basic authentication.
- `owners`, `cats`, `vets` and `stays` each store a non-null `created_by_id`
  foreign key to `user_accounts`.

## Authentication

HTTP Basic credentials are authenticated through Spring Security against `user_accounts`.

Successful login returns the canonical stored username and its fixed `ADMIN` or `STAFF` role. Angular keeps that identity and role in its in-memory authentication state alongside the HTTP Basic credentials.

The `/api/users` endpoints list, create and update application users and are restricted to `ADMIN`. Angular exposes the corresponding Accounts area at `/accounts` only to an authenticated `ADMIN` and protects direct route access with the same role distinction. `STAFF` retains access to all existing operational routes. A `403 Forbidden` from `/api/users` clears the potentially stale frontend session, while forbidden responses from unrelated APIs do not trigger that behavior.

`DELETE /api/users/{id}` allows an authenticated `ADMIN` to delete another
application account. The service rejects authenticated self-deletion with
`403 Forbidden`, returns `404 Not Found` for a missing target, and blocks
deletion with `409 Conflict` while any owner, cat, vet or stay references the
target as creator. Deleting an `ADMIN` is allowed only when a different enabled
`ADMIN` remains; disabled administrators do not satisfy that invariant.

Account deletion resolves the target and authenticated account, checks creator
references, then locks the enabled-admin set for every eligible target. The
service validates the deletion against that locked current state rather than
the target role read before locking, then deletes and explicitly flushes in one
transaction. Existing creator foreign keys remain final protection against
concurrent reference creation, and an integrity or optimistic-locking race maps
to `409 Conflict`. The operation never cascades, detaches, reassigns or deletes
operational records to make account deletion succeed.

On a fresh database, the configured `catworld.security.username` and `catworld.security.password` create the first `ADMIN` account. The password is encoded before it is stored. When any user already exists, startup does not create, update, re-enable or overwrite accounts.

When authenticated users create owner, cat, vet or stay records, the backend
resolves the stored `UserAccount` for the current Spring Security username and
persists it as the record creator. Creator attribution is server-controlled and
is not part of operational client request payloads or response display.

Owner, cat, vet and stay deletion use a shared backend authorization policy.
`ADMIN` accounts may delete operational records regardless of creator or record
age. `STAFF` accounts may delete only records they created, and only while the
record's `createdAt` timestamp remains strictly less than 15 minutes old
according to server time. At exactly 15 minutes, and after that boundary, staff
deletion is forbidden. The policy uses the backend time source and maps
authorization denial to `403 Forbidden`; Angular does not calculate or enforce
this rule. Entity lookup, relationship and state checks stay in the responsible
services outside the shared authorization policy.

Owner, cat, vet and stay responses expose a backend-calculated `canDelete`
rendering hint for the current authenticated user. The hint combines the shared
deletion policy with entity-specific integrity rules: an owner must have no cat
or direct stay references, a cat must have no `StayCat` history, and a vet must
have no cat references. Stay deletion has no additional relationship blocker
because it owns and removes only its `StayCat` links. Authorization failure
short-circuits relationship probing, and these hints remain advisory; every
DELETE request recomputes the current server-side rules.

Permanent deletion follows lookup, authorization, relationship checks where
applicable, delete and explicit flush in that order. Missing records return
`404 Not Found`, authorization denial returns `403 Forbidden` before protected
relationships are queried, and a known reference or delete/flush race returns
`409 Conflict`. Any cat or direct stay reference blocks owner deletion; any
historical, cancelled, active or future `StayCat` reference blocks cat
deletion; and any cat reference blocks vet deletion. Authorized stay deletion
removes the stay and its links while preserving owners, cats, vets and
application accounts. Existing foreign keys remain the final integrity
protection, and no dependent record is cascaded, detached or reassigned merely
to make owner, cat or vet deletion succeed.

## Frontend UI Foundation

The authenticated Angular administration interface uses Angular Material and
Angular CDK as its default UI foundation for interactive components,
application-wide theming and shared UI behavior.

Angular Material was selected and approved as the frontend foundation in
GitHub issue #176. Issue #177 establishes the foundation and migration
boundaries without migrating complete pages, forms, tables, shell controls or
feature workflows.

### Material Theming

`frontend/src/styles.scss` owns the application-wide Material theme.

The theme:

- Uses Angular Material public Sass APIs from `@angular/material`.
- Preserves CatWorld's warm, soft administration identity through the existing
  CatWorld colors, typography and density choices.
- Provides the Material system tokens that future Material components inherit.
- Does not implement the user-facing dark-mode preference tracked by #126.

Material customization must use supported theming APIs and public component
APIs. CatWorld must not rely on private Angular Material selectors, internal
DOM structure or implementation details for customization.

### Styling Responsibilities

Global styles are limited to:

- Material theme setup.
- Document and application-level defaults.
- CatWorld design tokens and CSS custom properties.
- Truly shared utilities.
- Integration boundaries for external libraries.

Component SCSS remains responsible for local layout, responsive composition
and product-specific presentation.

Shared utilities should stay small, semantic and broadly useful across
approved migrated surfaces. They should not become a parallel component system.
Global styles must not recreate native button, input, select, textarea, table
or checkbox component systems for authenticated administration surfaces that
use Angular Material.

FullCalendar remains a custom integration where Material does not provide the
relevant calendar interaction or structure. FullCalendar-specific styling stays
explicitly separate from Material component customization.

### Material Completion and Native Boundaries

Authenticated administration controls use Angular Material when Material
provides the matching interaction role. CatWorld no longer keeps a global
native-control styling system alongside the Material foundation.

Retained native markup is limited to explicit boundaries:

- Native `<select>` elements may remain inside `mat-form-field` with
  `matNativeControl` for short option lists where Angular Material explicitly
  supports the native select control and the existing form behavior does not
  require the custom `mat-select` overlay.
- FullCalendar owns its internal buttons, tables and event markup. CatWorld
  styles that vendor boundary only through the calendar component integration
  styles, not through global native-control selectors.
- Browser-provided dialogs such as cancellation confirmation prompts remain
  browser controls unless a feature explicitly approves replacing the
  interaction.

Any future retained native control in an authenticated administration surface
must record its reason and must not depend on global legacy native-control
styling.

### Material Shell and Shared States

The authenticated application shell uses Angular Material toolbar, menu, button
and icon primitives for global navigation, language switching and session
actions while preserving the existing route and guard structure. Desktop
navigation remains visible in the toolbar; narrow viewports use the Material
menu trigger without adding product routes or changing the navigation
information architecture.
The root application configuration provides Angular animations for Material
overlays and interactive shell components.

Reusable loading, empty and error states live under
`frontend/src/app/shared/ui-state/`. Pages continue to own data fetching,
filtering, retries and domain decisions; the shared state component owns only
Material-themed presentation, accessible status or alert semantics and optional
retry-action rendering.

### Material Forms

The login, account management, owner create/edit, vet create/edit, cat
create/edit and stay create/edit forms use Angular Material form fields,
inputs, supported native selects, checkboxes and buttons for their interactive
controls where Material provides the matching control role. Each routed form
page keeps its own signal-based field state, request payload shaping, submit
method, navigation and responsive form layout in component SCSS.

Required-field validation for these migrated forms is presented through
Material field errors while preserving existing validation rules and submit
timing where the control has field-level validation. Page-level loading,
backend errors and cross-field or selection errors use the shared
`UiStateComponent` where that presentation fits the existing behavior.

Calendar app-owned filters, display options, stays overview status filters and
shared stay search filters are Material-based. FullCalendar vendor-owned
controls remain a separate integration boundary. Material inputs, supported
native selects, checkboxes and buttons do not depend on legacy global
native-control selectors.

### Component Conventions

Standalone Material imports belong in the standalone component that directly
uses them, or in a narrowly scoped shared component that owns a real CatWorld
pattern. CatWorld should not introduce a broad global Material module that
re-exports many unused Material modules.

Icons should support recognition without replacing clear operational text.
Primary actions should keep text labels where practical. Decorative icons must
be hidden from assistive technology, and icon-only controls must have an
accessible name and a clear visible or tooltip-supported affordance.

Typography and density are configured through the Material theme. Local
typography or density overrides should be limited to documented product
exceptions on specific components.

## Auditing

Main entities include:

- `createdAt`
- `updatedAt`

These fields are managed with JPA Auditing.

Operational entities also include required creator attribution:

- `Owner.createdBy`
- `Cat.createdBy`
- `Vet.createdBy`
- `Stay.createdBy`

Creator attribution is assigned by services during creation and enforced by
database foreign keys. It is separate from JPA timestamp auditing.

## Error Handling

The API uses custom exceptions for common error cases:

- resource not found
- bad request
- conflict

A global exception handler translates application exceptions into HTTP responses.

Typical mappings:

- `ResourceNotFoundException` -> `404 Not Found`
- `BadRequestException` -> `400 Bad Request`
- `ConflictException` -> `409 Conflict`
- validation errors -> `400 Bad Request`

## Testing Strategy

Testing focuses on backend business rules and HTTP contracts, complemented by behavior-level frontend tests for critical authentication and calendar flows.

### Service Tests

Service tests cover business rules directly.

Current focus:

- stay creation rules
- owner consistency
- overlap validation
- cancellation flow
- update flow rules

Repositories and mappers are mocked where appropriate.

### Controller Tests

Controller tests cover the HTTP contract.

Expected focus:

- request methods and paths
- response status codes
- request validation
- path variables
- service delegation
- exception mapping through the global exception handler

Controller tests should use Spring MVC slice testing instead of booting the full application context unless there is a concrete reason.

### CI

GitHub Actions runs backend and frontend validation automatically.

Workflow files:

```txt
.github/workflows/backend-ci.yml
.github/workflows/frontend-ci.yml
```

Both workflows:

- run on pull requests targeting `main`
- run on pushes to `main`
- support manual `workflow_dispatch`

The backend workflow:

- sets up Java 17
- uses Maven dependency caching
- runs `./mvnw verify`

The frontend workflow:

- runs from `frontend/`
- sets up Node.js 22
- uses npm dependency caching
- runs `npm ci`
- runs `npm run build`
- runs `npm run format:check`
- runs `npm run test:ci`

## Diagrams

PlantUML diagrams live in:

```txt
docs/uml/
```

Current diagrams:

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

## Public Repository Notes

No real credentials are required to run this project locally.

The committed environment examples use dummy local values. The real `.env` file is ignored by Git.

Database credentials for real environments must be provided through environment variables or external secret management, not committed to the repository.

## Source of Truth

The source of truth for architecture and modeling is:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/uml/*`
