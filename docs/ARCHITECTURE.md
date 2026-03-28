# CatWorld

Aplicación web para gestionar una guardería felina.

## Alcance (alto nivel)

- Registro de dueños.
- Registro de gatos.
- Registro de veterinarios de referencia.
- Agenda de estancias.
- Consulta de estancias actuales, futuras, finalizadas y canceladas.

Fuera de alcance inicial:
- gestión de habitaciones o capacidad
- facturación avanzada
- inventario
- permisos y roles complejos

## Stack

- Java + Spring Boot
- Spring Web
- Spring Data JPA
- MySQL
- Flyway
- Docker Compose
- PlantUML

## Arquitectura

Monolito por capas:

- `controller`: entrada HTTP y respuestas
- `service`: reglas de negocio y transacciones
- `repository`: persistencia
- `model`: entidades y lógica de dominio
- `dto` + `mapper`: contratos de entrada y salida

## Modelo conceptual

### Entidades principales

- **Owner**: dueño y datos de contacto.
- **Vet**: veterinario de referencia.
- **Cat**: gato, asociado a un owner y opcionalmente a un vet.
- **Stay**: estancia con fechas, cancelación, notas y owner asociado.
- **StayCat**: entidad intermedia que vincula cada `Stay` con cada `Cat` participante.

### Regla clave de negocio sobre Stay

Una `Stay` representa **una sola estancia**.

Puede incluir:
- un solo gato
- o varios gatos del mismo owner

Todos los gatos de una misma `Stay` comparten:
- `startAt`
- `endAt`
- `cancelledAt`
- `notes`

Si uno de esos gatos debiera salir antes, cancelarse aparte o seguir una lógica distinta, entonces ya no se considera la misma estancia: pasan a ser estancias diferentes.

### Relaciones principales

- `Owner` 1..* `Cat`
- `Vet` 0..* `Cat`
- `Owner` 1..* `Stay`
- `Stay` 1..* `StayCat`
- `Cat` 1..* `StayCat`

No se modela una relación directa persistida `Stay <-> Cat` con un simple `@ManyToMany`. La relación se materializa mediante `StayCat`.

## Decisiones importantes de modelado

### 1) El owner también se guarda en Stay

`Stay` guarda referencia directa a `Owner`.

Motivos:
- preservar mejor el histórico
- evitar que un eventual cambio futuro de owner en `Cat` deforme el historial de una estancia pasada
- simplificar consultas

### 2) La relación Stay-Cat se modela con entidad intermedia

Se usa `StayCat` en lugar de dejar la relación solo como un `@ManyToMany` simple.

Motivos:
- hace explícita la relación en dominio y base de datos
- da más control sobre restricciones
- envejece mejor si más adelante la relación necesitara datos propios

## Reglas de negocio actuales para Stay

- Una `Stay` debe tener al menos un gato.
- Todos los gatos de una `Stay` deben pertenecer al mismo `Owner`.
- El `Owner` de la `Stay` debe coincidir con el `Owner` de todos sus gatos.
- No puede haber el mismo gato repetido dentro de la misma `Stay`.
- `endAt` debe ser posterior a `startAt`.
- Un gato no puede tener solapes de estancias activas con otra `Stay`.
- Una estancia cancelada no se considera activa para la validación de solapes.

## Estado de una estancia

El estado de una `Stay` es **dinámico**. No se persiste como columna.

Se calcula a partir de:
- `startAt`
- `endAt`
- `cancelledAt`
- el momento actual

Estados posibles:
- `RESERVED`
- `CHECKED_IN`
- `CHECKED_OUT`
- `CANCELLED`

## Auditoría

Las entidades principales persisten:
- `createdAt`
- `updatedAt`

Se gestionan con JPA Auditing.

## Base de datos

Puntos importantes del esquema:
- `cats` tiene `owner_id` y `vet_id`
- `stays` ya no tiene `cat_id`
- `stays` pasa a tener `owner_id`
- la relación entre estancias y gatos se guarda en `stay_cats`
- `stay_cats` debe impedir duplicados de la pareja (`stay_id`, `cat_id`)
- `status` no se persiste

## Diagramas

Los diagramas viven en `docs/uml/`:

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

## Desarrollo local

### Requisitos

- Java
- Docker Desktop
- Maven o Maven Wrapper

### Base de datos

1. Copiar `.env.example` a `.env` si hace falta.
2. Levantar MySQL con Docker Compose.
3. Arrancar la aplicación.
4. Flyway aplica las migraciones al iniciar.

## Fuente de verdad

La fuente de verdad del proyecto para arquitectura y modelo es:
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/uml/*`
