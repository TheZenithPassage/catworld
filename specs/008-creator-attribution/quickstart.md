# Quickstart: Creator Attribution Validation

## Prerequisites

- Java 17.
- Docker Desktop or Docker Engine with Docker Compose for the MySQL startup check.
- No production deployment should proceed until operational table contents are rechecked as described in `docs/OPERATIONS.md`.

## Automated Backend Validation

Run from the repository root:

```powershell
./mvnw verify
```

Expected result:

- service tests prove owner, cat, vet, and stay creation assign the authenticated creator;
- persistence tests prove missing creator relations are rejected;
- existing controller/API tests continue passing without creator fields in client payloads;
- application context tests still pass with JPA auditing enabled.

Rerun this command after any relevant change to backend models, services, DTOs, migrations, tests, or documentation that affects validation evidence.

## MySQL Flyway Startup Validation

Use a disposable Compose project so the validation database starts from a clean volume:

```powershell
$env:COMPOSE_PROJECT_NAME = 'catworld_issue_146_validation'
docker compose up --build -d db app
docker compose ps
docker compose logs app --tail=200
docker compose down -v
Remove-Item Env:\COMPOSE_PROJECT_NAME
```

Expected result:

- MySQL becomes healthy;
- the Spring Boot app starts successfully with `SPRING_PROFILES_ACTIVE=docker`;
- Flyway applies all migrations, including creator attribution;
- Hibernate validates the schema without errors.

If Docker is unavailable, report this check as skipped or not revalidated rather than passed.

## Contract Review

Review `src/main/java/com/allegaeon/catworld/dto/*RequestDTO.java` and relevant response DTOs for owner, cat, vet, and stay.

Expected result:

- creation request DTOs remain creator-free;
- response DTOs do not add creator display for this issue;
- creator assignment happens inside backend services only.

## Production Deployment Recheck

Before applying this migration to production, recheck the issue assumption that
the operational tables are empty. If any of `owners`, `cats`, `vets`, or `stays`
contain rows, stop and obtain an explicit backfill/deployment decision before
deploying this migration.
