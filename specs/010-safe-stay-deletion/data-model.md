# Data Model: Safe Stay Deletion

## Existing Entities

### Stay

- **Purpose**: Boarding stay record that can be permanently deleted when the current requester passes the shared deletion authorization policy.
- **Relevant fields**:
  - `id`: stay identifier used by the DELETE endpoint.
  - `startAt`, `endAt`, `cancelledAt`: existing lifecycle fields used to derive dynamic status; they do not block deletion.
  - `owner`: existing owner relationship; preserved by stay deletion.
  - `createdBy`: existing creator relationship used by the #147 policy.
  - `createdAt`: existing audit timestamp used by the #147 correction window.
  - `stayCats`: existing owned `StayCat` links removed with the stay.
- **Deletion behavior**: Successful permanent deletion removes the stay and owned `StayCat` links. It does not set `cancelledAt` and does not delete related cats, owners, vets or application accounts.

### StayCat

- **Purpose**: Existing explicit link between a stay and each participating cat.
- **Relevant fields**:
  - `stay`: parent stay.
  - `cat`: participating cat.
- **Deletion behavior**: Removed when its parent stay is deleted. The linked `Cat` remains.

### Cat

- **Purpose**: Participating animal record.
- **Deletion behavior**: Preserved when a stay is deleted.

### Owner

- **Purpose**: Customer record associated with stays and cats.
- **Deletion behavior**: Preserved when a stay is deleted.

### Vet

- **Purpose**: Reference veterinarian record reachable through cat relationships.
- **Deletion behavior**: Preserved when a stay is deleted.

### UserAccount

- **Purpose**: Authenticated application account and creator reference.
- **Relevant fields**:
  - `role`: `ADMIN` or `STAFF`.
  - `id`: compared with `Stay.createdBy.id` for staff creator matching.
- **Deletion behavior**: Preserved when a stay is deleted.

## API Payload Changes

### StayResponseDTO

- Add `canDelete: boolean`.
- `canDelete` is calculated by the backend for the current requester using the same #147 policy matrix as permanent deletion.
- `canDelete` is a rendering hint only. It does not authorize deletion and cannot be supplied by clients to bypass server-side checks.

## State Rules

- Dynamic statuses `RESERVED`, `CHECKED_IN`, `CHECKED_OUT` and `CANCELLED` do not block permanent deletion when authorization passes.
- Cancellation remains a separate state-changing operation using `cancelledAt`.
- The protected stay invariants for creating/updating stays are unchanged.

## Persistence Notes

- No new tables, columns or migrations are planned.
- Existing Flyway migrations remain authoritative for schema validation.
- Persistence validation must prove that deleting a stay removes owned `StayCat` rows and leaves cat, owner, vet and application-account rows intact.
