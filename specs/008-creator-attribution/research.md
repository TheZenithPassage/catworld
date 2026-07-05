# Research: Creator Attribution for Operational Records

## Current Authentication Principal

- **Decision**: Resolve the authenticated account by reading the current Spring Security authentication username and loading the canonical `UserAccount` with `UserAccountRepository.findByUsername`.
- **Rationale**: `DatabaseUserDetailsService` currently authenticates users from `user_accounts` and returns Spring Security's standard `UserDetails` with the stored username. No custom principal carries a `UserAccount` id today, so username lookup is the existing stable bridge.
- **Alternatives considered**: Change the principal to a custom account principal with id. Rejected because it is a broader authentication contract change than issue #146 requires.

## Creator Relationship Modeling

- **Decision**: Add explicit required `createdBy` `@ManyToOne(fetch = FetchType.LAZY, optional = false)` relations to `Owner`, `Cat`, `Vet`, and `Stay`, backed by `created_by_id` columns.
- **Rationale**: Issue #146 explicitly allows explicit fields and warns against `UserAccount` self-reference through the current auditable base. Four explicit fields keep the change narrow and transparent.
- **Alternatives considered**: Add `@CreatedBy` to `AuditableEntity`; rejected because `UserAccount` extends that base and would gain a self creator relation. Add a dedicated operational base class; rejected for now because it adds inheritance without needed behavior beyond four explicit relations.

## Migration and Schema Validation

- **Decision**: Add a `V3__add_creator_attribution.sql` Flyway migration with non-null `created_by_id` columns and foreign keys from `owners`, `cats`, `vets`, and `stays` to `user_accounts(id)`.
- **Rationale**: The constitution requires Flyway for schema evolution, and issue #146 requires the schema to reject missing or invalid creator references. Existing Docker profile uses `spring.jpa.hibernate.ddl-auto=validate` and Flyway, so a clean MySQL startup proves migration/mapping alignment.
- **Alternatives considered**: Rely on Hibernate DDL generation in tests only; rejected because real schema changes must be explicit Flyway migrations.

## API Contract Preservation

- **Decision**: Keep existing request and response DTOs creator-free and assign creator only inside backend services.
- **Rationale**: The issue requires creator data to be server-controlled, absent from client request payloads, and unchanged from the client perspective. Existing DTOs already omit creator fields.
- **Alternatives considered**: Include creator id in responses for inspection. Rejected because creator display is explicitly out of scope.

## Operational Deployment Check

- **Decision**: Document a pre-deployment recheck that `owners`, `cats`, `vets`, and `stays` are empty before applying the required creator migration to production.
- **Rationale**: Issue #146 states production operational tables are expected empty but must be rechecked before deployment. That is an operational source-of-truth concern, not a code assumption.
- **Alternatives considered**: Backfill all existing operational rows to a bootstrap admin. Rejected because no such product or operational decision is approved by the issue.
