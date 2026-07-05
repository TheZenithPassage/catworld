# Data Model

## UserAccount

Existing application login account and creator target.

- **Existing key fields**: `id`, `username`, `passwordHash`, `role`, `enabled`, `createdAt`, `updatedAt`.
- **New relationships**: Referenced by operational records as their required creator.
- **Validation rules**: Must remain unique by username and valid by role constraints. Must not gain a creator relation.
- **State transitions**: Existing enabled/role behavior unchanged.

## Owner

Operational owner/contact record.

- **Existing key fields**: `id`, `fullName`, contact fields, `createdAt`, `updatedAt`.
- **New field**: `createdBy` required relation to `UserAccount`.
- **Schema rule**: `owners.created_by_id` is non-null and references `user_accounts(id)`.
- **Creation rule**: Assigned from the authenticated account during owner creation.
- **Update rule**: Creator is not client-controlled and is not overwritten by owner updates.

## Cat

Operational cat record.

- **Existing key fields**: `id`, `name`, `birthDate`, `sex`, descriptive/vaccination fields, `owner`, optional `vet`, `createdAt`, `updatedAt`.
- **New field**: `createdBy` required relation to `UserAccount`.
- **Schema rule**: `cats.created_by_id` is non-null and references `user_accounts(id)`.
- **Creation rule**: Assigned from the authenticated account during cat creation after existing owner/vet lookup succeeds.
- **Update rule**: Creator is not client-controlled and is not overwritten by cat updates.

## Vet

Operational reference veterinarian record.

- **Existing key fields**: `id`, `name`, `address`, `phoneNumber`, `createdAt`, `updatedAt`.
- **New field**: `createdBy` required relation to `UserAccount`.
- **Schema rule**: `vets.created_by_id` is non-null and references `user_accounts(id)`.
- **Creation rule**: Assigned from the authenticated account during vet creation.
- **Update rule**: Creator is not client-controlled and is not overwritten by vet updates.

## Stay

Operational boarding stay record.

- **Existing key fields**: `id`, `startAt`, `endAt`, `cancelledAt`, `notes`, `owner`, `stayCats`, `createdAt`, `updatedAt`.
- **New field**: `createdBy` required relation to `UserAccount`.
- **Schema rule**: `stays.created_by_id` is non-null and references `user_accounts(id)`.
- **Creation rule**: Assigned from the authenticated account during stay creation after existing date, cat ownership, duplicate, and overlap rules pass.
- **Update/cancel rule**: Creator is not client-controlled and is not overwritten by stay update or cancellation.
- **State transitions**: Stay status remains derived from dates and cancellation data and is not persisted.

## Relationship Summary

- `Owner.createdBy -> UserAccount`
- `Cat.createdBy -> UserAccount`
- `Vet.createdBy -> UserAccount`
- `Stay.createdBy -> UserAccount`

All four creator relationships are required at the JPA and database layers. No API request or response contract includes these relationships in this feature.
