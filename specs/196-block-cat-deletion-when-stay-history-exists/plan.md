# Implementation Plan: Block Cat Deletion When Stay History Exists

**GitHub Issue**: #196
**Parent Coordinator**: #148
**Sidecar Run**: `sidecar-148-7d6b1d4d638a41fc9cd78df9edc10be6`
**Prepared Artifact Path**: `specs/196-block-cat-deletion-when-stay-history-exists/`
**Dependency Layer**: 1; no hard child dependencies

## Summary

Extend the existing cat deletion service with an authorization-first
relationship guard and flush-backed conflict translation. A focused
`StayCatRepository` reports whether any retained link references the cat.
Deletion remains transactional, the existing foreign key remains final
protection, and no link or stay is cascaded away. Cat responses gain a boolean
`canDelete` calculated from both authorization eligibility and relationship
absence.

## Technical Context

- **Runtime**: Java 17, Spring Boot 4.0.2, Spring Data JPA, Spring MVC,
  Spring Security, MySQL, and Flyway.
- **Architecture**: Existing layered monolith: controller → service →
  repository → database, with DTOs and mappers separating HTTP contracts from
  JPA entities.
- **Existing API**: `DELETE /api/cats/{id}` and `ICatService.deleteCat(UUID)`
  already exist and require no production edit.
- **Existing shared behavior**: #147 supplies `DeletionAuthorizationPolicy`;
  #195 supplies the established boolean `canDelete` mapper convention and
  local delete/flush conflict-translation pattern.
- **Persistence**: `stay_cat.cat_id` references `cats.id` through
  `fk_stay_cat_cat` without delete cascade. No migration or mapping change is
  planned.
- **Photo state**: #153 has not landed; no cat-photo entity, table, repository,
  service, or cleanup contract exists in the prepared source.

## Constitution Check

- **I. Domain Focus and Sustainable Evolution**: Compliant. Work is limited to
  the CatWorld cat/stay-history deletion rule and introduces no speculative
  domain abstraction.
- **II. Layered Monolith Responsibilities**: Compliant. The controller remains
  thin and unchanged; `CatService` owns ordering, transaction, and conflict
  translation; `StayCatRepository` owns persistence access; DTO/mapper own the
  response contract.
- **III. Backend and Database Authority**: Compliant. DELETE rechecks all rules
  server-side, while the unchanged FK remains final integrity protection.
  `canDelete` is only a rendering hint.
- **IV. Schema Evolution**: Compliant. No schema change is required. Flyway is
  unchanged, and clean MySQL/Flyway startup remains required validation.
- **V. Protected Stay Model**: Compliant. Stay status, cancellation, overlap
  behavior, stays, and `StayCat` history remain unchanged. Cancelled and
  historical links are deliberately protected.
- **VI. Specification and Planning Discipline**: Compliant. The prepared spec
  fixes ordering, response semantics, persistence boundaries, statuses,
  concurrency handling, exclusions, and validation before implementation.
- **VII. Focused Changes and Proportional Validation**: Compliant. Changes are
  restricted to the cat slice and focused tests cover authorization ordering,
  relationship integrity, HTTP mapping, DTO mapping, and persistence.
- **VIII. Operational Safety and Sources of Truth**: Compliant. No secrets,
  operational data, deployment behavior, or backup contract changes are
  introduced.

No constitution gate or pending human approval blocks implementation.

## Proportional Architecture and Technology Assessment

**Assessment trigger**: The change affects destructive authorization,
persistence integrity, and an API response contract. The assessment is
proportional because it uses approved project mechanisms and introduces no new
framework, dependency, schema, or cross-cutting infrastructure.

### Options considered

1. **Focused `StayCatRepository` existence query plus FK fallback** — explicitly
   checks the protected relationship after authorization, is easy to mock and
   test, avoids initializing full history collections, and preserves the FK as
   protection against races.
2. **Inspect `Cat.stayCats` directly** — avoids a repository file but relies on
   lazy-collection lifecycle behavior and may load more history than needed.
3. **Rely only on the database FK** — preserves integrity but cannot guarantee
   the required authorization-before-relationship ordering or a deliberate,
   stable application conflict path.
4. **Introduce a generic deletion framework or shared relationship helper** —
   disproportionate, collision-prone across siblings, and outside approved
   scope.

**Selected approach**: Option 1, using existing Spring Data/JPA capability and
the existing service-local conflict-translation pattern.

**Why selected**: It is the smallest explicit implementation of #196, keeps
relationship rules outside the shared authorization policy as required by
#147, avoids sibling changes to shared policy/error/security surfaces, and
keeps the database authoritative during concurrency.

**Reversibility**: The focused repository query and DTO field are localized and
can later be replaced without schema migration. No persisted data format
changes.

**Human approval basis**: #148 and #196 explicitly approve the history guard,
status mappings, FK protection, server recheck, and `canDelete` contract. #147
approves the shared authorization policy and requires relationship checks to
remain outside it. #150 approves backend-authoritative `canDelete` for frontend
rendering and stale-hint failure safety. The selected design applies those
approved directions without a material change.

## Implementation Design

### Delete flow

`CatService.deleteCat(UUID)` will be transactional and execute exactly:

1. Resolve the cat with the existing lookup; missing ID throws
   `ResourceNotFoundException` (`404`).
