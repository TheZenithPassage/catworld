# API Contract: Safe Stay Deletion

## DELETE `/api/stays/{id}`

Permanently deletes a stay when the authenticated requester is authorized by the shared #147 deletion authorization policy.

### Request

- **Authentication**: Required.
- **Path parameters**:
  - `id` (`UUID`): stay identifier.
- **Body**: None.

### Success Response

- **Status**: `204 No Content`
- **Body**: Empty.
- **Persistence effect**:
  - The stay is removed.
  - Owned `StayCat` links for the stay are removed.
  - Cat, owner, vet and application-account records remain.

### Error Responses

- **`404 Not Found`**: No stay exists for `id`.
- **`403 Forbidden`**: The requester fails the shared deletion authorization policy due to role, creator, expired correction window or exact 15-minute boundary.
- **`409 Conflict`**: An integrity or concurrent constraint conflict prevents deletion.

### Authorization Rules

- `ADMIN` may delete any stay.
- `STAFF` may delete only a stay they created while `createdAt + 15 minutes` is strictly after the current server time.
- `STAFF` is forbidden at exactly 15 minutes and after the boundary.
- The server rechecks authorization on every DELETE request.
- Dynamic stay status does not affect authorization once the shared policy passes.

## Stay Response Contract

All stay responses used by the frontend include:

```json
{
  "stayId": "00000000-0000-0000-0000-000000000000",
  "startAt": "2026-07-10T10:00:00",
  "endAt": "2026-07-12T10:00:00",
  "cancelledAt": null,
  "createdAt": "2026-07-06T08:00:00Z",
  "updatedAt": "2026-07-06T08:00:00Z",
  "notes": "Optional note",
  "catIds": ["00000000-0000-0000-0000-000000000001"],
  "ownerId": "00000000-0000-0000-0000-000000000002",
  "ownerName": "Example Owner",
  "cats": [
    {
      "catId": "00000000-0000-0000-0000-000000000001",
      "name": "Milo"
    }
  ],
  "canDelete": true
}
```

`canDelete` is calculated for the authenticated requester and is only a rendering hint. DELETE requests must not trust the previously rendered value.
