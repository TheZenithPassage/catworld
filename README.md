# CatWorld

CatWorld is a REST API for managing a cat boarding business. It handles owners, cats, reference vets, and stay bookings.

## Stack
- Java 17 + Spring Boot
- Spring Web (REST)
- Spring Data JPA
- MySQL
- Flyway
- Docker Compose

## Documentation
- Architecture and modeling notes: `docs/ARCHITECTURE.md`
- PlantUML diagrams: `docs/uml/`

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

The API starts on the default Spring Boot port, `8080`.

## API Surface
- `GET /api/owners`, `POST /api/owners`, `GET /api/owners/{id}`, `PUT /api/owners/{id}`, `DELETE /api/owners/{id}`
- `GET /api/cats`, `POST /api/cats`, `GET /api/cats/{id}`, `PUT /api/cats/{id}`, `DELETE /api/cats/{id}`
- `GET /api/vets`, `POST /api/vets`, `GET /api/vets/{id}`, `PUT /api/vets/{id}`, `DELETE /api/vets/{id}`
- `GET /api/stays`, `POST /api/stays`, `GET /api/stays/{id}`, `PUT /api/stays/{id}`, `PATCH /api/stays/{id}/cancel`

## Database
Flyway applies the schema from `src/main/resources/db/migration` when the application starts with the Docker profile.

The Docker profile reads database settings from environment variables and falls back to safe local dummy values. For production or shared deployments, provide real secrets through the runtime environment instead of committing them.
