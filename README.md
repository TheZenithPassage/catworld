# CatWorld

![Backend CI](https://github.com/TheZenithPassage/catworld/actions/workflows/backend-ci.yml/badge.svg)

CatWorld is a REST API for managing a cat boarding business. It handles owners, cats, reference vets, and stay bookings.

## Project Status

CatWorld is currently under active development as a backend portfolio project and as a real tool for a small cat boarding business.

The current focus is the backend API, domain modeling, business rules, database schema management, automated testing and CI.

## Features

- Owner, cat and vet management.
- Stay booking management.
- Multi-cat stays for cats from the same owner.
- Dynamic stay status calculation.
- Stay cancellation flow.
- Flyway-managed database schema.
- Backend CI with GitHub Actions.

## Stack

- Java 17 + Spring Boot
- Spring Web
- Spring Data JPA
- MySQL
- Flyway
- Docker Compose
- JUnit 5 + Mockito
- GitHub Actions

## Documentation

- Architecture and modeling notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- PlantUML diagrams: [`docs/uml/`](docs/uml/)

## Local Development

### Requirements

- Java 17
- Docker Desktop or Docker Engine with Docker Compose
- Maven Wrapper, included as `mvnw` and `mvnw.cmd`

### 1. Configure Local Environment

Copy `.env.example` to `.env` if you want to override Docker Compose defaults.

The example values are local-only placeholders. Do not commit real credentials.

### 2. Start MySQL

```bash
docker compose up -d
docker compose ps
```

### 3. Run Tests

```bash
./mvnw test
```

On Windows PowerShell:

```powershell
.\mvnw.cmd test
```

### 4. Start the API

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=docker
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=docker"
```

The API starts on the default Spring Boot port:

```txt
http://localhost:8080
```

## API Surface

### Owners

- `GET /api/owners`
- `POST /api/owners`
- `GET /api/owners/{id}`
- `PUT /api/owners/{id}`
- `DELETE /api/owners/{id}`

### Cats

- `GET /api/cats`
- `POST /api/cats`
- `GET /api/cats/{id}`
- `PUT /api/cats/{id}`
- `DELETE /api/cats/{id}`

### Vets

- `GET /api/vets`
- `POST /api/vets`
- `GET /api/vets/{id}`
- `PUT /api/vets/{id}`
- `DELETE /api/vets/{id}`

### Stays

- `GET /api/stays`
- `POST /api/stays`
- `GET /api/stays/{id}`
- `PUT /api/stays/{id}`
- `PATCH /api/stays/{id}/cancel`

## Database

Flyway applies the schema from:

```txt
src/main/resources/db/migration
```

when the application starts with the Docker profile.

The Docker profile reads database settings from environment variables and falls back to safe local dummy values. For production or shared deployments, provide real secrets through the runtime environment instead of committing them.

## Testing and CI

The project includes automated backend tests focused on service-level business rules.

Run the test suite locally:

```bash
./mvnw test
```

On Windows PowerShell:

```powershell
.\mvnw.cmd test
```

GitHub Actions runs the Maven test suite automatically on:

- pull requests targeting `main`
- pushes to `main`

Workflow file:

```txt
.github/workflows/backend-ci.yml
```

## Architecture Notes

CatWorld is intentionally developed as a layered Spring Boot monolith:

```txt
controller -> service -> repository -> database
```

DTOs and mappers are used to keep HTTP contracts separated from persistence entities.

The `Stay` status is not stored in the database. It is computed dynamically from:

- `startAt`
- `endAt`
- `cancelledAt`
- current time