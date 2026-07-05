# API Contract: Creator Attribution

Creator attribution is an internal backend persistence contract for issue #146.
The public creation request contracts remain unchanged and do not accept
creator-controlled fields.

## Unchanged Creation Requests

The following endpoints continue to accept their existing request DTO shapes:

- `POST /api/owners` with `OwnerRequestDTO`
- `POST /api/cats` with `CatRequestDTO`
- `POST /api/vets` with `VetRequestDTO`
- `POST /api/stays` with `StayRequestDTO`

None of these request DTOs includes a `creator`, `creatorId`, `createdBy`, or
`createdById` field.

## Server-Controlled Behavior

For authenticated requests that pass existing validation and business rules:

- the backend resolves the authenticated application account;
- the backend assigns that account as the persisted creator;
- the client does not choose or send the creator;
- existing response DTOs remain creator-display-free for this feature.

## Out of Contract

- Exposing creator identity in operational response payloads.
- Filtering or authorizing operational records by creator.
- Updating creator attribution after creation.
- Adding `updatedBy` or historical activity-log data.
