# Quickstart: Shared Deletion Authorization Policy

## Prerequisites

- Java 17 available on PATH.
- Repository checked out on `feat/147-shared-deletion-authorization-policy`.
- Issue #146 creator attribution present in current code.

## Validation Commands

Run backend validation from the repository root:

```bash
./mvnw verify
```

Expected result: Maven completes successfully and all backend tests pass.

## Focused Verification

1. Run the policy tests and confirm the parameterized matrix covers:
   - `ADMIN` allowed for any creator and age.
   - `STAFF` allowed for their own record inside the strict 15-minute window.
   - `STAFF` denied for a different creator.
   - `STAFF` denied for expired records.
   - `STAFF` denied at exactly 15 minutes.
2. Run service or API tests and confirm owner, cat, and vet delete flows call the shared policy before repository deletion.
3. Confirm service-level authorization denial maps to HTTP `403 Forbidden`.
4. Review the frontend diff or search results and confirm Angular does not calculate or enforce the policy.
5. Review changed files and confirm there is no Flyway migration or persistence schema change.

Validation evidence must be rerun after relevant late code changes. If a relevant check cannot be rerun, report it as not revalidated instead of passed.
