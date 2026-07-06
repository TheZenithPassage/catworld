# Research: Shared Deletion Authorization Policy

## Decision: Use the existing creator attribution model as the policy input

**Rationale**: Issue #146 is closed as completed, and current source-of-truth documentation records `createdBy` on owner, cat, vet, and stay records plus `createdAt` from `AuditableEntity`. This provides the creator and creation timestamp required by issue #147 without a schema change.

**Alternatives considered**: Adding new deletion metadata or a deletion-specific ownership table was rejected as out of scope and unnecessary.

## Decision: Apply the policy to current delete flows for owners, cats, and vets

**Rationale**: Current backend controllers expose `DELETE /api/owners/{id}`, `DELETE /api/cats/{id}`, and `DELETE /api/vets/{id}`. Stays currently expose cancellation, not deletion, so stay cancellation remains outside the deletion authorization policy.

**Alternatives considered**: Applying the policy to stay cancellation was rejected because the issue is about deletion authorization and explicitly keeps entity state checks outside the policy.

## Decision: Add a focused custom backend policy with deterministic time

**Rationale**: Issue #147 explicitly directs one reusable backend policy and a `Clock` or equivalent deterministic time source. A Spring-managed policy with Java `Clock` uses existing project capabilities and is directly testable.

**Alternatives considered**: Duplicating the matrix in each service was rejected by issue scope. Angular-side enforcement was rejected by issue scope and the constitution's backend-authority principle. A third-party authorization engine was rejected as disproportionate and unrequested.

## Decision: Use backend exception handling for `403 Forbidden`

**Rationale**: Existing custom exceptions are mapped by `GlobalExceptionHandler`, while Spring Security also maps request-level access denial to `403`. A small application forbidden exception or equivalent handler keeps service-level authorization denials explicit and testable at the API boundary.

**Alternatives considered**: Letting repository deletion fail, returning `404`, or relying on frontend hiding were rejected because the issue requires authorization failure to map to `403 Forbidden`.
