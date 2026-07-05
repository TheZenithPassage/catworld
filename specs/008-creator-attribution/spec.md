# Feature Specification: Creator Attribution for Operational Records

**Feature Branch**: `feat/146-attribute-operational-records-to-their-creator`

**Created**: 2026-07-05

**Input**: User description: "Issue #146: [Backend] Attribute operational records to their creator. Persist the authenticated application account that created each operational record. Add a required creator relation from `Owner`, `Cat`, `Vet` and `Stay` to `UserAccount`. Assign the authenticated account during creation. Add the Flyway migration and foreign keys. Keep creator data server-controlled and absent from client request payloads. Keep `createdAt` and `updatedAt` under JPA Auditing. Do not add creator attribution to `UserAccount` itself. Avoid an awkward `UserAccount` self-reference through the current auditable base. A dedicated operational base class is optional; explicit fields are acceptable. Production operational tables are expected to be empty. Recheck this assumption before deployment. Done when new owners, cats, vets and stays always persist the authenticated creator; the schema rejects missing or invalid creator references; creation behavior remains unchanged from the client perspective; service and persistence tests cover assignment and the required relation. Validation: `./mvnw verify`; clean MySQL startup with Flyway. Dependencies: None. Parent epic: #139. Out of scope: deletion authorization, creator display, `updatedBy` and historical activity logs."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Newly created operational records are attributed to the authenticated application account.
  - **Why this priority**: Creator attribution is the primary security and auditability outcome requested by the issue.
  - **Acceptance Scenarios**:
    1. **Given** an authenticated application account creates an owner, **When** the owner is persisted, **Then** that owner stores a required creator relation to the same account.
    2. **Given** an authenticated application account creates a cat, vet, or stay through existing creation behavior, **When** the record is persisted, **Then** the record stores a required creator relation to the same account.
  - **Validation Evidence**: Service tests demonstrate authenticated-account assignment for owner, cat, vet, and stay creation.

- **TO-002**: Persistence enforces creator attribution for operational records.
  - **Why this priority**: Backend assignment must be backed by database integrity so missing or invalid creator references cannot be persisted.
  - **Acceptance Scenarios**:
    1. **Given** the database schema is migrated, **When** an owner, cat, vet, or stay row is inserted without a creator, **Then** the schema rejects the row.
    2. **Given** the database schema is migrated, **When** an owner, cat, vet, or stay row references a non-existent creator account, **Then** the schema rejects the row.
  - **Validation Evidence**: Persistence or migration tests cover the required relation, and Flyway applies the migration during application startup.

- **TO-003**: Client-facing creation contracts remain unchanged.
  - **Why this priority**: Creator data is server-controlled and the issue explicitly requires creation behavior to remain unchanged from the client perspective.
  - **Acceptance Scenarios**:
    1. **Given** an existing client creation request for an owner, cat, vet, or stay, **When** the request is submitted without creator data, **Then** the backend accepts the request according to existing rules and assigns the creator server-side.
    2. **Given** request and response payloads for operational creation, **When** the feature is implemented, **Then** creator attribution is not introduced as a client-supplied creation field or visible creator display.
  - **Validation Evidence**: API DTO review and existing or updated tests show request payloads remain creator-free while service creation persists creator attribution.

### Observable Behavior Detail *(include when visible UI or user-observable behavior changes)*

- **Visible states**: N/A: this backend feature does not add creator display, UI fields, or user-visible state changes.
- **Interaction outcomes**: Existing owner, cat, vet, and stay creation flows remain unchanged from the client perspective.
- **Copy and localization**: N/A: no new user-facing copy is in scope.
- **Responsive/mobile behavior**: N/A: no frontend layout changes are in scope.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Authenticated owner creation request without creator data | No, if existing owner rules pass | Yes | Existing success or validation behavior preserved | Creator assigned server-side; client payload preserved | N/A |
| Authenticated cat, vet, or stay creation request without creator data | No, if existing entity rules pass | Yes | Existing success or validation behavior preserved | Creator assigned server-side; client payload preserved | N/A |
| Creation request fails existing validation or business rules | Existing blocking behavior preserved | Existing behavior preserved | Existing error behavior preserved | Existing input handling preserved | Existing correction behavior preserved |
| Persistence attempt with missing creator relation | N/A | N/A | N/A at persistence layer | Row rejected by schema | Persist with a valid authenticated creator relation |
| Persistence attempt with invalid creator relation | N/A | N/A | N/A at persistence layer | Row rejected by schema | Persist with an existing `UserAccount` creator relation |
| Production operational tables contain existing rows before deployment | N/A | N/A | N/A operational deployment check | Migration readiness is not assumed until data state is rechecked | Resolve deployment data strategy before applying migration |