2. Call `DeletionAuthorizationPolicy.authorize(createdBy, createdAt)`; denial
   throws `ForbiddenException` (`403`).
3. Call `StayCatRepository.existsByCat_Id(catId)` only after authorization.
4. If true, throw `ConflictException` (`409`) without deleting anything.
5. Otherwise call `CatRepository.delete(cat)` and `CatRepository.flush()`.
6. Translate `DataIntegrityViolationException` or
   `OptimisticLockingFailureException` from delete/flush to the existing
   `ConflictException`, allowing the transaction to roll back.

No stay-status filter is valid: existence of any link is enough.

### Response flow

Add primitive boolean `canDelete` to `CatResponseDTO`. Mirror the established
stay convention by retaining a one-argument mapper overload that defaults the
hint to false and adding `CatMapper.toResponseDTO(Cat, boolean)`.

Centralize production cat response mapping in `CatService` so list, detail,
create, and update responses calculate:

```text
deletionAuthorizationPolicy.canDelete(cat.createdBy, cat.createdAt)
    && !stayCatRepository.existsByCat_Id(cat.id)
```

Short-circuit authorization denial before querying relationship state. DELETE
does not consume this value and repeats the throwing authorization and
relationship checks.

## Source Map

### Child-owned production files

| File | Planned change |
|---|---|
| `src/main/java/com/allegaeon/catworld/service/CatService.java` | Transactional delete ordering, relationship guard, explicit flush/conflict translation, centralized response hint calculation |
| `src/main/java/com/allegaeon/catworld/dto/CatResponseDTO.java` | Add boolean `canDelete` |
| `src/main/java/com/allegaeon/catworld/mapper/CatMapper.java` | Add boolean mapping overload and preserve default overload |
| `src/main/java/com/allegaeon/catworld/repository/StayCatRepository.java` | New focused `JpaRepository<StayCat, StayCatId>` with `existsByCat_Id(UUID)` |

### Child-owned test files

| File | Planned change |
|---|---|
| `src/test/java/com/allegaeon/catworld/service/CatServiceTest.java` | Authorization ordering, history blocking, successful deletion, flush conflicts, response hint, server recheck |
| `src/test/java/com/allegaeon/catworld/controller/CatControllerTest.java` | DELETE `204/404/403/409` and response `canDelete` serialization |
| `src/test/java/com/allegaeon/catworld/CatMapperTest.java` | New mapping coverage for true/false hint |
| `src/test/java/com/allegaeon/catworld/repository/CatDeletionPersistenceTest.java` | New success and FK/history preservation coverage, including cancelled/historical links |

### Existing production files intentionally unchanged

- `CatController.java` and `ICatService.java`: endpoint and signature already
  satisfy the API surface.
- `DeletionAuthorizationPolicy.java`, security configuration,
  `GlobalExceptionHandler.java`, and exception classes: established shared
  contract is sufficient.
- `Cat.java`, `Stay.java`, `StayCat.java`, and Flyway migrations: mappings and
  FK already protect the required history.
- All stay, owner, vet, application-account, frontend, and documentation files.

## Conflict and Dependency Review

- Layer 1; no hard dependency on #197 or #198.
- A new `StayCatRepository` keeps #196 out of `CatRepository`, which siblings
  may need for owner/vet reference queries.
- Shared policy, handler, migration, entity, and documentation edits are
  prohibited by this prepared scope, avoiding non-mechanical sibling conflicts.
- The child must stop if implementation would require redefining the shared
  `canDelete`, error, authorization, persistence, or test contract.

## Validation Evidence Plan

| Requirement | Evidence |
|---|---|
| Lookup → authorization → relationship ordering | Mockito `InOrder` service tests and verification that denial never calls `existsByCat_Id` |
| Successful authorized deletion | Service test verifies delete and explicit flush |
| Any history blocks | Service tests for generic, cancelled, and historical relationships |
| Race/integrity conflict is `409` | Service tests for both translated exception types and MVC `ConflictException` mapping |
| FK remains final guard | JPA persistence test preserves cat/stay/link after referenced-cat delete failure |
| `canDelete` semantics | Service tests for authorization and history matrix; mapper test; controller serialization |
| Rendering-only hint | Service test proves DELETE repeats policy and repository checks independently |
| Full backend regression | `./mvnw verify` |
| Real schema/runtime compatibility | Clean MySQL startup with Flyway through Docker Compose, serialized by the coordinator |
| Scope containment | Changed-file review confirms only the declared source map and prepared artifacts |

Docker validation must not run concurrently with sibling Docker validation. The
coordinator grants the serialized Docker slot and records the current result.

## Risks and Mitigations

- **Concurrent link insertion**: Explicit flush plus FK and local exception
  translation produces a rollback and `409`.
- **History filtering error**: The repository query has no stay status/date
  predicate; tests include cancelled and historical links.
- **Stale hint**: DELETE repeats all checks and never accepts `canDelete` input.
- **N+1 response checks**: The existence query is intentionally focused and
  bounded to the approved correctness scope; no speculative bulk framework is
  introduced. A future measured optimization can replace it locally.
- **Sibling collisions**: Do not edit shared policy, handler, `CatRepository`,
  migrations, entities, docs, or sibling services.

## Readiness

The issue scope, shared contract, dependency layer, source map, and validation
requirements are resolved. There is no child-specific, coordinator-wide,
shared-contract, conflict, or human-only blocker in this prepared plan.
