# CatWorld Architecture

CatWorld is a full-stack administration system for cat-boarding operations.

This document describes the currently implemented architecture and domain behavior. It is not a permanent limit on future CatWorld product scope.

This document focuses on the backend architecture, domain model, persistence decisions and testing strategy.

## Scope

CatWorld currently covers:

- Owner management.
- Cat management.
- Reference vet management.
- Stay booking management.
- Permanent stay deletion for authorized correction of mistaken records.
- Database-backed HTTP Basic application authentication.
- ADMIN-only application account management with fixed `ADMIN` and `STAFF` roles.
- Lookup of current, future, completed and cancelled stays.

## Stack

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Flyway
- Docker Compose
- JUnit 5
- Mockito
- Angular
- Angular animations
- Angular Material
- Angular CDK
- TypeScript
- SCSS
- FullCalendar
- GitHub Actions
- PlantUML

## Architecture Style

CatWorld is intentionally developed as a layered monolith.

```txt
controller -> service -> repository -> database
```

Main package responsibilities:

- `controller`: HTTP endpoints, request validation entry point and response status handling.
- `service`: business rules, transactions and application use cases.
- `repository`: persistence access through Spring Data JPA.
- `model`: JPA entities and domain behavior.
- `dto`: input and output contracts exposed by the API.
- `mapper`: conversion between DTOs and entities.
- `exception`: custom exceptions and global HTTP exception handling.

The project keeps business rules out of controllers. Controllers delegate to services and focus on the HTTP contract.

## Domain Model

### Main Entities

#### Owner

Represents a cat owner and contact information.

An `Owner` can have:

- multiple cats
- multiple stays
- one application account recorded as its creator

#### Vet

Represents a reference veterinarian.

A `Vet` can be associated with multiple cats, but a cat can also exist without a vet.

Each `Vet` stores the application account that created it.

#### Cat

Represents a cat registered in the boarding system.

A `Cat` belongs to one `Owner` and may optionally reference one `Vet`.

Each `Cat` stores the application account that created it.

#### Stay

Represents one boarding stay.

