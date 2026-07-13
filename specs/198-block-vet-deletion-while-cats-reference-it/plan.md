# Implementation Plan: Safe Vet Deletion

**Parent Coordinator**: #148
**Child Issue**: #198
**Sidecar Run**: `sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6`
**Dependency Layer**: 1
**Spec**: [spec.md](./spec.md)

## Summary

Align the existing vet DELETE flow with the coordinator's safe-deletion
contract. Reuse the shared #147 authorization policy, add a vet-local derived
repository check for cat references, force deletion to flush within the
service transaction so concurrent database failures can be translated to
`409`, and expose `canDelete` as authorization eligibility combined with the
absence of cat references. No new dependency, schema change, shared helper, or
frontend behavior is introduced.

## Technical Context

- Java 17, Spring Boot, Spring Web, Spring Data JPA, MySQL, Flyway.
- Existing layered monolith: controller -> service -> repository -> database.
- Existing `DELETE /api/vets/{id}`, service interface method, shared deletion
  authorization policy, `ResourceNotFoundException`, `ForbiddenException`,
  `ConflictException`, and global HTTP mappings.
- Existing nullable `Cat.vet` relation and `cats.vet_id` foreign key without
  delete cascade.
- JUnit 5, Mockito, Spring MVC slice tests, and JPA persistence tests.

## Constitution Check

- **I. Domain Focus and Sustainable Evolution**: Compliant. The change is
  limited to the confirmed CatWorld vet/cat relationship and introduces no
  generic deletion framework.
- **II. Layered Monolith Responsibilities**: Compliant. HTTP behavior remains
  in the controller, orchestration and transaction behavior in `VetService`,
  relationship lookup in `VetRepository`, and final integrity in the database.
- **III. Backend and Database Authority**: Compliant. Backend code rechecks all
  rules on DELETE; `canDelete` is advisory; the FK is the final guard.
- **IV. Schema Evolution**: Compliant. The required nullable vet relationship
  and FK already exist. No migration is planned.
- **V. Protected Stay Model**: Compliant. Stay deletion, cancellation, status,
  and stay invariants are untouched.
- **VI. Specification and Planning Discipline**: Compliant. Error precedence,
  relationship behavior, race handling, response semantics, source map, and
  validation are resolved before implementation.
- **VII. Focused Changes and Proportional Validation**: Compliant. The source
  map is vet-focused and includes service, API, mapper, and FK evidence.
- **VIII. Operational Safety and Sources of Truth**: Compliant. No credentials,
  production data, deployment behavior, or operational configuration changes.

## Architecture and Technology Assessment

**Assessment level**: Minor but required because the work affects a persisted
relationship, an authorization-sensitive delete operation, and an API response
contract.

### Options Considered

1. **Existing layered/JPA pattern with a vet-local derived query (selected)**
   - Add `VetRepository.existsByIdAndCatsIsNotEmpty(UUID id)`.
   - Perform lookup, shared authorization, relationship check, delete, and
     flush in `VetService` under `@Transactional`.
   - Reuse existing application exceptions and global mappings.
   - Fit: smallest change, explicit SQL-backed relationship check, preserves
     the DB race guard, and keeps child source ownership isolated.
2. **Add a query to shared `CatRepository`**
   - Functionally possible, but #197 also needs cat relationship checks and
     parallel children would collide on a shared repository surface.
   - Rejected for this prepared child contract.
3. **Inspect the lazy `Vet.cats` collection directly**
   - Avoids a repository method but makes query behavior implicit and couples
     correctness to persistence-context/lazy-loading details.
   - Rejected in favor of an explicit repository existence query.
4. **Create a generic deletion/relationship framework or new dependency**
   - Disproportionate for one entity-specific check and conflicts with the
     focused-change principle.
   - Rejected.

### Selected Approach and Approval

Use option 1. Approval is grounded in #147's approved shared authorization
policy, #148's approved coordinator contract, #198's explicit vet-specific
relationship and error requirements, and #150's requirement that frontend
rendering consume authoritative backend `canDelete` without recreating backend
policy. The established stay delete/flush conflict-translation implementation
is a still-applicable project precedent. No unresolved architecture or
technology approval remains.

### Reversibility and Cost

The repository method, service checks, and DTO/mapper field are local and can
be changed through a future API contract revision. There is no data migration,
new dependency, or operational service to unwind. The list response performs a
simple existence query per vet; optimization is outside confirmed scope and
must not broaden this child into shared query infrastructure.

## Detailed Design

### DELETE Flow

1. `VetController` continues delegating `DELETE /api/vets/{id}` to
   `IVetService.deleteVet(UUID)` and returning `204`.
2. `VetService` loads the vet or throws `ResourceNotFoundException` (`404`).
3. `DeletionAuthorizationPolicy.authorize(createdBy, createdAt)` runs before
   any relationship query and may throw `ForbiddenException` (`403`).
