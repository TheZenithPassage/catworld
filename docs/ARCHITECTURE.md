# CatWorld Architecture

CatWorld is a full-stack application for managing a cat boarding business.

This document focuses on the backend architecture, domain model, persistence decisions and testing strategy.

## Scope

CatWorld currently covers:

- Owner management.
- Cat management.
- Reference vet management.
- Stay booking management.
- Database-backed HTTP Basic application authentication.
- Lookup of current, future, completed and cancelled stays.

## Not included in the current scope

* Room or capacity management.
* Billing and payments.
* Inventory management.
* Administrative user management and role-based endpoint permissions.

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

#### Vet

Represents a reference veterinarian.

A `Vet` can be associated with multiple cats, but a cat can also exist without a vet.

#### Cat

Represents a cat registered in the boarding system.

A `Cat` belongs to one `Owner` and may optionally reference one `Vet`.

#### Stay

Represents one boarding stay.

A `Stay` contains:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`
- `owner`
- participating cats through `StayCat`

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

* An `Owner` may have zero or more `Cat` records; each `Cat` belongs to one `Owner`.
* A `Vet` may be referenced by zero or more cats; each `Cat` may reference zero or one `Vet`.
* An `Owner` may have zero or more `Stay` records; each `Stay` belongs to one `Owner`.
* A `Stay` contains one or more `StayCat` links.
* A `Cat` may have zero or more `StayCat` links.

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

## Authentication

HTTP Basic credentials are authenticated through Spring Security against `user_accounts`.

On a fresh database, the configured `catworld.security.username` and `catworld.security.password` create the first `ADMIN` account. The password is encoded before it is stored. When any user already exists, startup does not create, update, re-enable or overwrite accounts.

## Auditing

Main entities include:

- `createdAt`
- `updatedAt`

These fields are managed with JPA Auditing.

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

GitHub Actions runs Maven verification automatically.

Workflow file:

```txt
.github/workflows/backend-ci.yml
```

The workflow:

- runs on pull requests targeting `main`
- runs on pushes to `main`
- sets up Java 17
- uses Maven dependency caching
- runs `./mvnw verify`

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
