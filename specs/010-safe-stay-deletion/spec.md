# Feature Specification: Safe Stay Deletion

**Feature Branch**: `feat/195-add-safe-permanent-deletion-for-stays`

**Created**: 2026-07-06

**Input**: User description: "GitHub issue #195: Add safe permanent deletion for stays. Allow authorized users to permanently delete mistaken stay records without changing cancellation semantics or deleting unrelated history. Part of #148. Parent epic: #139. Scope: add or align the authenticated DELETE endpoint for stays; apply the shared deletion authorization policy from #147 before deletion; allow stay deletion regardless of dynamic stay status; delete only the stay and owned StayCat links; keep cancellation unchanged and distinct from permanent deletion; return 404 for missing stays; return 403 for role, creator or correction-window authorization failures; return 409 for integrity or concurrent constraint conflicts if they occur; expose calculated canDelete for stay responses needed by the frontend, but recheck every DELETE request server-side. Parallel boundary: stay deletion flow only; do not implement cat, owner or vet deletion rules here; avoid broad edits to shared exception handling, security helpers or DTO conventions unless strictly necessary for this stay flow. Done when: authorized ADMIN can delete any stay; eligible STAFF can delete only its own recent stay according to #147; ineligible STAFF receives 403; deleting a stay removes its StayCat links and no cat, owner or vet records; cancelled, reserved, checked-in and checked-out dynamic states do not change the hard-delete rule; stay responses expose canDelete for rendering only; service tests cover stay-specific behavior; representative controller/security and persistence tests cover HTTP status and owned-link deletion. Validation: ./mvnw verify; clean MySQL startup with Flyway. Dependencies: blocked by #147, which is closed as completed as of 2026-07-06. Out of scope: cat deletion, owner deletion, vet deletion, application account deletion, soft delete, restore and frontend deletion UI."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Authenticated stay deletion is available only to users authorized by the shared deletion authorization policy from #147.
  - **Why this priority**: Permanent deletion is destructive and must enforce role, creator and correction-window rules server-side before any data is removed.
  - **Acceptance Scenarios**:
    1. **Given** an existing stay, **When** an authenticated `ADMIN` deletes it, **Then** the stay is permanently removed regardless of creator or dynamic stay status.
    2. **Given** an existing stay created by an authenticated `STAFF` user within the #147 correction window, **When** that same staff user deletes it, **Then** the stay is permanently removed.
    3. **Given** an existing stay, **When** an authenticated `STAFF` user is not the creator, the correction window has expired, or the exact boundary is reached, **Then** deletion is rejected with `403 Forbidden` and the stay remains.
  - **Validation Evidence**: Service tests for the authorization matrix and representative controller/security tests for HTTP status mapping.

- **TO-002**: Permanent stay deletion removes only the stay and its owned stay-cat links while preserving cancellation behavior and unrelated records.
  - **Why this priority**: The issue allows cleanup of mistaken stay records without changing cancellation semantics or deleting cat, owner, vet or application-account history.
  - **Acceptance Scenarios**:
    1. **Given** a stay with one or more `StayCat` links, **When** an authorized user deletes the stay, **Then** the stay and its owned links no longer exist and participating cats, owner records and vet records remain.
    2. **Given** a cancelled, reserved, checked-in or checked-out stay, **When** an authorized user deletes it, **Then** the dynamic state does not block permanent deletion.
    3. **Given** an existing stay, **When** a user cancels it through the existing cancellation behavior, **Then** cancellation remains distinct from permanent deletion.
  - **Validation Evidence**: Service and persistence tests proving owned-link deletion and preservation of unrelated records.

- **TO-003**: Stay API responses expose a calculated `canDelete` value for rendering while every delete request is independently rechecked server-side.
  - **Why this priority**: The frontend needs a rendering hint, but the backend remains authoritative for authorization and integrity.
  - **Acceptance Scenarios**:
    1. **Given** a stay response for an authorized `ADMIN`, **When** the response is serialized, **Then** `canDelete` is `true`.
    2. **Given** a stay response for an eligible own recent `STAFF` stay, **When** the response is serialized, **Then** `canDelete` is `true`.
    3. **Given** a stay response for an ineligible `STAFF` user, **When** the response is serialized, **Then** `canDelete` is `false`.
    4. **Given** any client-supplied state or previously rendered `canDelete` value, **When** a DELETE request is made, **Then** the backend re-evaluates the policy before deleting.
  - **Validation Evidence**: Response contract tests or controller/service assertions for `canDelete`, plus delete-path authorization tests.

### Input/State Validation Matrix *(include when validation or state-sensitive behavior changes)*

| Input or State | Submit/Action Blocked? | API Call Made? | Visible Error or Conflict | Value Transformed or Preserved | Correction Behavior |
|----------------|------------------------|----------------|---------------------------|--------------------------------|---------------------|
| Missing stay | Yes, server rejects | Yes | `404 Not Found` | Existing data preserved | Use a valid stay identifier |
| Authenticated `ADMIN` deleting any stay | No | Yes | None on success | Stay and owned `StayCat` links removed; unrelated records preserved | N/A |
| Authenticated own `STAFF` stay inside #147 correction window | No | Yes | None on success | Stay and owned `StayCat` links removed; unrelated records preserved | N/A |
| Authenticated `STAFF` with different creator, expired window, exact 15-minute boundary, or unsupported role | Yes, server rejects | Yes | `403 Forbidden` | Stay and related records preserved | Retry only when user/policy state is eligible |
| Cancelled, reserved, checked-in or checked-out dynamic stay state | No, if authorization passes | Yes | None on success | Dynamic state does not transform into cancellation or soft-delete state | N/A |
| Integrity or concurrent constraint conflict during deletion | Yes, server rejects | Yes | `409 Conflict` | Existing data preserved by transaction/constraint handling | Retry after conflict is resolved |

