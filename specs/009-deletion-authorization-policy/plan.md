# Implementation Plan: Shared Deletion Authorization Policy

**Branch**: `feat/147-shared-deletion-authorization-policy` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-deletion-authorization-policy/spec.md`

## Summary

Implement a shared backend deletion authorization policy for operational records that allows `ADMIN` deletion regardless of creator or age, allows `STAFF` deletion only for their own records before the strict 15-minute boundary, and maps authorization denial to `403 Forbidden`. The approach follows issue #147's approved technical direction: keep enforcement server-side, use a deterministic time source, keep controllers thin, and leave relationship/state checks outside the policy.

## Technical Context

**Language/Version**: Java 17 backend with Spring Boot 4.0.2; Angular frontend is present but out of scope for enforcement.

**Primary Dependencies**: Spring Web, Spring Security, Spring Data JPA, Flyway, Lombok, JUnit 5, Mockito, Spring MVC test support, H2 for tests.

**Storage**: No new schema or migration expected. The policy uses existing `AuditableEntity.createdAt` (`Instant`) and existing operational `createdBy` relations to `UserAccount` introduced by issue #146.

**Testing**: Maven backend validation with `./mvnw verify`; focused JUnit 5/Mockito service or policy tests; Spring MVC controller tests where HTTP `403 Forbidden` mapping needs API evidence.

**Target Platform**: Spring Boot API runtime backed by MySQL; local and CI backend validation through Maven.

**Project Type**: CatWorld full-stack web administration system with backend layered monolith and Angular administration frontend.

**Performance Goals**: N/A; no performance target is specified or needed for this small authorization check.

**Constraints**: Backend must be authoritative; Angular must not calculate or enforce the deletion policy; the 15-minute window is fixed for this feature and not configurable; equality at exactly 15 minutes is forbidden; controllers must stay thin; entity relationship and state checks remain separate.

**Scale/Scope**: Current implementation scope covers existing operational delete flows for owners, cats, and vets. The policy should also be reusable for future operational records that expose creator and created-at data, including stay deletion if a future approved feature adds it.

## Constitution Check

*GATE 1: Before Phase 0 research, identify applicable constitution principles, assessment triggers, and unresolved decisions. Phase 0 MAY research alternatives needed to complete a required assessment.*

*GATE 2: Before decision-dependent Phase 1 design and before implementation task generation, every required architecture and technology assessment MUST be completed and human-approved. Re-check full constitution compliance after Phase 1 design.*

- **Domain focus and sustainable evolution**: Compliant. The policy is limited to CatWorld operational records and does not introduce cross-species, multi-tenant, or platform abstractions.
- **Layered monolith responsibilities**: Compliant. Controllers continue delegating to services; services enforce delete use cases; the reusable policy owns the shared authorization matrix; repositories remain persistence-only.
- **Backend and database authority**: Compliant. Authorization is enforced in backend services/policy, not in Angular. No database constraint can express the authenticated-user/time-window policy.
- **Schema evolution**: Compliant. No schema change is planned; existing creator attribution from #146 is used.
- **Protected stay model**: Compliant. The feature does not change stay status derivation or stay invariants. Stay cancellation remains separate from deletion authorization.
- **Specification and planning discipline**: Compliant. The spec defines the role/creator/age matrix, edge cases, exact boundary, out-of-scope checks, and validation evidence.
- **Architecture and technology assessment**: Required because this is a shared, correctness-sensitive authorization/security capability. Assessment is completed below and uses issue #147's explicit technical direction as human-approved scope.
- **Focused changes and proportional validation**: Compliant. Changes are limited to backend policy/enforcement, tests, and source-of-truth documentation; validation focuses on service/policy matrix and HTTP 403 behavior.
- **Operational safety and sources of truth**: Compliant. No secrets or operational data are touched. Architecture documentation should be updated because implemented authorization behavior changes.

## Architecture and Technology Assessment

**Assessment required**: Yes. The feature introduces a shared backend authorization policy for security-sensitive deletion decisions.

**Decision trigger**: Significant shared capability; material security decision; correctness-sensitive authorization responsibility.

**Options considered**:

- Existing platform/framework/project capability: Spring Security request authorization already protects authenticated API access and `ADMIN`-only user management, but URL/role rules cannot express per-record creator and `createdAt` window checks without pushing record lookup logic into controllers or repeated service code.
- Established library/framework/service: A new authorization framework or external policy engine would be disproportionate for a fixed two-role, one-window matrix, would add dependency and operational cost, and is not requested by the issue.
- Focused custom implementation: A Spring-managed backend policy using existing `UserAccount`, `UserRole`, `createdBy`, `createdAt`, `CurrentUserAccountService`, and Java `Clock` directly fits the approved issue requirements with no new dependency.

**Selected approach**: Focused custom backend policy in the service layer, backed by an injectable `Clock`, invoked by operational delete services before repository deletion. Authorization denial uses the repository's exception handling path to return `403 Forbidden`.

**Why selected**: It exactly matches issue #147's technical direction, preserves the layered monolith, avoids duplicating the matrix in each service, keeps controllers thin, avoids Angular enforcement, and is easy to test at the policy and service/API layers.

**Confirmed medium-term use**: Existing owner, cat, and vet deletion flows; future operational-record deletion flows that use `createdBy` and `createdAt` from the #146 creator attribution model.

**Maintenance and operational consequences**: The backend owns a small shared policy and a production `Clock` bean. Tests must cover the exact 15-minute boundary whenever the policy changes. No new external dependency, storage mechanism, or operational service is introduced.

**Reversibility and migration path**: The policy is isolated behind one Spring component and can be replaced by a broader authorization mechanism later with localized service call updates. The deletion window remains a constant for this feature; making it configurable is explicitly out of scope and would require a future plan.

**Human approval**: Approved by issue #147's explicit technical direction: "Create one reusable backend policy", "Inject `Clock` or an equivalent deterministic time source", "Keep controllers thin", "Do not duplicate the matrix", and "Do not let Angular calculate or enforce the policy." This plan implements that approved direction without a material approach change.

## Semantic Equivalence and Replacement Review

**Review required**: No. The feature does not replace UI primitives, shared components, persistence mechanisms, API serialization mechanisms, or interaction mechanisms.

**Old behavior/source of truth**: Existing owner, cat, and vet delete endpoints delete after entity lookup. Existing controllers remain the HTTP contract source; existing services remain the delete use-case source.

**New mechanism semantics**: N/A for replacement review. The feature adds authorization before existing repository deletion.

**Mismatch risks**: N/A for replacement review. The key behavior risk is authorization correctness, covered by the validation evidence plan.

**Mitigation**: N/A for replacement review.

**Proof required**: N/A for replacement review.

## Validation Evidence Plan

| Surface / Requirement | Responsible Layer | Evidence Type | Freshness / Manual Notes |
|-----------------------|-------------------|---------------|--------------------------|
| Role, creator, age, and exact-boundary authorization matrix | Shared backend policy | Parameterized JUnit tests with fixed `Clock` | Rerun after policy or time-window changes |
| Owner, cat, and vet delete flows invoke the policy before deletion | Service layer | Mockito service tests verifying authorized delete and denied delete behavior | Rerun after service delete-flow changes |
| Authorization denial maps to `403 Forbidden` | Controller/API exception handling | Spring MVC controller or exception-handler tests | Rerun after exception handling or controller changes |
| Entity relationship and state checks remain outside the policy | Service/policy review | Code review plus focused tests proving policy inputs are only creator and creation time | Re-check in scope-drift review |
| Angular does not enforce the policy | Frontend/source review | `git diff --name-only` and search confirming frontend unchanged for policy logic | Re-check before final report |
| No schema or migration change introduced | Persistence/source review | Changed-file review and `./mvnw verify` | Re-check before final report |
| Source-of-truth documentation reflects the backend policy | Documentation review | Updated architecture documentation reviewed with diff | Re-check before final report |

## Project Structure

### Documentation (this feature)

```text
specs/009-deletion-authorization-policy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-deletion-authorization.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/main/java/com/allegaeon/catworld/config/
src/main/java/com/allegaeon/catworld/exception/
src/main/java/com/allegaeon/catworld/service/
src/test/java/com/allegaeon/catworld/controller/
src/test/java/com/allegaeon/catworld/service/
docs/ARCHITECTURE.md
```

**Structure Decision**: Keep the reusable deletion authorization policy in the backend service layer because it expresses service-use-case authorization rather than HTTP routing, persistence, or frontend presentation. Add a small config bean for deterministic production time if needed, add/extend application exception handling for `403 Forbidden`, wire owner/cat/vet services to call the policy before deletion, and add tests at policy/service/API layers.

## Complexity Tracking

No constitution-relevant complexity exceptions are required.

| Complexity | Why Needed | Simpler Alternative Rejected Because | Constitution Compliance |
|------------|------------|-------------------------------------|-------------------------|
| N/A | N/A | N/A | N/A |