### Edge Cases

- Owner, cat, vet, and stay creation must all obtain the authenticated account from the backend's current authentication mechanism rather than from client-provided payload data.
- `UserAccount` must not gain creator attribution or a self-referential creator relation.
- JPA auditing must continue to manage `createdAt` and `updatedAt`; creator attribution must not replace or duplicate timestamp auditing behavior.
- Stay creation must preserve existing stay invariants, including date ordering, required cats, cat ownership, duplicate-cat rejection, active-stay overlap checks, and cancellation behavior.
- Migration deployment must recheck the issue's expectation that production operational tables are empty before applying required non-null creator relations.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Owner, Cat, Vet, and Stay records MUST each persist a required creator relation to `UserAccount`.
- **TR-002**: The backend MUST assign the creator from the authenticated application account during owner, cat, vet, and stay creation.
- **TR-003**: Client request payloads for owner, cat, vet, and stay creation MUST NOT require or accept creator attribution as client-controlled input.
- **TR-004**: The feature MUST NOT add creator attribution to `UserAccount` itself.
- **TR-005**: The implementation MUST avoid introducing a `UserAccount` self-reference through the current auditable base.
- **TR-006**: `createdAt` and `updatedAt` MUST remain under JPA Auditing and MUST NOT be replaced by creator attribution.
- **TR-007**: Flyway migrations MUST add schema support, required constraints, and foreign keys so missing or invalid creator references are rejected for owner, cat, vet, and stay records.
- **TR-008**: Existing owner, cat, vet, and stay creation behavior MUST remain unchanged from the client perspective except for server-side persistence of creator attribution.
- **TR-009**: Tests MUST cover service-level creator assignment and persistence-level enforcement of the required creator relation for all four operational record types.
- **TR-010**: Validation MUST include `./mvnw verify` and a clean MySQL startup with Flyway.
- **TR-011**: Deployment preparation MUST recheck the issue's assumption that production operational tables are empty before applying the migration.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.

### Out of Scope

- Creator display in API responses, frontend views, lists, or detail pages.
- Deletion authorization, creator-based access control, `updatedBy`, historical activity logs, or audit timelines.
- Creator attribution for `UserAccount`.
- Changes to existing client-visible creation workflows beyond preserving their current behavior.
- Schema or persistence changes unrelated to required creator relations for owner, cat, vet, and stay records.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **UserAccount**: Authenticated application account that becomes the required creator of operational records; not itself creator-attributed.
- **Owner**: Operational owner record that must store the authenticated creator on creation.
- **Cat**: Operational cat record that must store the authenticated creator on creation.
- **Vet**: Operational veterinarian record that must store the authenticated creator on creation.
- **Stay**: Operational stay/booking record that must store the authenticated creator on creation while preserving protected stay invariants.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creating an owner, cat, vet, or stay as an authenticated account persists that account as the record's creator.
- **SC-002**: The migrated schema rejects owner, cat, vet, and stay rows with missing or invalid creator references.
- **SC-003**: Existing creation request payloads for owner, cat, vet, and stay remain creator-free and continue to work when all existing validation rules pass.
- **SC-004**: `createdAt` and `updatedAt` behavior remains covered by existing JPA Auditing rather than becoming client-controlled or creator-derived.
- **SC-005**: `./mvnw verify` completes successfully.
- **SC-006**: The application starts cleanly against MySQL with Flyway migrations applied.

## Assumptions

- The backend's existing authentication mechanism exposes the current authenticated `UserAccount` or a stable identifier that can resolve to it during service-layer creation.
- Production operational tables are expected to be empty, as stated in the issue, but this must be rechecked before deployment rather than treated as permanently guaranteed.
