# CatWorld

![Backend CI](https://github.com/TheZenithPassage/catworld/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/TheZenithPassage/catworld/actions/workflows/frontend-ci.yml/badge.svg)

CatWorld is an administration system for cat boarding. Its Angular interface and Spring Boot API manage owners, cats, reference vets, stays, pricing, payments and operational records. The application is for authenticated staff; `catworld.com.ar` is reserved for a separate future public website.

## Features

- Manage owners, cats, reference vets and cat profile photos. Search paginated overviews and open complete record details.
- Create multi-cat stays for one owner, edit or cancel them, and prevent overlapping active bookings per cat. Stay status and night count are derived from dates and cancellation data.
- Inspect stays in a monthly FullCalendar view with daily counts and labels, entry/exit display modes and independent filters.
- Configure nightly reference rates and a transfer rate. Preview the authoritative accommodation and transfer suggestion, then explicitly confirm an agreed amount when creating a stay or making a pricing-affecting change.
- Register, correct and annul individual stay payments; view payment history, derived paid totals, remaining balance and payment condition. Administrators can make the focused corrections and removals permitted by the backend.
- Review durable sensitive economic activity with actor and stay context. The backend enforces role and status restrictions for economic changes and permanent deletion.
- Sign in with database-backed HTTP Basic credentials. `ADMIN` manages accounts and rates; `STAFF` has operational access within the backend's role rules.
- Store normalized cat photos in MySQL; serve them through an authenticated JPEG resource with a digest ETag.

The detailed rules and role boundaries are in [Architecture](docs/ARCHITECTURE.md).

## Stack

**Backend:** Java 25, Spring Boot, Spring Security, Spring Data JPA, MySQL, Flyway and libvips.

**Frontend:** Angular, TypeScript, Angular Material, SCSS and FullCalendar.

**Delivery:** Docker Compose, Nginx, GitHub Actions and immutable ARM64 GHCR images.

## Quick Start

Install Docker Desktop or Docker Engine with Docker Compose. Copy `.env.example` to an ignored `.env`, replace its local placeholder credentials, then run:

```bash
docker compose up --build
```

Open `http://localhost:4200`. On a fresh database, the configured bootstrap credentials create the first administrator. This is the local development stack; production uses the image-only procedure in [Operations](docs/OPERATIONS.md).

## Demo Flow

Use synthetic records in a local environment:

1. Sign in as `ADMIN`, add an owner and reference vet, then add a cat with an optional profile photo. Open the cat detail and photo.
2. Configure the applicable nightly reference rate and, if demonstrating transfers, the transfer rate.
3. Create a stay: select cats belonging to that owner, preview the calculated nights and suggested amount, and submit an explicit agreed amount and matching pricing confirmation. A different agreement needs a reason when a suggestion is available.
4. Open the stay detail, inspect its pricing and payment summary, register a payment, and observe the derived balance and payment condition.
5. Find the stay through the overview filters and calendar. Review the sensitive economic activity as `ADMIN` after a permitted economic change.

## Validation

Backend:

```bash
./mvnw verify
```

Frontend:

```bash
cd frontend
npm ci
npm run build
npm run format:check
npm run test:ci
```

These are validation commands, not claims that a particular release or deployment passed them.

## Architecture and operations

CatWorld remains a layered Spring Boot monolith: `controller -> service -> repository -> database`. DTOs and mappers separate HTTP contracts from JPA entities. Flyway manages the schema. In production the browser receives Angular assets from Nginx, which proxies `/api` to Spring Boot on the internal Compose network; MySQL uses a persistent volume. The only host-bound application port is the frontend loopback port, reached through a Cloudflare Tunnel and protected by Cloudflare Access at `admin.catworld.com.ar`.

- [Architecture and domain contracts](docs/ARCHITECTURE.md)
- [PlantUML diagrams](docs/uml)
- [Production operations, release and recovery procedures](docs/OPERATIONS.md)
- [Frontend development](frontend/README.md)
