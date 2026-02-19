# CatWorld

Aplicación para gestionar una guardería felina: registro de dueños y gatos + agenda de estancias.

## Stack
- Java + Spring Boot (monolito)
- Spring Web (REST)
- Spring Data JPA
- MySQL
- Flyway
- Docker Compose

## Documentación
- Arquitectura y decisiones: `docs/ARCHITECTURE.md`
- Diagramas PlantUML: `docs/uml/`

## Desarrollo local (rápido)

### 1) Levantar MySQL
```bash
docker compose up -d
docker compose ps