A `Stay` contains:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`
- `owner`
- participating cats through `StayCat`
- the application account that created it

#### StayCat

Represents the link between a `Stay` and a `Cat`.

The project uses an explicit link entity instead of a plain `@ManyToMany`.

#### UserAccount

Represents an application login account.

A `UserAccount` contains:

- unique username
- encoded password hash
- fixed `ADMIN` or `STAFF` role
- enabled state
- auditing timestamps

`UserAccount` does not store its own creator. Operational creator attribution
is stored only on owner, cat, vet and stay records.

## Stay Model

### Key Rule

A `Stay` represents **one boarding stay**.

It can include:

- one cat
- multiple cats from the same owner

All cats inside the same `Stay` share:

- `startAt`
- `endAt`
- `cancelledAt`
- `notes`

If one cat needs a different checkout time, a separate cancellation or a different lifecycle, it should be modeled as a separate `Stay`.

## Relationships

Main relationships:

- An `Owner` may have zero or more `Cat` records; each `Cat` belongs to one `Owner`.
- A `Vet` may be referenced by zero or more cats; each `Cat` may reference zero or one `Vet`.
- An `Owner` may have zero or more `Stay` records; each `Stay` belongs to one `Owner`.
- A `Stay` contains one or more `StayCat` links.
- A `Cat` may have zero or more `StayCat` links.
- Each `Owner`, `Cat`, `Vet` and `Stay` references the `UserAccount` that
  created it.

The persisted `Stay <-> Cat` relationship is materialized through `StayCat`.

## Modeling Decisions

### Stay Stores the Owner

`Stay` stores a direct reference to `Owner`.

Reasons:

- Preserve historical ownership more clearly.
- Avoid changing past stay history if a cat owner changes later.
- Simplify queries involving stays by owner.

Even though the owner could be derived from the cats, storing it directly makes the stay aggregate easier to query and safer historically.

### Stay-Cat Uses a Link Entity

The relationship between `Stay` and `Cat` is represented with `StayCat`.

Reasons:

- Make the relationship explicit in the domain model.
- Control the database structure directly.
- Prevent duplicate pairs with a composite primary key.
- Leave room for future relationship-specific fields if needed.

### Stay Status Is Dynamic

Stay status is not persisted.

It is computed from:

- `startAt`
- `endAt`
- `cancelledAt`
- current time

Possible statuses:

- `RESERVED`
- `CHECKED_IN`
- `CHECKED_OUT`
- `CANCELLED`

This avoids storing redundant state that can become inconsistent with the dates.

## Stay Business Rules

Current rules:

- A `Stay` must include at least one cat.
- All cats in a `Stay` must belong to the same `Owner`.
- The `Stay` owner must match every cat owner.
- The same cat cannot be repeated inside the same `Stay`.
- `endAt` must be after `startAt`.
- A cat cannot have overlapping active stays.
- Cancelled stays are ignored during overlap validation.
- Closed stays cannot be modified.
- Cancelled stays cannot be cancelled again.
- Permanent stay deletion is separate from cancellation. Authorized deletion
  removes the stay and its `StayCat` links, preserves cat, owner, vet and
  application-account records, and is not blocked by dynamic stay status.

## Persistence

The application uses MySQL in local development through Docker Compose.

Schema management is handled by Flyway migrations under:

```txt
src/main/resources/db/migration
```

Hibernate schema auto-update is not used for development schema evolution. The application validates the schema instead.

Important schema points:

- `owners` stores owner contact data.
- `vets` stores reference vet data.
- `cats` has `owner_id` and optional `vet_id`.
- `stays` has `owner_id`.
- `stays` does not have `cat_id`.
- `stay_cat` stores the relationship between stays and cats.
- `stay_cat` prevents duplicate pairs through primary key `(stay_id, cat_id)`.
- `status` is not persisted.
- `user_accounts` stores persistent application users for HTTP Basic authentication.
- `owners`, `cats`, `vets` and `stays` each store a non-null `created_by_id`
  foreign key to `user_accounts`.

## Authentication

HTTP Basic credentials are authenticated through Spring Security against `user_accounts`.

Successful login returns the canonical stored username and its fixed `ADMIN` or `STAFF` role. Angular keeps that identity and role in its in-memory authentication state alongside the HTTP Basic credentials.

The `/api/users` endpoints list, create and update application users and are restricted to `ADMIN`. Angular exposes the corresponding Accounts area at `/accounts` only to an authenticated `ADMIN` and protects direct route access with the same role distinction. `STAFF` retains access to all existing operational routes. A `403 Forbidden` from `/api/users` clears the potentially stale frontend session, while forbidden responses from unrelated APIs do not trigger that behavior.

On a fresh database, the configured `catworld.security.username` and `catworld.security.password` create the first `ADMIN` account. The password is encoded before it is stored. When any user already exists, startup does not create, update, re-enable or overwrite accounts.

When authenticated users create owner, cat, vet or stay records, the backend
resolves the stored `UserAccount` for the current Spring Security username and
persists it as the record creator. Creator attribution is server-controlled and
is not part of operational client request payloads or response display.

Owner, cat, vet and stay deletion use a shared backend authorization policy.
`ADMIN` accounts may delete operational records regardless of creator or record
age. `STAFF` accounts may delete only records they created, and only while the
record's `createdAt` timestamp remains strictly less than 15 minutes old
according to server time. At exactly 15 minutes, and after that boundary, staff
deletion is forbidden. The policy uses the backend time source and maps
authorization denial to `403 Forbidden`; Angular does not calculate or enforce
this rule. Entity lookup, relationship and state checks stay in the responsible
services outside the shared authorization policy.

Stay responses expose a backend-calculated `canDelete` rendering hint for the
current authenticated user. The hint uses the same shared deletion policy, but
the backend still rechecks authorization for every DELETE request.

## Frontend UI Foundation

The authenticated Angular administration interface uses Angular Material and
Angular CDK as its default UI foundation for interactive components,
application-wide theming and shared UI behavior.

Angular Material was selected and approved as the frontend foundation in
GitHub issue #176. Issue #177 establishes the foundation and migration
boundaries without migrating complete pages, forms, tables, shell controls or
feature workflows.

### Material Theming

`frontend/src/styles.scss` owns the application-wide Material theme.

The theme:

- Uses Angular Material public Sass APIs from `@angular/material`.
- Preserves CatWorld's warm, soft administration identity through the existing
  CatWorld colors, typography and density choices.
- Provides the Material system tokens that future Material components inherit.
- Does not implement the user-facing dark-mode preference tracked by #126.

Material customization must use supported theming APIs and public component
APIs. CatWorld must not rely on private Angular Material selectors, internal
DOM structure or implementation details for customization.

### Styling Responsibilities

Global styles are limited to:

- Material theme setup.
- Document and application-level defaults.
- CatWorld design tokens and CSS custom properties.
- Truly shared utilities.
- Integration boundaries for external libraries.

Component SCSS remains responsible for local layout, responsive composition
and product-specific presentation.

Shared utilities should stay small, semantic and broadly useful across
approved migrated surfaces. They should not become a parallel component system.
Global styles must not recreate native button, input, select, textarea, table
or checkbox component systems for authenticated administration surfaces that
use Angular Material.

FullCalendar remains a custom integration where Material does not provide the
relevant calendar interaction or structure. FullCalendar-specific styling stays
explicitly separate from Material component customization.

### Material Completion and Native Boundaries

Authenticated administration controls use Angular Material when Material
provides the matching interaction role. CatWorld no longer keeps a global
native-control styling system alongside the Material foundation.

Retained native markup is limited to explicit boundaries:

- Native `<select>` elements may remain inside `mat-form-field` with
  `matNativeControl` for short option lists where Angular Material explicitly
  supports the native select control and the existing form behavior does not
  require the custom `mat-select` overlay.
- FullCalendar owns its internal buttons, tables and event markup. CatWorld
  styles that vendor boundary only through the calendar component integration
  styles, not through global native-control selectors.
- Browser-provided dialogs such as cancellation confirmation prompts remain
  browser controls unless a feature explicitly approves replacing the
  interaction.

Any future retained native control in an authenticated administration surface
must record its reason and must not depend on global legacy native-control
styling.

### Material Shell and Shared States

The authenticated application shell uses Angular Material toolbar, menu, button
and icon primitives for global navigation, language switching and session
actions while preserving the existing route and guard structure. Desktop
navigation remains visible in the toolbar; narrow viewports use the Material
menu trigger without adding product routes or changing the navigation
information architecture.
The root application configuration provides Angular animations for Material
overlays and interactive shell components.

Reusable loading, empty and error states live under
`frontend/src/app/shared/ui-state/`. Pages continue to own data fetching,
filtering, retries and domain decisions; the shared state component owns only
Material-themed presentation, accessible status or alert semantics and optional
retry-action rendering.

### Material Forms

The login, account management, owner create/edit, vet create/edit, cat
create/edit and stay create/edit forms use Angular Material form fields,
inputs, supported native selects, checkboxes and buttons for their interactive
controls where Material provides the matching control role. Each routed form
page keeps its own signal-based field state, request payload shaping, submit
method, navigation and responsive form layout in component SCSS.

Required-field validation for these migrated forms is presented through
Material field errors while preserving existing validation rules and submit
timing where the control has field-level validation. Page-level loading,
backend errors and cross-field or selection errors use the shared
`UiStateComponent` where that presentation fits the existing behavior.

Calendar app-owned filters, display options, stays overview status filters and
shared stay search filters are Material-based. FullCalendar vendor-owned
controls remain a separate integration boundary. Material inputs, supported
native selects, checkboxes and buttons do not depend on legacy global
native-control selectors.

### Component Conventions

Standalone Material imports belong in the standalone component that directly
uses them, or in a narrowly scoped shared component that owns a real CatWorld
pattern. CatWorld should not introduce a broad global Material module that
re-exports many unused Material modules.

Icons should support recognition without replacing clear operational text.
Primary actions should keep text labels where practical. Decorative icons must
be hidden from assistive technology, and icon-only controls must have an
accessible name and a clear visible or tooltip-supported affordance.

Typography and density are configured through the Material theme. Local
typography or density overrides should be limited to documented product
exceptions on specific components.

## Auditing

Main entities include:

- `createdAt`
- `updatedAt`

These fields are managed with JPA Auditing.

Operational entities also include required creator attribution:

- `Owner.createdBy`
- `Cat.createdBy`
- `Vet.createdBy`
- `Stay.createdBy`

Creator attribution is assigned by services during creation and enforced by
database foreign keys. It is separate from JPA timestamp auditing.

## Error Handling

The API uses custom exceptions for common error cases:

- resource not found
- bad request
- conflict

A global exception handler translates application exceptions into HTTP responses.

Typical mappings:

- `ResourceNotFoundException` -> `404 Not Found`
- `BadRequestException` -> `400 Bad Request`
- `ConflictException` -> `409 Conflict`
- validation errors -> `400 Bad Request`

## Testing Strategy

Testing focuses on backend business rules and HTTP contracts, complemented by behavior-level frontend tests for critical authentication and calendar flows.

### Service Tests

Service tests cover business rules directly.

Current focus:

- stay creation rules
- owner consistency
- overlap validation
- cancellation flow
- update flow rules

Repositories and mappers are mocked where appropriate.

### Controller Tests

Controller tests cover the HTTP contract.

Expected focus:

- request methods and paths
- response status codes
- request validation
- path variables
- service delegation
- exception mapping through the global exception handler

Controller tests should use Spring MVC slice testing instead of booting the full application context unless there is a concrete reason.

### CI

GitHub Actions runs backend and frontend validation automatically.

Workflow files:

```txt
.github/workflows/backend-ci.yml
.github/workflows/frontend-ci.yml
```

Both workflows:

- run on pull requests targeting `main`
- run on pushes to `main`
- support manual `workflow_dispatch`

The backend workflow:

- sets up Java 17
- uses Maven dependency caching
- runs `./mvnw verify`

The frontend workflow:

- runs from `frontend/`
- sets up Node.js 22
- uses npm dependency caching
- runs `npm ci`
- runs `npm run build`
- runs `npm run format:check`
- runs `npm run test:ci`

## Codex Workflow Routing

CatWorld uses two Codex workflow paths at the repository level: the current
sequential issue implementation workflow and a future sidecar coordinator
parallel workflow. This section documents routing only; it does not change
CatWorld product behavior, application architecture, persistence,
authorization, APIs, frontend behavior or operations.

`AGENTS.md` keeps the short, mandatory routing guardrails. This document is the
longer source-of-truth explanation for maintainers and future Codex sessions.

### Default Sequential Workflow

The current one-issue/one-PR implementation workflow remains the default path.

Use the existing sequential workflow for:

- a normal implementable issue requested end-to-end;
- a direct child issue requested end-to-end;
- issues #220 through #234 while the sidecar parallel workflow is still being
  designed, validated and adopted.

Direct child issues do not need coordinator orchestration when the user asks to
implement them one by one. They are treated like ordinary implementable issues
and run through the existing sequential workflow.

### Sidecar Coordinator Parallel Workflow

The sidecar coordinator parallel workflow is an opt-in addition, not a
replacement for the sequential workflow.

Parallel mode is valid only when all of these are true:

- the prompt explicitly includes `parallel`;
- the issue is clearly a coordinator issue;
- the sidecar coordinator parallel workflow has been implemented and adopted.

Parallel readiness is determined by the sidecar workflow's own safety review,
not by an issue label. The readiness decision must come from:

- coordinator preflight;
- child issue inspection;
- dependency classification;
- source-of-truth review.

Codex must not require a `parallel-ready` label, and it must not invent one.
Labels may become useful metadata later, but labels are not the source of truth
for parallel safety.

`parallel` on a non-coordinator issue is an invalid routing request. Codex must
stop and report that parallel mode only applies to coordinator issues instead
of ignoring the flag or silently falling back to sequential execution.

The sidecar workflow owns its own future skills and operating rules. It must
not require changes to `.agents/skills/catworld-implement-issue/SKILL.md` to
exist beside the current sequential workflow.

Issue #226 adds `.agents/skills/catworld-parallel-coordinator/SKILL.md` as the
first sidecar coordinator entrypoint. Issue #227 extends that same sidecar
skill with artifact preparation before delegation. The entrypoint may classify
explicit coordinator `parallel` requests when routing guardrails allow sidecar
use and may prepare or require sidecar coordinator and child artifacts after
preflight, but it must still stop before child implementation, Git branch or
worktree operations, pull request handling, GitHub issue mutation or CatWorld
product code changes. Issues #220 through #234 continue to use the current
sequential workflow guardrails during the sidecar build-out and adoption work.

Issue #228 adds
`.agents/skills/catworld-parallel-child-implementation/SKILL.md` as the
separate sidecar child implementation skill. That skill is a prepared child
handoff consumer only: it requires a child issue body, coordinator context,
prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, validation
requirements, dependency status and target coordinator branch/worktree context
from the sidecar coordinator artifacts before it can implement anything. It
does not perform coordinator preflight, create planning artifacts, redefine
shared contracts, create branches or worktrees, open pull requests, mutate
GitHub issues or replace the normal sequential workflow.

Issue #229 adds sidecar Git execution rules for coordinator branch, child
branch, isolated checkout/worktree, merge-only refresh and cleanup boundaries.
Those rules apply only to the opt-in sidecar coordinator parallel workflow.
Issue #230 adds sidecar PR target, issue closure, GitHub mutation, public
comment and remote cleanup approval rules. Those rules define delivery
authority only; they do not open real pull requests, merge pull requests,
mutate GitHub issues, post public comments or change normal sequential PR
behavior. Issue #231 adds sidecar validation, blocker, conflict, stale-evidence,
readiness and human-only blocker reporting rules. Those reporting rules do not
change normal sequential validation or final reporting.

Direct child issues requested outside coordinator `parallel` execution still
use the existing sequential workflow. Closed-child coordinator final passes
also stay in the existing sequential workflow and do not route into the
sidecar child implementation skill.

### Sidecar Artifact Preparation

Before any future sidecar delegation, the coordinator entrypoint prepares or
requires a coordinator orchestration artifact and issue-numbered child
implementation artifacts. The coordinator artifact must contain a child issue
map, dependency layers, shared contract section, validation plan and status
table. Each child issue must have prepared or described `spec.md`, `plan.md`
and `tasks.md` artifacts under the #225 child artifact path.

Artifact preparation must validate child artifacts against the coordinator
issue, child issue bodies, relevant source-of-truth documentation and shared
contracts. It must stop before delegation when prepared artifacts are missing
or unsafe, artifact paths collide, shared contracts are missing or unresolved,
dependencies are unsafe, or scope conflicts remain.

The sidecar coordinator must not invent or create seed, foundation or
shared-contract child issues unless those issues already exist or the user
explicitly approves creating them in a workflow that permits issue mutation.
Closed-child coordinator final passes remain in the existing sequential
workflow and do not use sidecar artifact preparation.

### Sidecar Artifact Paths

These artifact path rules apply only to sidecar coordinator parallel execution.
They do not change normal sequential Spec Kit behavior. Normal issue
implementation continues to use whatever artifact directory naming the
sequential workflow creates.

Sidecar coordinator artifacts use:

```text
specs/<coordinator-number>-coordinator-<slug>/
```

Sidecar child implementation artifacts use:

```text
specs/<child-issue-number>-<child-slug>/
```

The GitHub issue number is the authoritative uniqueness key in each sidecar
artifact path. The slug is descriptive. Build the slug as a stable, lowercase,
hyphen-separated title slug after removing issue title prefixes such as
`[Workflow]`, `[Epic]`, or conventional type prefixes such as `feat:` or
`docs:` when present. Replace non-alphanumeric runs with a single hyphen and
trim leading or trailing hyphens.

Before creating sidecar artifacts, future sidecar preparation must compute the
coordinator target path and every child target path. It must stop and report a
collision instead of overwriting, merging, deleting, silently reusing, or
automatically renaming artifacts when any of these are true:

- the exact target path already exists;
- a coordinator artifact directory already exists with the same
  `<coordinator-number>-coordinator-` prefix;
- a child artifact directory already exists with the same
  `<child-issue-number>-` prefix;
- the coordinator child list contains the same child issue number more than
  once.

Different child issue numbers that normalize to the same slug do not collide,
because their issue-number prefixes remain distinct. Duplicate child issue
numbers do collide and must stop sidecar artifact preparation before any
artifacts are created.

A coordinator final pass after all listed child issues are closed uses the
existing sequential workflow. It does not require sidecar artifact naming; if
the sequential workflow creates artifacts during that final pass, it creates
them on its own terms.

### Sidecar Git Execution Rules

These Git rules apply only to sidecar coordinator parallel execution after
routing guardrails, coordinator preflight, source-of-truth review, dependency
classification, artifact preparation and shared-contract validation have all
succeeded. They do not change normal sequential issue implementation, direct
child issue implementation outside `parallel`, or closed-child coordinator
final passes.

Coordinator parallel work uses one coordinator integration branch created from
current `origin/main`. CatWorld must not update local `main`, merge unrelated
work into `main`, or use `main` as a sidecar delivery branch while preparing
that coordinator branch.

Sidecar names are deterministic:

- coordinator branch and checkout/worktree name component:
  `<coordinator-number>-coordinator-<slug>`;
- child branch and checkout/worktree name component:
  `<child-issue-number>-<child-slug>`.

The slug follows the sidecar artifact slug rule: lowercase, hyphen-separated
title text after removing issue title prefixes such as `[Workflow]`, `[Epic]`,
`feat:` or `docs:`. The coordinator artifact records the full branch names and
full local checkout/worktree paths. The local parent directory is workflow
context, but each local sidecar directory name must use the deterministic
component above.

Before creating, switching to, merging into, or reusing a sidecar Git resource,
the workflow must compute every target branch and checkout/worktree name.
Branch, checkout, worktree, directory and artifact collisions stop execution
unless the coordinator artifact or explicit user-provided context proves the
resource is the intended sidecar resource for the same issue and slug. The
workflow must not guess, overwrite, delete, silently reuse or automatically
rename colliding resources.

Each child implementation branch starts from the coordinator branch, not from
`main`. Each active child implementation uses an isolated local
checkout/worktree recorded in the coordinator artifact and supplied in the child
handoff.

Sidecar child PR guidance must target the coordinator branch. Sidecar child PRs
must not target `main` directly.

After the user merges a child PR into the coordinator branch, every still-active
sidecar child branch or worktree that needs the latest coordinator state is
updated from the coordinator branch using a normal merge. Sidecar branches must
not be rebased, force-pushed or updated with any history-rewriting operation.

Local sidecar branches and worktrees are not deleted after individual child PR
merges. Local cleanup is eligible only after the final coordinator PR has been
merged into `main`, and only for local branches and worktrees created by the
sidecar workflow. Remote branch deletion, remote pruning and any remote cleanup
require explicit user approval.

### Sidecar PR Delivery Rules

These pull request rules apply only to sidecar coordinator parallel delivery.
They do not change normal one-issue/one-PR delivery, direct child issue
delivery outside `parallel`, or closed-child coordinator final passes.

Sidecar child PRs target the coordinator integration branch. They must not
target `main` directly. Their descriptions reference the child and coordinator
issues with `Related to #<child-issue>` and
`Related to #<coordinator-issue>` wording only. Child PRs must not close the
child issue or coordinator issue, and they must not imply that the child PR is
the final delivery PR to `main`.

