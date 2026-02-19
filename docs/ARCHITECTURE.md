# CatWorld

Aplicación web para gestionar una guardería felina (registro de dueños y gatos + agenda de estancias).  
Objetivo: ser usable en un caso real y, a la vez, funcionar como proyecto de portfolio con prácticas estándar de backend.

## Alcance (alto nivel)

- **Registro** de dueños y gatos (datos básicos + notas relevantes para el cuidado).
- **Agenda de estancias** (entrada/salida) por gato.
- **Consultas** típicas: estancias actuales, próximas entradas/salidas, búsqueda rápida por dueño/gato.
- Fuera de alcance inicial: gestión de habitaciones/capacidad, inventario, facturación avanzada, etc.

## Stack

- Java + Spring Boot (monolito)
- Spring Web (API REST)
- Spring Data JPA (ORM)
- MySQL (DB relacional)
- Flyway (migraciones de esquema)
- Docker Compose (DB reproducible en desarrollo)
- PlantUML (diagramas)

## Arquitectura

Monolito por capas (convención):

- `controller` (API REST)
- `service` (reglas de negocio, transacciones)
- `repository` (acceso a datos con JPA)
- `model` / `domain` (entidades y lógica de dominio)
- `dto` + `mapper` (contratos de entrada/salida)

## Modelo conceptual (macro)

Entidades principales:

- **Owner** (dueño): datos de contacto y referencia.
- **Cat** (gato): datos del animal, vínculo con Owner y (opcionalmente) Vet.
- **Vet** (veterinario): datos de referencia.
- **Stay** (estancia): rango de fechas/horas + cancelación + notas.

Relaciones principales:

- Owner 1..* Cat
- Vet 0..* Cat
- Cat 1..* Stay

### Estado de una estancia (dinámico)

El “estado” de una estancia se **deriva en tiempo de ejecución** (no se persiste como columna) en base a:
- `startAt`, `endAt`
- `cancelledAt` (si aplica)

## Auditoría (histórico)

Las entidades persisten:
- `createdAt`
- `updatedAt`

Se usa **Spring Data JPA Auditing** para gestionarlos automáticamente.

## Diagramas (PlantUML)

Los diagramas viven en: `docs/uml/`

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

Render:
- Recomendado: plugin de PlantUML en IntelliJ
- Alternativa: PlantUML CLI (si se prefiere generar PNG/SVG en CI)

## Desarrollo local

### Requisitos
- Java (proyecto orientado a correr en una versión moderna de Java; el build puede fijar una release estable para compatibilidad)
- Docker Desktop
- Maven (o Maven Wrapper `./mvnw`)

### Base de datos (MySQL en Docker)
1) Copia `.env.example` a `.env` (si aplica) y ajusta valores.
2) Levanta MySQL:
   ```bash
   docker compose up -d
   docker compose ps