### Edge Cases

- Deleting a stay that does not exist returns `404 Not Found` without revealing unrelated data.
- Authorization failures caused by role, creator mismatch, expired correction window, or the exact 15-minute boundary all return `403 Forbidden`.
- Dynamic stay status does not affect whether an otherwise authorized permanent delete may proceed.
- Any integrity or concurrent constraint failure during deletion returns `409 Conflict` and does not partially delete related records.
- `canDelete` is only a rendering hint; stale or manipulated client state cannot authorize deletion.

## Requirements *(mandatory)*

### Functional Requirements *(include when observable product or user behavior changes)*

- **FR-001**: Authenticated users MUST be able to request permanent deletion of an existing stay through the stay API.
- **FR-002**: The system MUST allow `ADMIN` users to permanently delete any stay regardless of creator, age, cancellation state, or dynamic stay status.
- **FR-003**: The system MUST allow `STAFF` users to permanently delete only stays they created while the #147 correction window is still open.
- **FR-004**: The system MUST reject stay deletion with `403 Forbidden` when the requester fails the shared deletion authorization policy because of role, creator or correction-window rules.
- **FR-005**: The system MUST return `404 Not Found` when the target stay does not exist.
- **FR-006**: The system MUST return `409 Conflict` when an integrity or concurrent constraint conflict prevents deletion.
- **FR-007**: The system MUST permanently remove only the stay and its owned `StayCat` links when deletion succeeds.
- **FR-008**: The system MUST preserve cat, owner, vet and application-account records when a stay is deleted.
- **FR-009**: The system MUST preserve existing cancellation behavior as a separate lifecycle action from permanent deletion.
- **FR-010**: Stay API responses needed by the frontend MUST include a calculated `canDelete` value for the current requester.

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The delete operation MUST apply the shared deletion authorization policy delivered by #147 before removing any stay data.
- **TR-002**: The backend MUST re-evaluate deletion authorization on every DELETE request and MUST NOT rely on the response `canDelete` value or any client-side calculation for enforcement.
- **TR-003**: The delete operation MUST remain within the existing layered monolith responsibilities: HTTP handling in controllers, business rules and transactions in services, persistence access in repositories, and DTOs/mappers for API contracts.
- **TR-004**: The feature MUST avoid broad edits to shared exception handling, security helpers, DTO conventions or unrelated deletion flows unless strictly necessary for the stay deletion flow.
- **TR-005**: Validation MUST include service tests for stay-specific authorization and deletion behavior, representative controller/security tests for HTTP status mapping, and persistence evidence that owned `StayCat` links are deleted without deleting unrelated records.
- **TR-006**: Validation MUST include `./mvnw verify` and a clean MySQL startup with Flyway, or explicitly report any environment limitation preventing those checks.

### Scope Boundaries

- **SB-001**: Feature MUST remain within the CatWorld cat-boarding domain.
- **SB-002**: Feature MUST distinguish implemented behavior from assumptions, exclusions, and unresolved product or architectural questions.
- **SB-003**: Feature MUST NOT introduce cross-species abstractions, multi-tenancy, generic platform claims, or permanent product limits without explicit requirements.
- **SB-004**: Feature scope is limited to the stay deletion flow.
- **SB-005**: Feature MUST reuse the #147 deletion authorization policy because #147 is a completed dependency.

### Out of Scope

- Cat deletion rules or endpoints.
- Owner deletion rules or endpoints.
- Vet deletion rules or endpoints.
- Application account deletion.
- Soft delete, restore or retention workflows.
- Frontend deletion UI or destructive confirmation design.
- Changes to cancellation semantics.
- Broad shared exception, security helper or DTO convention refactors that are not required by stay deletion.

### Open Questions

- None.

### Key Entities *(include if feature involves data)*

- **Stay**: The booking record that can be permanently deleted when the requester is authorized.
- **StayCat**: The owned link between a stay and participating cats; these links are removed with the deleted stay.
- **Cat**: A participating animal record that must remain after stay deletion.
- **Owner**: The customer record associated with the stay and cats; it must remain after stay deletion.
- **Vet**: A related care-provider record that must remain after stay deletion.
- **Authenticated User**: The current backend principal whose role, creator relationship and correction-window eligibility determine delete authorization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `ADMIN` users can delete any existing stay, and the stay is absent after deletion.
- **SC-002**: Eligible `STAFF` users can delete only their own recent stays according to the #147 policy, while ineligible `STAFF` delete attempts return `403 Forbidden`.
- **SC-003**: Deleting a stay removes its owned `StayCat` links and does not delete cat, owner, vet or application-account records.
- **SC-004**: Cancelled, reserved, checked-in and checked-out dynamic stay states do not change the permanent deletion rule when authorization passes.
- **SC-005**: Stay API responses expose `canDelete`, and DELETE requests still enforce authorization server-side.
- **SC-006**: Required validation runs include `./mvnw verify` and clean MySQL startup with Flyway, or any inability to run them is explicitly reported.

## Assumptions

- The completed #147 deletion authorization policy is available on `origin/main` for reuse by this feature.