The final sidecar coordinator PR targets `main` from the coordinator
integration branch. It may close the coordinator issue and child issues in the
sidecar set, and it should list integrated child PRs or child issue references
clearly enough for reviewer traceability. The final coordinator PR is the only
sidecar PR that may close the coordinator set during sidecar parallel
delivery.

Codex reports readiness for sidecar child PRs and the final coordinator PR.
The user performs merges. Codex must not merge, approve or enable auto-merge
on pull requests.

GitHub issue body, checklist, label, assignee, milestone, issue state and
public comment mutations require explicit user approval in a workflow that
permits the operation. PR description wording is not permission to separately
modify issue metadata, issue bodies, checklists, issue state or public
comments. Remote branch deletion, remote pruning and remote cleanup also
require explicit user approval.

Normal one-issue sequential PR behavior keeps its current target and closure
behavior. Direct child issue work outside explicit sidecar `parallel` mode also
uses normal sequential PR behavior. A closed-child coordinator final pass uses
normal sequential PR behavior and remains outside the sidecar child/final PR
model.

### Sidecar Validation, Blocker and Conflict Reporting

These reporting rules apply only to sidecar coordinator parallel execution.
They do not change normal one-issue sequential validation, direct child issue
reporting outside `parallel`, or closed-child coordinator final-pass reporting.

