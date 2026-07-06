# Data Model

Not applicable. This feature introduces no new domain entities, persistence model, API payloads, schema changes, browser storage, external contracts, or structured feature data.

The implementation uses existing source-of-truth data:

- `UserAccount.role` for `ADMIN` and `STAFF`.
- Operational record `createdBy` relationships for creator matching.
- `AuditableEntity.createdAt` for the 15-minute deletion window.
