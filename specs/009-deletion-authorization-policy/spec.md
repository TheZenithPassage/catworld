# Feature Specification: Shared Deletion Authorization Policy

**Feature Branch**: `009-deletion-authorization-policy`

**Created**: 2026-07-05

**Input**: User description: "Issue #147: [Backend] Implement the shared deletion authorization policy"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Backend deletion authorization is centralized in one reusable policy for operational records.
  - **Why this priority**: Deletion authorization affects security-sensitive operational records and must not be copied into each entity service.
  - **Acceptance Scenarios**:
    1. **Given** an `ADMIN` requests deletion of an operational record, **When** the shared deletion authorization policy evaluates the record, **Then** authorization succeeds regardless of creator identity or record age.
    2. **Given** a `STAFF` account requests deletion of a record it created less than 15 minutes ago, **When** the policy evaluates the record using server time, **Then** authorization succeeds.
    3. **Given** a `STAFF` account requests deletion of a record created by another account, **When** the policy evaluates the record, **Then** authorization fails and deletion flows map that failure to `403 Forbidden`.
    4. **Given** a `STAFF` account requests deletion of its own record when `createdAt + 15 minutes` is equal to or before the current server time, **When** the policy evaluates the record, **Then** authorization fails and deletion flows map that failure to `403 Forbidden`.
  - **Validation Evidence**: Parameterized backend tests cover the role, creator, age, and exact-boundary matrix; `./mvnw verify` passes.

- **TO-002**: The policy uses deterministic server-side time and keeps deletion-specific entity relationship and state checks outside the shared authorization decision.
  - **Why this priority**: The feature explicitly requires a deterministic time source while preserving existing entity integrity responsibilities.
  - **Acceptance Scenarios**:
    1. **Given** tests set a fixed server time source, **When** the policy evaluates records around the 15-minute boundary, **Then** results are deterministic and do not depend on wall-clock test timing.
    2. **Given** a deletion flow has entity relationship or state checks in scope, **When** the shared policy is used, **Then** those checks remain separate from the role, creator, and age authorization matrix.
  - **Validation Evidence**: Backend unit or service tests demonstrate deterministic time behavior and the absence of duplicated authorization matrices in deletion flows touched by this feature.

### Edge Cases

- A `STAFF` user attempting to delete its own record at exactly 15 minutes after creation is denied because the allowed window requires `createdAt + 15 minutes` to be strictly after current server time.
- A `STAFF` user attempting to delete its own record after the 15-minute boundary is denied.
- A `STAFF` user attempting to delete another creator's record is denied even inside the 15-minute window.
- An `ADMIN` user is allowed even when the record belongs to a different creator or is older than 15 minutes.
- Deletion authorization failure is exposed to clients as `403 Forbidden`; entity-not-found, relationship, and state failures keep their existing responsible checks and mappings.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Role | Creator Match? | Record Age Relative to Server Time | Policy Result | Deletion Flow Failure Mapping | Notes |
|------|----------------|-------------------------------------|---------------|-------------------------------|-------|
| `ADMIN` | Any | Any | Authorized | N/A | Admin authorization ignores creator and age. |
| `STAFF` | Own record | `createdAt + 15 minutes` strictly after current time | Authorized | N/A | The record is inside the allowed deletion window. |
| `STAFF` | Different creator | Any | Denied | `403 Forbidden` | Creator ownership is required for staff. |
| `STAFF` | Own record | `createdAt + 15 minutes` equal to current time | Denied | `403 Forbidden` | Equality at 15 minutes is explicitly forbidden. |
| `STAFF` | Own record | `createdAt + 15 minutes` before current time | Denied | `403 Forbidden` | Expired records are outside the allowed deletion window. |

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Backend code MUST provide one reusable deletion authorization policy for operational records that centralizes role, creator, and age checks.
- **TR-002**: The policy MUST authorize `ADMIN` accounts regardless of creator identity and record age.
- **TR-003**: The policy MUST authorize `STAFF` accounts only when the record creator is the requesting account and `createdAt + 15 minutes` is strictly after the current server time.
- **TR-004**: The policy MUST deny `STAFF` deletion authorization at exactly the 15-minute boundary.
- **TR-005**: Deletion authorization failures in deletion flows that use the policy MUST map to `403 Forbidden`.
- **TR-006**: The policy MUST use `Clock` or an equivalent deterministic server-side time source.
- **TR-007**: Controllers MUST remain thin by delegating deletion authorization decisions to backend services or policies instead of duplicating the matrix in controller methods.
- **TR-008**: Entity relationship checks and entity state checks MUST remain outside the shared deletion authorization policy.
- **TR-009**: Angular MUST NOT calculate or enforce this deletion authorization policy.
- **TR-010**: Parameterized backend tests MUST cover `ADMIN`, eligible own `STAFF` records, different creators, expired records, and the exact 15-minute boundary.
- **TR-011**: Validation MUST include `./mvnw verify`.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: The dependency on issue #146 creator attribution must be satisfied before implementation continues.

### Out of Scope

- Entity integrity checks beyond preserving their existing separation from authorization.
- Frontend action visibility or client-side deletion-window enforcement.
- Configurable deletion windows.
- Creator display, audit history, `updatedBy`, or other attribution features outside deletion authorization.
- New persistence schema changes unless planning discovers that the #146 creator attribution contract is absent from current `origin/main`.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **UserAccount**: The authenticated backend account requesting deletion; includes role information used by authorization.
- **Operational Record**: A deletable backend domain record with a persisted creator and creation timestamp.
- **Creator**: The `UserAccount` that created an operational record; staff deletion authorization depends on this relationship.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Backend deletion authorization has a single reusable policy that implements the `ADMIN` and `STAFF` matrix from issue #147.
- **SC-002**: Parameterized backend tests pass for all required role, creator, expiration, and exact-boundary cases.
- **SC-003**: Deletion authorization failure is observable as `403 Forbidden` in deletion flows that use the policy.
- **SC-004**: Running `./mvnw verify` completes successfully after implementation.

## Assumptions

- Issue #146 is the intended source of persisted creator attribution for operational records and is closed as completed before this feature implementation starts.
- Existing authentication and role modeling remain the source of truth for `ADMIN` and `STAFF`; this feature does not rename or redefine roles.
