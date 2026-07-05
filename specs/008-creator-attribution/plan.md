# Implementation Plan: Creator Attribution for Operational Records

**Branch**: `feat/146-attribute-operational-records-to-their-creator` | **Date**: 2026-07-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-creator-attribution/spec.md`

## Summary

Persist the authenticated `UserAccount` that creates each operational `Owner`, `Cat`, `Vet`, and `Stay` record while preserving existing client creation contracts. Use the existing Spring Security, service, repository, JPA, and Flyway stack: add explicit required creator relations to the four operational entities, resolve the current authenticated account server-side during create operations, add a Flyway migration with non-null foreign keys, and validate with service, persistence, full Maven, and MySQL Flyway startup checks.

## Technical Context

**Language/Version**: Java 17 (`maven.compiler.release=17`) with Spring Boot 4.0.2 for the backend. Frontend code is out of scope.

**Primary Dependencies**: Spring Web, Spring Security, Spring Data JPA, Spring Validation, Flyway with `flyway-mysql`, MySQL Connector/J, Lombok, JUnit 5, Mockito, Spring Security Test, H2 in MySQL mode for tests.

**Storage**: MySQL operational schema managed by Flyway under `src/main/resources/db/migration`. H2 MySQL mode is used by the test profile. This feature changes persistent entity relationships and table schemas for `owners`, `cats`, `vets`, and `stays`.

**Testing**: Maven wrapper `./mvnw verify`; JUnit 5 and Mockito unit tests; Spring Boot MVC/security tests; Spring Data JPA slice tests where persistence constraints are responsible evidence; Docker Compose MySQL startup for Flyway/schema validation.

**Target Platform**: Spring Boot API running in Docker Compose with MySQL 8.0 and `SPRING_PROFILES_ACTIVE=docker`; local tests run on the JVM with H2 MySQL mode.

**Project Type**: CatWorld full-stack web administration system; this feature is backend/database only.

**Performance Goals**: N/A: no performance target is specified by issue #146, repository evidence, or a human decision.

**Constraints**: Creator data must be server-controlled and absent from client request payloads; `UserAccount` must not be creator-attributed; `createdAt` and `updatedAt` remain JPA-audited; production operational tables are expected empty but must be rechecked before deployment; stay invariants must remain unchanged.

**Scale/Scope**: Four operational entity types and their create paths: owner, cat, vet, and stay. No creator display, deletion authorization, `updatedBy`, historical activity log, frontend change, or account self-reference is in scope.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Pass. The feature is operational auditability for cat-boarding records and does not introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent deployment assumptions.
- **Layered monolith responsibilities**: Pass. Controllers remain HTTP-only, services assign creator attribution during use cases, repositories provide persistence access, JPA entities model relationships, DTOs/mappers preserve API contracts.
- **Backend and database authority**: Pass. Creator assignment is server-side and required database constraints backstop integrity.
- **Schema evolution**: Pass. Real schema changes are planned through Flyway only; Hibernate auto-update is not used for production schema evolution. Validation includes MySQL Flyway startup.
- **Protected stay model**: Pass. Stay status remains derived and existing stay invariants remain unchanged; stay creation only gains creator attribution after current validation succeeds.
- **Specification and planning discipline**: Pass. Scope, exclusions, contract preservation, persistence/security decisions, edge cases, and validation evidence are recorded in the spec and this plan.
- **Architecture and technology assessment**: Pass. The feature triggers a material security/persistence/operational assessment. The selected approach is issue-backed, uses existing approved project mechanisms, and has no pending human approval.
- **Focused changes and proportional validation**: Pass. Planned changes are limited to model, service, migration, tests, and relevant source-of-truth docs/diagrams. Validation includes service, persistence/schema, full Maven, and MySQL startup evidence.
- **Operational safety and sources of truth**: Pass. No secrets or real data are committed. `docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, and UML schema/domain diagrams are in the source map if implemented behavior makes them stale.

Post-design re-check: Pass. Phase 1 artifacts preserve the same scope and no unresolved product, security, persistence, shared-contract, authorization, UX, or operational blocker remains.

## Architecture and Technology Assessment

**Assessment required**: Yes. Issue #146 introduces material security, persistence, shared API contract, and operational deployment concerns by adding required creator attribution backed by schema constraints while preserving client contracts.

**Decision trigger**: Material security decision; material persistence decision; material shared-contract decision; material operational decision.

**Options considered**:

- Existing platform/framework/project capability: Add explicit `createdBy` `@ManyToOne` relations on `Owner`, `Cat`, `Vet`, and `Stay`; resolve the authenticated username from Spring Security and load `UserAccount` through the existing repository; assign in service create methods; enforce through Flyway non-null FKs. Fits current layered monolith and issue constraints with low dependency and migration cost.
- Established library/framework/service: Use Spring Data auditing `@CreatedBy` with an `AuditorAware<UserAccount>` or similar auditing extension. Rejected for this issue because the current auditable base is also used by `UserAccount`, and issue #146 explicitly says to avoid an awkward `UserAccount` self-reference through the current auditable base while keeping `createdAt`/`updatedAt` under JPA Auditing.
- Focused custom implementation: Add a dedicated operational base class that contains creator attribution for operational entities only. Acceptable by the issue, but not selected because four explicit fields are simpler, clearer for this narrow scope, and avoid adding inheritance structure before confirmed reuse beyond these entities.