4. `VetRepository.existsByIdAndCatsIsNotEmpty(id)` detects any cat reference;
   a positive result throws `ConflictException` (`409`).
5. In the same transaction, the service calls `delete(vet)` then `flush()`.
6. `DataIntegrityViolationException` and
   `OptimisticLockingFailureException` are caught locally and translated to a
   vet-specific `ConflictException` (`409`).

### Response Mapping

- Add primitive boolean `canDelete` to `VetResponseDTO`.
- Add `VetMapper.toResponseDTO(Vet, boolean)` and retain a conventional
  non-boolean overload defaulting to `false` if useful for local compatibility.
- Route list, detail, create, and update responses through one private
  `VetService` response helper.
- The helper calculates:

  `deletionAuthorizationPolicy.canDelete(vet.createdBy, vet.createdAt)`
  AND `!vetRepository.existsByIdAndCatsIsNotEmpty(vet.id)`.

- DELETE never accepts or consumes `canDelete` from the client.

### Persistence

- Preserve `Cat.vet`, `Vet.cats`, and Flyway V1 unchanged.
- The explicit repository check gives a useful conflict before deletion.
- Delete/flush and the existing FK cover a concurrent reference inserted after
  the check.

## Source Map

### Planned Production Changes

- `src/main/java/com/allegaeon/catworld/service/VetService.java`
- `src/main/java/com/allegaeon/catworld/repository/VetRepository.java`
- `src/main/java/com/allegaeon/catworld/dto/VetResponseDTO.java`
- `src/main/java/com/allegaeon/catworld/mapper/VetMapper.java`

### Planned Test Changes

- `src/test/java/com/allegaeon/catworld/service/VetServiceTest.java`
- `src/test/java/com/allegaeon/catworld/controller/VetControllerTest.java`
- `src/test/java/com/allegaeon/catworld/VetMapperTest.java` (new)
- `src/test/java/com/allegaeon/catworld/repository/VetDeletionPersistenceTest.java` (new)

### Verify Without Production Change

- `src/main/java/com/allegaeon/catworld/controller/VetController.java`
- `src/main/java/com/allegaeon/catworld/service/IVetService.java`

### Prohibited/Out-of-Scope Changes

- `CatRepository`, `DeletionAuthorizationPolicy`, security configuration,
  `GlobalExceptionHandler`, migrations, entities, stay code, frontend code,
  documentation, and sibling child artifacts.

## Dependency and Conflict Plan

- Layer 1; no hard dependency on #196 or #197.
- #147 and #195 behavior is already integrated in the coordinator base.
- The vet-local `VetRepository` query deliberately avoids the shared
  `CatRepository` collision with sibling work.
- No shared contract needs to be invented. If implementation cannot satisfy
  the derived query using existing JPA mappings, stop and report a blocker
  rather than changing a shared repository, entity, or migration.

## Validation Evidence Plan

| Requirement | Responsible evidence | Expected result |
|-------------|----------------------|-----------------|
| Lookup before policy and `404` | `VetServiceTest`, `VetControllerTest` | Missing vet is `404`; no later checks |
| Authorization before relationship exposure | `VetServiceTest` ordered verification | Denial is `403`; relationship query/delete not invoked |
| Referenced vet blocked | Service and persistence tests | `409`; vet and cat preserved |
| Authorized unreferenced deletion | Service/controller/persistence tests | Delete + flush; `204`; vet removed |
| Concurrent constraint translation | Service tests for both Spring exceptions | Local `ConflictException`; `409` |
| Full-rule `canDelete` | Service, mapper, controller tests | True only for authorized + unreferenced |
| FK and Flyway remain authoritative | Persistence test plus clean MySQL startup | Existing schema blocks invalid delete |
| Focus and no shared drift | Changed-path review | Only planned source/test files |
| Backend regression | `./mvnw verify` | Passed |

Docker startup is a shared runtime resource and MUST be serialized by the
coordinator. The child records it as coordinator-owned/not run locally rather
than starting a competing stack during parallel execution.

## Risks and Mitigations

- **Check/delete race**: mitigated by transactional delete/flush, the FK, and
  local exception translation.
- **Authorization information leak**: mitigated by authorizing before the
  relationship query.
- **Stale rendering hint**: mitigated by full server-side DELETE revalidation.
- **Parallel source collision**: mitigated by the VetRepository-local query and
  explicit prohibition on shared CatRepository changes.
- **Lazy association behavior**: avoided by explicit derived repository query.

## Completion Gate

Implementation is complete only when all child-owned tests and `./mvnw verify`
pass, the changed paths match this source map, and coordinator-serialized clean
MySQL/Flyway startup later passes. Any non-passed validation must retain its
explicit status and must not be summarized as passed.
