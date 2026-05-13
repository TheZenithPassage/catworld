# CatWorld

Web API for managing a cat boarding business.

## Scope

- Owner management.
- Cat management.
- Reference vet management.
- Stay booking management.
- Lookup of current, future, completed, and cancelled stays.

Out of the initial scope:
- room or capacity management
- advanced billing
- inventory
- complex permissions and roles

## Stack

- Java + Spring Boot
- Spring Web
- Spring Data JPA
- MySQL
- Flyway
- Docker Compose
- PlantUML

## Architecture

Layered monolith:

- `controller`: HTTP entry points and responses
- `service`: business rules and transactions
- `repository`: persistence
- `model`: entities and domain behavior
- `dto` + `mapper`: input and output contracts

## Conceptual Model

### Main Entities

- **Owner**: owner contact record.
- **Vet**: reference veterinarian.
- **Cat**: cat linked to an owner and optionally to a vet.
- **Stay**: booking with dates, cancellation data, notes, and associated owner.
- **StayCat**: link entity between each `Stay` and each participating `Cat`.

### Key Stay Rule

A `Stay` represents **one boarding stay**.

It can include:
- one cat
- multiple cats from the same owner

All cats in the same `Stay` share:
- `startAt`
- `endAt`
- `cancelledAt`
- `notes`

If one of those cats needs a different checkout time, a separate cancellation, or different lifecycle rules, it is no longer the same stay. It should be modeled as a separate `Stay`.

### Main Relationships

- `Owner` 1..* `Cat`
- `Vet` 0..* `Cat`
- `Owner` 1..* `Stay`
- `Stay` 1..* `StayCat`
- `Cat` 1..* `StayCat`

The persisted `Stay <-> Cat` relationship is not modeled as a plain `@ManyToMany`. It is materialized through `StayCat`.

## Modeling Decisions

### 1. Stay Stores the Owner

`Stay` stores a direct reference to `Owner`.

Reasons:
- preserve historical ownership more clearly
- avoid changing past stay history if a cat owner changes later
- simplify queries

### 2. Stay-Cat Uses a Link Entity

`StayCat` is used instead of leaving the relationship as a plain `@ManyToMany`.

Reasons:
- make the relationship explicit in the domain and database
- provide more control over constraints
- leave room for relationship-specific fields later

## Current Stay Business Rules

- A `Stay` must include at least one cat.
- All cats in a `Stay` must belong to the same `Owner`.
- The `Stay` owner must match every cat owner.
- The same cat cannot be repeated within the same `Stay`.
- `endAt` must be after `startAt`.
- A cat cannot have overlapping active stays.
- A cancelled stay is not considered active for overlap validation.

## Stay Status

The `Stay` status is **dynamic**. It is not persisted as a column.

It is computed from:
- `startAt`
- `endAt`
- `cancelledAt`
- the current time

Possible statuses:
- `RESERVED`
- `CHECKED_IN`
- `CHECKED_OUT`
- `CANCELLED`

## Auditing

Main entities persist:
- `createdAt`
- `updatedAt`

They are managed with JPA Auditing.

## Database

Important schema points:
- `cats` has `owner_id` and `vet_id`
- `stays` does not have `cat_id`
- `stays` has `owner_id`
- the relationship between stays and cats is stored in `stay_cat`
- `stay_cat` prevents duplicate pairs through the primary key (`stay_id`, `cat_id`)
- `status` is not persisted

## Diagrams

Diagrams live in `docs/uml/`:

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

## Local Development

### Requirements

- Java 17
- Docker Desktop
- Maven or the included Maven Wrapper

### Database

1. Copy `.env.example` to `.env` if you want to override local defaults.
2. Start MySQL with Docker Compose.
3. Start the application with the `docker` profile.
4. Flyway applies migrations on startup.

## Public Repository Notes

No real credentials are required to run this project locally. The committed environment examples use explicit dummy values, and the real `.env` file is ignored by Git.

The source of truth for project architecture and modeling is:
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/uml/*`