Sidecar child reports and coordinator integration reports list every required
command, manual review, local sample artifact and consumed child validation
result. Each item uses an explicit status:

- `passed`
- `failed`
- `skipped`
- `timed out`
- `interrupted`
- `partial`
- `stale`
- `not run`

Failed validation is never summarized as passed. Failed, timed-out, skipped,
interrupted, partial, stale and not-run validation is never summarized as
passed. A report may contain passed evidence, but the summary still preserves
every non-passed status and its readiness impact.

Validation becomes stale when a coordinator branch update, child branch refresh,
conflict resolution or other relevant change could affect previous evidence.
Stale evidence must be rerun before sidecar readiness is reported, or it stays
explicitly reported as stale. Coordinator readiness must not consume stale
child evidence as fresh evidence.

A sidecar child PR is ready only when required validation is fresh and passed,
no unresolved blocker affects the child, and the approved sidecar PR target and
issue-reference rules are satisfied. A sidecar child PR is draft when required
validation is failed, skipped, timed out, interrupted, partial, stale, not run
or blocked, unless the non-passed evidence is explicitly outside child
readiness and the report explains why. Final coordinator readiness follows the
same freshness and blocker principle for coordinator-level and consumed child
evidence.

Sidecar reports distinguish:

- child-specific blockers that affect exactly one child issue;
- coordinator-wide blockers that affect the coordinator branch, integration
  set or multiple children;
