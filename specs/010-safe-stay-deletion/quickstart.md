# Quickstart: Safe Stay Deletion

## Prerequisites

- Java 17 available on PATH.
- Docker Desktop or Docker Engine with Docker Compose for MySQL/Flyway startup validation.
- Repository checked out on `feat/195-add-safe-permanent-deletion-for-stays`.
- Completed #147 deletion authorization policy present in current code.

## Backend Validation

Run from the repository root:

```bash
./mvnw verify
```

Expected result: Maven completes successfully and all backend tests pass.

## MySQL/Flyway Startup Validation

Run a clean Docker Compose startup:

```bash
docker compose up --build
```

Expected result: MySQL becomes healthy, Flyway applies migrations, and the Spring Boot app starts with schema validation enabled. Stop the stack after validation with the normal local workflow.

## Focused Verification

1. Confirm `DELETE /api/stays/{id}` returns `204 No Content` for an authorized `ADMIN`.
2. Confirm an eligible `STAFF` user can delete only their own stay inside the strict #147 correction window.
3. Confirm ineligible `STAFF` attempts return `403 Forbidden` and do not delete the stay.
4. Confirm missing stay deletion returns `404 Not Found`.
5. Confirm a simulated integrity or concurrent conflict maps to `409 Conflict`.
6. Confirm cancelled, reserved, checked-in and checked-out dynamic states do not block deletion when authorization passes.
7. Confirm deleting a stay removes owned `StayCat` links and leaves cat, owner, vet and application-account records intact.
8. Confirm stay responses serialize `canDelete` and DELETE requests recheck authorization server-side.
9. Confirm cancellation remains available through the existing cancellation flow and does not become permanent deletion.

Validation evidence must be rerun after relevant late changes. If a relevant check cannot be rerun, report it as not revalidated instead of passed.
