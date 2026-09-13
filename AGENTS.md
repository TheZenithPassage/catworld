# CatWorld

CatWorld is an administration system for the cat-boarding domain. Keep changes
focused on confirmed product needs and avoid speculative platform abstractions.

## Product boundaries

- Preserve the controller -> service -> repository -> database structure unless
  an explicitly approved architectural decision replaces it.
- Keep business rules, authorization, validation, and important calculations
  authoritative in the backend. Use database constraints as the final guard for
  persisted integrity where practical.
- Use Flyway migrations for schema changes; do not use Hibernate schema
  auto-update for real schema evolution.
- Keep stay status derived from dates and cancellation data. Preserve the core
  stay invariants documented in `docs/ARCHITECTURE.md` and covered by tests.
- Keep secrets and real operational data out of the repository.

## Working in this repository

- Treat `README.md`, `docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, migrations,
  tests, and current code as the sources of truth for implemented behavior.
- Keep changes focused and update source-of-truth documentation when behavior,
  architecture, contracts, or operations change.
- Validate changes proportionally to risk. Run backend tests with `./mvnw test`
  and frontend tests from `frontend/` with `npm test -- --watch=false` when the
  affected area requires them.
- Use English for code and repository documentation, and follow the existing
  internationalization system for user-facing application copy.
