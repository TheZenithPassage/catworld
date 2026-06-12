# CatWorld

![Backend CI](https://github.com/TheZenithPassage/catworld/actions/workflows/backend-ci.yml/badge.svg)

CatWorld is a full-stack application for managing a cat boarding business. It handles owners, cats, reference vets, and stay bookings.

## Project Status

CatWorld is currently under active development as a portfolio project and as a real tool for a small cat boarding business.

The current focus is the backend API, domain modeling, business rules, database schema management, automated testing, CI, frontend MVP development, and private local deployment preparation.

## Features

- Owner, cat and vet management.
- Stay booking management.
- Multi-cat stays for cats from the same owner.
- Dynamic stay status calculation.
- Stay cancellation flow.
- Flyway-managed database schema.
- Backend CI with GitHub Actions.
- Frontend CI with GitHub Actions.
- Angular frontend MVP.
- Docker Compose setup for running MySQL, the backend API and the frontend together.

## Stack

### Backend

- Java 17 + Spring Boot
- Spring Web
- Spring Data JPA
- MySQL
- Flyway
- JUnit 5 + Mockito

### Frontend

- Angular
- TypeScript
- SCSS
- Nginx for serving the production build

### Infrastructure

- Docker Compose
- GitHub Actions

## Documentation

- Architecture and modeling notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- PlantUML diagrams: [`docs/uml`](docs/uml)
- Frontend notes: [`frontend/README.md`](frontend/README.md)
- Operations notes: [`docs/OPERATIONS.md`](docs/OPERATIONS.md)

## Local Development

### Requirements

- Java 17
- Node.js
- npm
- Docker Desktop or Docker Engine with Docker Compose
- Maven Wrapper, included as `mvnw` and `mvnw.cmd`

### 1. Configure Local Environment

Copy `.env.example` to `.env` for local development overrides.

For private/local production, copy `.env.production.example` to `.env.production`.

The example files are committed as templates. Real `.env` and `.env.production` files must not be committed.

### 2. Start the Full Docker Compose Stack for Development

```bash
docker compose up --build
```

On Windows PowerShell:

```powershell
docker compose up --build
```

This starts:

- MySQL database
- CatWorld Spring Boot API
- CatWorld Angular frontend served by Nginx

The frontend will be available at:

```txt
http://localhost:4200
```

The backend API will be available at:

```txt
http://localhost:8080
```

Useful frontend routes:

```txt
http://localhost:4200
http://localhost:4200/stays
http://localhost:4200/stays/new
http://localhost:4200/owners
http://localhost:4200/owners/new
http://localhost:4200/cats
http://localhost:4200/cats/new
http://localhost:4200/vets
http://localhost:4200/vets/new
```

Useful API endpoints:

```txt
http://localhost:8080/api/owners
http://localhost:8080/api/cats
http://localhost:8080/api/vets
http://localhost:8080/api/stays
```

Inside the Docker Compose stack, the frontend uses `/api` as its API base path. Nginx proxies `/api/**` requests from the frontend container to the Spring Boot backend container.

This allows the browser to call:

```txt
http://localhost:4200/api/stays
```

while Nginx forwards the request internally to:

```txt
http://app:8080/api/stays
```

To stop the stack without deleting the local database volume:

```bash
docker compose down
```

To stop the stack and delete the local database volume:

```bash
docker compose down -v
```

Use `-v` only when you intentionally want to reset the local database.

### 3. Start the Private Local Production Stack

Create a production env file from the example:

```bash
cp .env.production.example .env.production
```

On Windows PowerShell:

```powershell
Copy-Item .env.production.example .env.production
```

Edit `.env.production` and set the database and login values before starting the stack.

Required auth values:

```txt
CATWORLD_SECURITY_USERNAME
CATWORLD_SECURITY_PASSWORD
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS
```

For the default local setup, keep:

```txt
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=http://localhost:4200
```

Start the production-oriented stack:

```bash
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

On Windows PowerShell:

```powershell
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

This starts:

- MySQL with persisted data
- CatWorld Spring Boot API inside the Docker Compose network
- CatWorld Angular frontend served by Nginx

Only the frontend is exposed to the host machine:

```txt
http://localhost:4200
```

Log in with the username and password configured in `.env.production`.

In this setup, the backend and database are not exposed directly. Browser API requests go through the frontend `/api` proxy.

To check the running containers:

```bash
docker compose --env-file .env.production -f compose.prod.yml ps
```

To stop the stack without deleting the database volume:

```bash
docker compose --env-file .env.production -f compose.prod.yml down
```

Do not use `-v` unless you intentionally want to delete the local production database volume.

### 4. Run Backend Tests

```bash
./mvnw test
```

On Windows PowerShell:

```powershell
.\mvnw.cmd test
```

### 5. Run Frontend Locally for Development

For frontend development, use Angular's development server instead of the Docker/Nginx production-like container.

From the repository root:

```bash
cd frontend
npm install
npm start
```

The Angular development server runs at:

```txt
http://localhost:4200
```

During local frontend development, the backend API base URL is configured in:

```txt
frontend/src/environments/environment.development.ts
```

Expected development API base URL:

```txt
http://localhost:8080/api
```

### 6. Build and Test the Frontend

From `frontend/`:

```bash
npm run build
npm run test:ci
```

### 7. Optional: Run the API Locally Outside Docker

If you only want Docker Compose to run MySQL and prefer starting the API from your IDE or Maven, run:

```bash
docker compose up db
```

Then start the API with the Docker profile:

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

## Docker Compose Services

The default Docker Compose stack includes:

```txt
db        MySQL database
app       Spring Boot backend API
frontend  Angular production build served through Nginx
```

The frontend container is built from:

```txt
frontend/Dockerfile
```

The frontend Nginx configuration is defined in:

```txt
frontend/nginx.conf
```

The frontend service exposes container port `80` through the host port configured by:

```txt
FRONTEND_PORT
```

Default frontend port:

```txt
4200
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

The MySQL data is stored in a Docker volume, so stopping containers does not delete the local database.

To reset the local database completely:

```bash
docker compose down -v
docker compose up --build
```

## Testing and CI

Run backend verification:

    ./mvnw verify

Run frontend validation:

    cd frontend
    npm run build
    npm run test:ci

GitHub Actions runs on pull requests targeting `main` and after changes are merged into `main`.

## Architecture Notes

CatWorld is intentionally developed as a layered Spring Boot monolith:

```txt
controller -> service -> repository -> database
```

DTOs and mappers are used to keep HTTP contracts separated from persistence entities.

The frontend is developed as an Angular application under:

```txt
frontend/
```

The current full-stack architecture is:

```txt
Angular frontend -> Spring Boot REST API -> MySQL
```

In Docker Compose, Nginx serves the Angular production build and proxies API requests to the backend:

```txt
Browser -> Nginx frontend -> Spring Boot API -> MySQL
```

The `Stay` status is not stored in the database. It is computed dynamically from:

- `startAt`
- `endAt`
- `cancelledAt`
- current time