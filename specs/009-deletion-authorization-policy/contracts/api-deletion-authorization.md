# API Contract: Deletion Authorization

## Scope

This contract covers backend authorization behavior for existing operational delete endpoints:

- `DELETE /api/owners/{id}`
- `DELETE /api/cats/{id}`
- `DELETE /api/vets/{id}`

Stay cancellation is not deletion and is out of scope.

## Authorization Matrix

| Requesting Role | Creator Match? | Record Age | Expected API Result |
|-----------------|----------------|------------|---------------------|
| `ADMIN` | Any | Any | Existing successful delete response when entity checks pass |
| `STAFF` | Yes | `createdAt + 15 minutes` strictly after server time | Existing successful delete response when entity checks pass |
| `STAFF` | No | Any | `403 Forbidden` |
| `STAFF` | Yes | Exactly 15 minutes old | `403 Forbidden` |
| `STAFF` | Yes | More than 15 minutes old | `403 Forbidden` |

## Error Semantics

- Authorization failure returns HTTP `403 Forbidden`.
- Entity not found remains the existing `404 Not Found` behavior.
- Entity relationship and state checks remain outside this policy and keep their existing behavior.
- The frontend must not calculate or enforce this authorization policy.

## Time Source

The backend server time source is authoritative. Tests use a deterministic fixed time source for boundary cases.