**Selected approach**: Existing project capability with explicit `createdBy` relations on the four operational entities plus a small current-account resolver used by create services.

**Why selected**: It directly satisfies issue #146, preserves controller -> service -> repository -> database responsibilities, keeps HTTP DTOs creator-free, avoids `UserAccount` self-reference, uses Flyway for schema evolution, and introduces no new framework or cross-cutting infrastructure.

**Confirmed medium-term use**: Supports the #139 parent epic direction for operational accountability by recording creator attribution on current operational records. No broader audit log, creator display, update attribution, or authorization policy is approved by this issue.

**Maintenance and operational consequences**: Future operational entities that require creator attribution can either repeat explicit fields or justify a dedicated base in a later approved plan. The V3 migration must be applied only after rechecking existing operational table contents in production, as issue #146 states those tables are expected empty.

**Reversibility and migration path**: API contracts remain unchanged. Reversing the persistence change would require a future migration to drop FKs/columns and remove entity/service assignments. Adding creator display or authorization later can reuse the relationship without schema replacement.

**Human approval**: Approved by GitHub issue #146's explicit design constraints and this end-to-end implementation request. The plan does not add a new dependency, framework, persistence strategy, or architecture outside that approved issue scope.

## Semantic Equivalence and Replacement Review

**Review required**: No. This feature does not replace UI primitives, shared components, interaction mechanisms, or API payload mechanisms. It adds server-side persistence attribution while preserving existing client request and response contracts.

**Old behavior/source of truth**: Existing owner, cat, vet, and stay creation DTOs and mappers define creator-free client contracts. Existing service tests and controller tests define creation behavior and HTTP validation. Existing migrations define the operational schema.

**New mechanism semantics**: N/A for replacement review. The added relation is internal persistence state assigned by services and enforced by database constraints.

**Mismatch risks**: API payloads could accidentally expose or require creator fields; update paths could accidentally overwrite creator; stay creation invariants could be disturbed; Flyway/Hibernate mappings could drift.

**Mitigation**: Keep request/response DTOs unchanged, assign creator only in create services, do not update creator in update flows, preserve existing stay validation order, and validate JPA mappings against Flyway schema.

**Proof required**: Contract review/tests showing DTOs remain creator-free; service tests for assignment; persistence tests for required relation; `./mvnw verify`; clean Docker Compose MySQL startup with Flyway.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Owner, cat, vet, and stay creator assignment | Service layer | Unit tests using a mocked current-account resolver and repository captors | Rerun after any service/model changes |
| Required creator relation and invalid creator rejection | JPA/database schema | Data JPA or migration-backed persistence tests plus Flyway MySQL startup | Rerun after entity or migration changes |
| Client request payloads remain creator-free | DTO/controller/API contract | DTO source review and existing controller tests under `./mvnw verify` | Rerun after DTO/mapper/controller changes |
| `UserAccount` has no self creator relation | Model/schema review | Entity and migration review; `./mvnw verify` schema validation | Rerun after model/migration changes |
| `createdAt` and `updatedAt` remain JPA audited | JPA auditing tests and existing application tests | Existing auditing assertions plus full test suite | Rerun after entity/auditing changes |
| Stay protected invariants remain unchanged | Stay service | Existing `StayServiceTest` plus new creator assignment assertion | Rerun after stay service changes |
| Clean MySQL startup with Flyway | Docker Compose app and MySQL | `docker compose` startup of `db` and `app` with a clean project/volume, app logs show successful startup | Manual/environment-dependent; report if Docker unavailable |
| Production empty-table assumption | Operations documentation and deployment check | `docs/OPERATIONS.md` pre-deployment note/query | Must be executed before real deployment, not proven by local tests |

## Project Structure

### Documentation (this feature)

```text
specs/008-creator-attribution/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-creator-attribution.md
└── tasks.md
```

### Source Code (repository root)

```text
src/main/java/com/allegaeon/catworld/model/
├── Owner.java
├── Cat.java
├── Vet.java
├── Stay.java
└── UserAccount.java

src/main/java/com/allegaeon/catworld/service/
├── OwnerService.java
├── CatService.java
├── VetService.java
└── StayService.java

src/main/java/com/allegaeon/catworld/security/
└── CurrentUserAccountService.java

src/main/resources/db/migration/
└── V3__add_creator_attribution.sql

src/test/java/com/allegaeon/catworld/service/
├── OwnerServiceTest.java
├── CatServiceTest.java
├── VetServiceTest.java
└── StayServiceTest.java

src/test/java/com/allegaeon/catworld/repository/
└── OperationalCreatorPersistenceTest.java

docs/
├── ARCHITECTURE.md
├── OPERATIONS.md
└── uml/
    ├── 01-domain-classes.puml
    └── 02-db-schema.puml
```

**Structure Decision**: Use explicit `createdBy` fields on the four operational entities and a focused `CurrentUserAccountService` in the security package to bridge Spring Security authentication to the existing `UserAccountRepository`. Keep DTOs and mappers creator-free except for internal entity assignment. Update architecture and operations source-of-truth documentation only where the new persisted relationship and deployment check would otherwise be stale.

## Complexity Tracking

No constitutionally relevant additional complexity is introduced.

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
| N/A | N/A | N/A | N/A |