- shared-contract blockers that affect cross-child contracts or handoff
  expectations;
- conflict blockers that require user guidance;
- human-only blockers that Codex must not decide.

Shared-contract blockers stop affected sidecar work until resolved or until
user guidance is provided.

Non-trivial conflicts affecting contract, scope, persistence, security, authorization, UX, or domain behavior require user guidance. The report names the conflicting inputs, affected source surfaces, blocked child or coordinator scope and guidance needed before work can continue.

Human-only blockers include new significant dependencies, material architecture
changes, production exposure, secrets, deployment changes, Git/GitHub workflow
outside the approved model and unresolved product, persistence, security,
authorization, UX, domain, contract, validation, operational or scope
decisions. The report names the category, evidence, affected scope and required
human decision instead of letting Codex decide silently.

Codex must not modify GitHub issue bodies, checklists, labels, assignees,
milestones, issue state or public comments unless the user explicitly requests
that operation in a workflow that permits it.

A closed-child coordinator final pass uses normal sequential validation and
reporting. It may reference closed child issues for traceability, but it must
not present closed child issue scope as newly implemented work.

### Coordinator End-to-End Requests

A coordinator issue requested end-to-end without `parallel` must be inspected
read-only before workflow selection. The listed sub-issues decide whether the
request can proceed.

If any listed sub-issue is still open, Codex must stop with a routing error.
The user can either run the coordinator with explicit `parallel` once the
sidecar workflow is available, or implement the open sub-issues directly
through the sequential workflow.

If all listed sub-issues are closed, Codex enters the existing sequential
workflow for a coordinator final pass. This is not a separate workflow.

During coordinator finalization, Codex must not reimplement closed sub-issue
scope just because the coordinator preserves the original scope. The final pass
may:

- verify preserved coordinator scope;
- run required validation;
- complete remaining coordinator-level work;
- prepare final delivery only when repository changes remain;
- report that no diff is needed.

This final pass keeps closed child scope closed and uses the same delivery
safety rules as normal sequential issue work.

## Diagrams

PlantUML diagrams live in:

```txt
docs/uml/
```

Current diagrams:

- `01-domain-classes.puml`
- `02-db-schema.puml`
- `03-components.puml`
- `04-sequence-create-stay.puml`

## Public Repository Notes

No real credentials are required to run this project locally.

The committed environment examples use dummy local values. The real `.env` file is ignored by Git.

Database credentials for real environments must be provided through environment variables or external secret management, not committed to the repository.

## Source of Truth

The source of truth for architecture and modeling is:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/uml/*`
