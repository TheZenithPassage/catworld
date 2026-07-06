# Implementation Plan: Safe Stay Deletion

**Branch**: `feat/195-add-safe-permanent-deletion-for-stays` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-safe-stay-deletion/spec.md`

## Summary

Add authenticated permanent deletion for stays while preserving cancellation as a separate lifecycle action. The implementation will add a stay DELETE API path, enforce the completed #147 deletion authorization policy server-side before deletion, remove only the stay and its owned `StayCat` links through the existing stay aggregate mapping, translate stay-specific delete conflicts to `409 Conflict`, and expose a calculated `canDelete` rendering hint on stay responses without trusting it for enforcement.

## Technical Context

**Language/Version**: Java 17 backend with Spring Boot 4.0.2. Angular frontend exists but deletion UI is out of scope.

**Primary Dependencies**: Spring Web, Spring Security, Spring Data JPA, Flyway, Lombok, MySQL connector, JUnit 5, Mockito, Spring Security Test, Spring MVC test support, H2 for tests.

**Storage**: Existing MySQL/JPA persistence. No new schema or migration is planned. `Stay` already has `createdBy`, `createdAt`, `owner`, and `stayCats` with `cascade = CascadeType.ALL` and `orphanRemoval = true`; `StayCat` remains the owned link entity removed with the stay.

**Testing**: Maven backend validation with `./mvnw verify`; focused JUnit 5/Mockito service tests; Spring MVC controller tests; JPA persistence test evidence for stay and `StayCat` deletion behavior; Docker Compose/MySQL startup with Flyway for schema validation.

**Target Platform**: Spring Boot API runtime backed by MySQL; local development and CI backend validation through Maven; Docker Compose for clean MySQL startup.

**Project Type**: CatWorld full-stack web administration system with a layered Spring Boot monolith backend and Angular administration frontend.

**Performance Goals**: N/A; no performance target is specified or needed for this single-record deletion flow.

**Constraints**: Backend must be authoritative for authorization and conflict handling; `canDelete` is a rendering hint only; cancellation behavior remains unchanged; dynamic stay status must not block hard deletion; delete scope is limited to the stay and owned `StayCat` links; no cat, owner, vet, application-account, frontend deletion UI, soft-delete, restore, or broad shared-infrastructure work is in scope.

**Scale/Scope**: One stay deletion flow, one response-contract addition (`canDelete`) for stay responses, and tests/documentation proportional to backend authorization, API contract, and persistence risk.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The feature is limited to cat-boarding stay records and does not introduce cross-species, multi-tenant, platform, or deployment assumptions.
- **Layered monolith responsibilities**: Compliant. The controller will expose the HTTP DELETE contract, the service will own authorization, transactions and conflict translation, the repository will remain persistence access, and DTO/mapper code will keep API responses separate from entities.
- **Backend and database authority**: Compliant. The #147 policy is enforced by the backend on every DELETE request. `canDelete` is calculated by the backend but is not trusted for enforcement.
- **Schema evolution**: Compliant. No schema change is planned; Flyway remains the schema mechanism and clean MySQL/Flyway startup is validation evidence.
- **Protected stay model**: Compliant. Stay status remains derived from dates and cancellation data. Core stay creation/update invariants and cancellation semantics are preserved; permanent deletion is a separate operation.
- **Specification and planning discipline**: Compliant. The spec defines observable API behavior, authorization matrix, status-code behavior, persistence effects, edge cases, exclusions and validation evidence.
- **Architecture and technology assessment**: Required because the feature adds security-sensitive stay deletion, a response-contract field, and deletion persistence behavior. Assessment is completed below and references issue #195 plus the completed #147 policy as approved direction.
- **Focused changes and proportional validation**: Compliant. Changes stay in the stay delete flow plus the narrow policy boolean needed to calculate `canDelete`; validation covers service authorization/deletion, controller status mapping, response contract, persistence and Flyway startup.
- **Operational safety and sources of truth**: Compliant. No secrets or real operational data are touched. Architecture documentation should be updated if the implemented source-of-truth stay behavior changes.

## Architecture and Technology Assessment

**Assessment required**: Yes. The feature introduces a security-sensitive hard-delete operation for stays, exposes a new API response field, and relies on persistence cascade/orphan behavior to remove owned links only.

**Decision trigger**: Material security decision; material shared-contract decision; correctness-sensitive persistence behavior.

**Options considered**:

- Existing platform/framework/project capability: Use the established Spring MVC controller -> service -> repository flow, existing #147 `DeletionAuthorizationPolicy`, existing `ForbiddenException`/`ConflictException` mappings, current DTO/mapper conventions, and JPA aggregate mapping for `Stay.stayCats`. This fits the confirmed scope without new dependencies.
- Established library/framework/service: A new authorization framework, external policy engine, or deletion workflow library would be disproportionate for applying an already completed fixed policy to one entity flow, would add operational and maintenance cost, and is not requested.
- Focused custom implementation: Add stay-specific service/controller methods and a narrow non-throwing policy calculation method for `canDelete`, while keeping enforcement in the existing throwing authorization method. This is small and reversible, but must be tested carefully to avoid duplicating the authorization matrix incorrectly.

**Selected approach**: Use existing project capabilities. Add `DELETE /api/stays/{id}` in `StayController`, add `deleteStay(UUID)` in `IStayService`/`StayService`, call #147 `DeletionAuthorizationPolicy.authorize(stay.getCreatedBy(), stay.getCreatedAt())` before repository deletion, add a non-throwing `canDelete` calculation to the same policy for response rendering, and set `canDelete` on stay DTOs from the service layer.

**Why selected**: It directly implements issue #195 and reuses the completed #147 decision. It preserves the layered monolith, keeps controllers thin, avoids frontend enforcement, avoids schema changes, and prevents divergent authorization logic between `canDelete` and DELETE.

**Confirmed medium-term use**: Current issue #195 stay deletion flow and frontend rendering of stay actions through the `canDelete` response hint. Broader entity deletion rules remain out of scope.

**Maintenance and operational consequences**: The shared policy gains one boolean calculation method that must remain covered by the existing parameterized matrix. Stay deletion must continue to prove owned-link deletion and unrelated-record preservation. No new dependency or external service is introduced.

**Reversibility and migration path**: The DELETE endpoint and DTO field can be changed or removed in a future contract migration. The policy boolean can be replaced by a richer authorization result later with localized service/mapper updates. The persistence behavior remains governed by existing JPA relationships and Flyway schema.

**Human approval**: Approved by issue #195's explicit scope to add stay deletion, apply #147, expose `canDelete`, and preserve deletion/cancellation boundaries. The authorization-policy approach is also approved by completed issue #147. This plan applies those approved decisions without a material approach change.

## Semantic Equivalence and Replacement Review

**Review required**: No. The feature adds a new stay deletion operation and response field; it does not replace UI primitives, shared components, interaction mechanisms, persistence mechanisms, or API serialization mechanisms.

**Old behavior/source of truth**: Stays currently support create, update, read and cancellation. Cancellation changes `cancelledAt`; dynamic status is derived from dates and cancellation. Existing owner/cat/vet deletion demonstrates the #147 policy integration pattern.

**New mechanism semantics**: N/A for replacement review. The new API operation is permanent deletion, not a replacement for cancellation.

**Mismatch risks**: N/A for replacement review. The key risks are authorization correctness, delete/cancel confusion, API status mapping, and persistence side effects; these are covered in the validation evidence plan.

**Mitigation**: N/A for replacement review.

**Proof required**: N/A for replacement review.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| `ADMIN` and eligible own recent `STAFF` stay deletion | Service layer | Mockito service tests verifying policy call before repository deletion | Rerun after stay service or policy changes |
| Ineligible `STAFF` authorization denial | Service layer and controller/API | Service test proving no repository deletion; MVC test proving `403 Forbidden` | Rerun after authorization or exception handling changes |
| Missing stay returns `404` | Controller/API | MVC test via `ResourceNotFoundException` mapping | Rerun after controller or exception mapping changes |
| Integrity/concurrent conflict maps to `409` | Service layer and controller/API | Service test for delete conflict translation plus MVC test for `ConflictException` mapping | Rerun after delete or exception mapping changes |
| Dynamic stay status does not block deletion | Service layer | Parameterized or focused service tests for cancelled, reserved, checked-in and checked-out stays | Rerun after status/cancellation/delete changes |
| Delete removes only stay and owned `StayCat` links | Persistence layer | JPA persistence test using H2/MySQL-mode plus clean MySQL/Flyway startup | Rerun after entity mapping or migration changes |
| `canDelete` appears on stay responses and follows #147 matrix | Policy, service/mapper, controller/API contract | Policy tests for boolean calculation; mapper/service/controller tests for serialized field | Rerun after DTO/mapper/policy changes |
| Cancellation remains distinct and unchanged | Service/API regression tests | Existing cancel tests plus review that delete path does not set `cancelledAt` | Rerun after stay service changes |
| No frontend deletion UI or unrelated entity deletion changes | Source review | `git diff --name-only`, scoped diff review, and search as needed | Re-check before final report |
| Required full validation | Build/runtime | `./mvnw verify`; clean Docker Compose MySQL/Flyway startup | Rerun after late relevant changes or report as not revalidated |

## Project Structure

### Documentation (this feature)

```text
specs/010-safe-stay-deletion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-stay-deletion.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/main/java/com/allegaeon/catworld/controller/
src/main/java/com/allegaeon/catworld/dto/
src/main/java/com/allegaeon/catworld/mapper/
src/main/java/com/allegaeon/catworld/service/
src/test/java/com/allegaeon/catworld/controller/
src/test/java/com/allegaeon/catworld/repository/
src/test/java/com/allegaeon/catworld/service/
docs/ARCHITECTURE.md
```

**Structure Decision**: Keep the stay delete use case in the existing backend layered monolith. Extend the shared deletion policy only enough to expose the same matrix as a boolean for response rendering. Keep `canDelete` calculation in backend service flow and DTO response mapping, not in Angular. Use existing repository/entity mapping for stay and owned `StayCat` deletion; do not add migrations unless implementation discovers a schema mismatch that blocks the approved behavior.

## Complexity Tracking

No constitution-relevant complexity exceptions are required.

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
| N/A | N/A | N/A | N/A |
