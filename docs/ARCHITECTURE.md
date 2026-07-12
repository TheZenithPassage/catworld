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
sequential issue implementation workflow and the sidecar coordinator parallel
workflow. Sidecar routing is a controlled explicit opt-in for clearly identified
coordinator requests that include `parallel` and pass the current fail-closed
preflight. This section documents routing only; it does not change CatWorld
product behavior, application architecture, persistence, authorization, APIs,
frontend behavior or operations.

`AGENTS.md` keeps the short, mandatory routing guardrails. This document is the
longer source-of-truth explanation for maintainers and future Codex sessions.

### Default Sequential Workflow

The current one-issue/one-PR implementation workflow remains the default path.

Use the existing sequential workflow for:

- a normal implementable issue requested end-to-end;
- a direct child issue requested end-to-end;
- issues #220 through #234, which remain excluded from sidecar parallel
  routing.

Direct child issues do not need coordinator orchestration when the user asks to
implement them one by one. They are treated like ordinary implementable issues
and run through the existing sequential workflow.

### Sidecar Coordinator Parallel Workflow

The sidecar coordinator parallel workflow is an opt-in addition, not a
replacement for the sequential workflow.

Parallel mode is valid only when all of these are true:

- the prompt explicitly includes `parallel`;
- the issue is clearly a coordinator issue;
- the issue is not within the permanent #220 through #234 exclusion; and
- current coordinator, child, dependency, source-of-truth, repository and
  capability evidence is complete, consistent and safe.

A request satisfying that predicate is a `routing-authorized run`. The
predicate fails closed: missing, ambiguous, duplicated, stale, contradictory,
unavailable or unsafe evidence stops routing before artifact writes, Git or
worktree mutation, fan-out or child dispatch. A title, label, branch prefix,
prior fixture identity or private conversation does not establish current
authorization.

Issue #260's controlled dry-run was the accepted pre-activation validation
stage. Its preserved evidence under `specs/034-live-sidecar-dry-run/` is
historical and is not an active routing gate or authority for current runs.

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

The sidecar workflow owns its operating rules. The sequential skill may route a
qualifying request to the sidecar entrypoint, but it must not duplicate the
sidecar lifecycle, artifact, Git, handoff, resume, validation or delivery rules.

During the sidecar build-out, issue #226 added
`.agents/skills/catworld-parallel-coordinator/SKILL.md` as the first sidecar
coordinator entrypoint, and issue #227 added artifact preparation before
delegation. Issue #260 then completed the accepted controlled dry-run, and
issue #261 activated the assembled workflow. Current eligible coordinator
`parallel` requests route only to the sidecar coordinator workflow. A
routing-authorized run may execute the approved #249 lifecycle when safe.
GitHub issue mutation outside final PR closing keywords, public comments,
remote cleanup, PR merging, auto-merge, force-push, and human-only decisions
remain restricted by the approved sidecar rules. Issues #220 through #234
continue to use the current sequential workflow guardrails.

Issue #228 originally added
`.agents/skills/catworld-parallel-child-implementation/SKILL.md` as a prepared
child handoff consumer. At that issue stage it did not open pull requests;
issue #256 later made implementation and child PR delivery executable under the
durable launch, release, validation, delivery and repository gates described
below. The current skill still requires a child issue body, coordinator
context, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract, validation
requirements, dependency status and target coordinator branch/worktree context
from the sidecar coordinator artifacts before it can implement anything. It
does not perform coordinator preflight, create planning artifacts, redefine
shared contracts, create branches or worktrees, mutate GitHub issues or replace
the normal sequential workflow.

Issue #229 adds sidecar Git execution rules for coordinator branch, child
branch, isolated checkout/worktree, merge-only refresh and cleanup boundaries.
Those rules apply only to the opt-in sidecar coordinator parallel workflow.
Issue #230 adds sidecar PR target, issue closure, GitHub mutation, public
comment and remote cleanup approval rules. Those rules define delivery
authority only; they do not open real pull requests, merge pull requests,
mutate GitHub issues, post public comments or change normal sequential PR
behavior. Issue #231 adds sidecar validation, blocker, conflict, stale-evidence,
readiness and human-only blocker reporting rules. Those reporting rules do not
change normal sequential validation or final reporting. Issue #232 adds
resumable state tracking for sidecar coordinator runs. That state records child
workflow status, resume re-read evidence, refresh state, stale validation and
cleanup eligibility, and it does not change normal sequential issue state.
Issue #253 makes prepared child Spec Kit artifacts a coordinator responsibility
before delegation: each dependency-ready child requires an issue-numbered
`spec.md`, `plan.md` and `tasks.md` set, coordinator-recorded preparation
status, write-gate evidence and handoff instructions that prevent child-side
artifact regeneration.
Issue #254 makes the approved sidecar branch/worktree orchestration
execution-capable for routing-authorized coordinator runs: the coordinator owns
coordinator branch/worktree preparation, normal non-force coordinator branch
pushes, child branches from the coordinator branch, isolated child worktrees,
and dirty/collision/unsafe-push stop behavior before child delivery can
proceed. Issue #255 makes dependency-layer fan-out execution-capable for that
routing-authorized lifecycle: after prepared child artifacts and
branch/worktree state are ready, the coordinator durably records and pushes
`handoff-ready` evidence for only the first dependency-ready layer, then uses
the held-dispatch barrier below. It stops when child-agent/subagent capability
is unavailable, records factual launch or non-launch status for every child,
and gives each dispatched child exactly one prepared handoff.
Issue #256 makes that held handoff executable: the same accepted child identity
must verify durable factual `launched` evidence and receive targeted release
before it implements tasks from the prepared child `tasks.md`. It runs required
validation with explicit statuses and may commit, push normally and open or
update the child PR only when current implementation, delivery, repository and
PR gates all pass.
Issue #257 makes coordinator resume merge-aware after user-owned child PR
merges: Codex re-reads current GitHub and repository evidence, fetches and
refreshes local coordinator state from the remote coordinator branch before
active child refresh, marks affected validation stale, records integrated,
active, blocked, pending and ready-next-layer child states, and launches a next
dependency-ready layer only when hard dependencies are integrated into the
updated local coordinator branch.
Issue #258 made the final coordinator boundary executable for a
routing-authorized run: after every prepared child is ancestry-proven
integrated, the coordinator runs the complete integrated suite at `H`, commits
only the factual finalization artifact as direct child `H2`, validates and
normally pushes that artifact-only head, reviews the PR-equivalent scope, and
opens one ready coordinator-to-`main` PR only while all current evidence
remains fresh. Historically, the #258 implementation PR was part of the #249
build-out, so it targeted `workflow/sidecar-buildout` and used
`Related to #258`; that issue-stage delivery context does not change the current
runtime coordinator-branch-to-`main` contract or its final-only closing
authority. Issue #259 made the post-final-merge local cleanup boundary
executable. It
keeps H2 and the tracked finalization artifact frozen, records cleanup state in
a minimal journal beneath the repository's Git common directory, and permits
only explicitly authorized removal of clean local branches and worktrees whose
exact ownership is proven for the same stable sidecar run. Historically, the
#259 implementation branch started from `origin/workflow/sidecar-buildout`, its
PR targeted `workflow/sidecar-buildout`, and it used `Related to #259`. That
issue-stage delivery context does not change the current runtime rule that a
coordinator branch starts from current `origin/main` and its final PR targets
`main`.

Direct child issues requested outside coordinator `parallel` execution still
use the existing sequential workflow. Closed-child coordinator final passes
also stay in the existing sequential workflow and do not route into the
sidecar child implementation skill.

### Sidecar Executable Lifecycle

The executable sidecar lifecycle starts or resumes only for a current
`routing-authorized run`: a clearly identified, non-excluded coordinator request
that explicitly includes `parallel` and passes coordinator preflight,
source-of-truth review, child issue inspection, dependency classification and
all safety checks. Any missing, stale, inconsistent or unsafe prerequisite stops
before downstream mutation and reports the explicit blocker.

The lifecycle states are:

1. New coordinator `parallel` run.
2. Coordinator preflight.
3. Source-of-truth and child issue inspection.
4. Sidecar artifact path and content planning, without writing files.
5. Dependency-layer planning.
6. Coordinator branch/worktree preparation.
7. Coordinator and child artifact writing inside the coordinator
   branch/worktree.
8. Child branch/worktree preparation.
9. Durable handoff-ready evidence and recording push, held child dispatch,
   factual launched evidence and activation-record push, ancestry verification
   and targeted release for one dependency-ready layer.
10. Child implementation and child PR delivery.
11. Waiting for user merges into the remote coordinator branch.
12. Resume after user merges.
13. Fetch and refresh local coordinator branch/worktree from the remote
    coordinator branch.
14. Active child branch refresh from the updated local coordinator branch by
    normal merge only when needed.
15. Next dependency layer execution.
16. Integrated coordinator validation.
17. Final coordinator PR to `main`.
18. Post-final-merge local cleanup evaluation and explicitly authorized local
    execution.

Each state must define entry conditions, stop conditions and allowed next
states in the sidecar coordinator skill. If a stop condition applies, Codex
reports the lifecycle state, evidence read, blocking condition and required
user action when applicable.

State 16 begins only after current GitHub, repository, branch and artifact
evidence proves that the prepared-child ledger is complete and unique; every
child PR targeted and was merged into the coordinator branch; every delivered
child commit is present in refreshed coordinator ancestry; and no child is
active, blocked, pending, dependency-incomplete, missing, duplicate or
unexpected. It stops on incomplete accounting, metadata without ancestry,
non-passing or unavailable required validation, invalid `H`/`H2` evidence,
target-base or head movement, or unexplained integrated scope. Once this gate
passes and finalization starts, no new child layer may be launched.

State 17 begins only after complete validation passed at `H`; `H2` is proven
to be the direct child of `H` and changes only the allowed finalization
artifact; every artifact-affected check passed at `H2`; a normal non-force
push made the fetched remote coordinator ref equal `H2`; and target-base,
merge-base, local and remote head, ancestry, scope, validation, template and
existing-PR evidence were rechecked and remain fresh. A stale or inconsistent
existing final PR, ambiguous same-run identity, invalid source, target,
template, issue wording, closing authority or readiness, a failed check, a
remote-head mismatch, or need for a draft fallback or duplicate stops final
delivery. Cleanup remains ineligible until the user merges the runtime final
PR into `main`.

State 18 first resolves the repository Git common directory and writes the
same-run local cleanup journal. A known-unmerged final PR remains ineligible;
missing, stale or inconsistent merge evidence blocks cleanup. Eligibility
requires one unique same-run final PR whose expected coordinator source and H2
head, `main` base, merged state and current `origin/main` merge evidence all
agree. Eligibility alone never deletes anything: destructive local cleanup
also requires explicit current authority. Unknown ownership, an inconsistent
Git common directory, dirty candidate worktree state, an unsafe control
checkout or a journal-write failure stops before the first deletion. During an
authorized attempt, an owned worktree is removed before its associated local
branch is deleted non-force; every attempt is journaled, and any failure stops
the remaining operations with a truthful blocked or partial result.

Codex-owned operations include read-only issue and PR inspection, artifact
planning, permitted local branch/worktree preparation for a routing-authorized
run, artifact writing inside the coordinator branch/worktree, dependency-ready
child held dispatch, factual launch-state persistence, targeted child release,
PR readiness reporting, allowed local refresh, integrated validation reporting,
the normal non-force push of artifact-only `H2`, and creation or a separately
permitted safe update of one ready final coordinator PR after every finalization
gate passes. After final merge, Codex may perform
the explicitly authorized, same-run local cleanup defined below. The user owns
all merges: child PRs into the remote coordinator branch and the final
coordinator PR into `main`. The sidecar local cleanup phase never mutates
GitHub issues or comments, merges or approves PRs, enables auto-merge, deletes
or otherwise cleans up remote branches, or prunes remotes or remote-tracking
refs.

The sidecar coordinator builds dependency layers from child issue dependencies,
conflict risks, shared implementation contract state, prepared artifact state,
branch/worktree state and current repository/coordinator branch evidence. It
does not treat issue order alone as proof that a child is ready.

The sidecar coordinator launches at most one dependency-ready layer at a time.
Multiple child issues in the same layer may be active only when they are
independent candidates, all required prepared artifacts and branch/worktree
context are handoff-ready in an exact immutable evidence commit that is
ancestry-proven in the current fetched remote recording head, the approved
child-agent/subagent capability can preserve one stable child identity from
held acceptance through targeted release, and no unresolved conflict risk or
shared-contract blocker exists. A hard-dependent layer waits until prerequisite
child PRs are merged into the coordinator branch, the local coordinator
branch/worktree has been refreshed from the remote coordinator branch, affected
active child branches/worktrees have been refreshed by an allowed method, and
required validation state is known. Stale validation remains stale until rerun
and must not support ready status. If the required held child-agent/subagent
capability is unavailable, Codex stops and reports a capability blocker instead
of silently falling back to sequential implementation.

### Sidecar Artifact Preparation

Before any routing-authorized sidecar delegation, the coordinator entrypoint
prepares or requires a coordinator orchestration artifact and issue-numbered
child implementation artifacts. The coordinator artifact is the durable run
record.
It must contain one exact stable `run_id`, coordinator issue number, title,
URL, labels,
state and source references; inspected child issue list; parent/source
references when relevant; child issue map; dependency layers; hard
dependencies; conflict risks; independent candidates; unresolved blockers;
shared implementation contract; child-owned surfaces; shared surfaces requiring
caution; branch and worktree plan; PR target plan; validation plan;
resume/status table; stop conditions; final coordinator PR plan; sidecar Git
state; sidecar PR delivery state; sidecar validation reporting state; and
sidecar resume state. Before H2 freezes the artifact, its sidecar Git state
must identify the normalized repository Git common directory and the exact
local branch and worktree path associations created for that `run_id`; names
or live Git state alone are not ownership evidence. Each child issue must have
prepared or described
`spec.md`, `plan.md` and `tasks.md` artifacts under the #225 child artifact
path.

Finalization extends that durable record with:

- one complete and unique terminal child-integration ledger containing each
  prepared child's PR target, observed merge, refreshed coordinator ancestry
  proof and terminal workflow state;
- integrated validation accounting that preserves historical attempts and
  records exactly one current result for every requirement, evaluated head and
  relevant input set; consumed child results remain identified as consumed
  evidence and never replace a required integrated coordinator check;
- the integrated scope review, including freshly fetched `origin/main`
  target-base SHA `B`, PR-equivalent merge base, changed paths and surfaces,
  combined coordinator/child source-map reconciliation and any unexplained
  scope blocker;
- literal integrated head `H`, artifact-only `H2` identified in its own
  artifact as `SELF/HEAD`, expected parent `H`, direct-parent and sole-path
  proof requirements, complete canonical H results, the canonical status-free
  H2 rerun manifest and a non-empty applicability reason for each H result
  consumed at H2;
- H scope state, post-H2 scope/base recheck criteria, readiness
  `pending H2 checks`, final-template blob identity and render-input
  requirements, remaining risks, and cleanup `ineligible` with reason
  `pending final PR merge`; and
- current evidence for normal non-force H2 push/fetched remote-H2 proof,
  stable same-run final-delivery identity, observed existing final PR state,
  resolved H2 statuses, final scope and readiness, rendered-body fingerprint
  and GitHub-returned PR URL in final reporting; post-final-merge cleanup state
  belongs in the local Git-common-dir journal described below.

The branch-bound H2 artifact records only facts available when H2 is created.
It must not preclaim its resolved self SHA, post-H2 statuses, final scope,
readiness, rendered-body fingerprint, PR URL or later cleanup result. Those
facts remain current repository/GitHub evidence, local cleanup-journal state
and final-report state. H2 and
`specs/032-final-coordinator-delivery/finalization.md` remain immutable; the
workflow must not create H3, H4 or any other coordinator-branch commit merely
to persist post-H2 or cleanup evidence.

The child status table must be detailed enough for a later session to identify
completed, active, blocked and pending sidecar child work without private
conversation context. Each child row records child artifact path, branch, local
checkout/worktree, PR, validation state, workflow status, launch status,
artifact preparation status, implementation and delivery permissions, blockers,
dependency layer, readiness, refresh state, cleanup eligibility and required
validation when those values exist. Held-dispatch rows also record the exact
handoff-ready evidence commit SHA and exact factual launched evidence commit SHA
after later commits can safely persist those literal prior SHAs, plus the
prepared-handoff identity or fingerprint, stable accepted child/task identity,
release state and proof that the child worktree remained clean through the
barrier. Current remote recording and activation/record heads remain separately
observed fetched-ref evidence; the tracked row is not required to self-record
the SHA of the commit that contains it. Pending child rows may record
not-started branch, checkout, PR and validation state, but they must not imply
that local Git resources exist.

The coordinator artifact is updated only with factual run state and only until
the artifact-only H2 commit freezes it. Before that boundary it records blocked
state, child handoff readiness, child handoff launch, child PR creation, user
merge observation, children waiting for dependency merges, stale validation,
next-layer readiness, terminal child accounting, H validation completion and
the pending H2 manifest when those states actually occur. It must distinguish
planned, blocked, prepared, handoff-ready, launched, integrated, ready, created,
observed, stale, passed, failed, pending, `pending-H2-checks`,
waiting-for-dependency-merge and ineligible states, and must not imply that
branches, worktrees, pull requests, launches, merges, validation results,
readiness or cleanup eligibility exist before they are real. Resolved H2
results, remote-H2 proof and final PR state remain current
repository/GitHub evidence after H2. Later cleanup eligibility, attempts and
results are persisted in the local cleanup journal and may be reported, but
they do not cause an artifact update, H3 or H4.

Artifact preparation must validate child artifacts against the coordinator
issue, child issue bodies, relevant source-of-truth documentation, current
repository state, dependency-layer classification and shared contracts. It must
stop before delegation when prepared artifacts are missing or unsafe, artifact
paths collide without proven same-run identity, shared contracts are missing or
unresolved, duplicate child issue numbers appear, dependencies are unsafe, or
scope conflicts remain. Prepared child artifacts must preserve each child issue
scope exactly. A child artifact that includes sibling child scope, creates work
for sibling-owned surfaces, invents a foundation or shared-contract child issue,
or makes human-only product, architecture, security, persistence, UX, domain,
GitHub, deployment or workflow decisions blocks delegation.

Prepared child artifact status is recorded in the coordinator artifact. Planned
means path and content are known but no files have been written. Blocked means
the blocker, evidence and affected child or coordinator scope are recorded.
Prepared means the complete child `spec.md`, `plan.md` and `tasks.md` set was
written inside the coordinator branch/worktree. Handoff-ready means the set has
passed scope, shared-contract, dependency-layer, write-gate and source-of-truth
checks, has complete prepared-handoff context, and is committed and pushed at
an exact immutable evidence commit. That evidence commit is resolved after
creation and must be ancestry-proven in the current fetched remote recording
head. `handoff-ready` is an artifact preparation state, not a launch claim.
Before accepted dispatch it coexists with a factual non-launched state, normally
`pending`, and with implementation and delivery permissions both false.

Fan-out cannot start for a child unless prepared artifacts are handoff-ready,
branch/worktree state is valid, shared-contract state is non-conflicting,
validation requirements and PR target rules are explicit, out-of-scope
boundaries are present and the held child-agent/subagent capability is
available. The coordinator artifact records each child as `launched`,
`blocked`, `pending` or `waiting-for-dependency-merge`, with a clear reason for
every child that was not launched. `launched` remains factual: the exact
prepared handoff was accepted by the approved capability with a stable child
identity. It is not intent, planned launch or advance implementation permission.

The sidecar coordinator must not require seed-first execution and must not
invent or create foundation or shared-contract child issues unless those issues
already exist or the user explicitly approves creating them in a
routing-authorized run that separately permits issue mutation.
Closed-child coordinator final passes remain in the existing sequential
workflow and do not use sidecar artifact preparation.

Sidecar artifact path and content planning may occur before coordinator
branch/worktree preparation. Artifact file writing must not occur while the
active checkout is `main`. Before writing coordinator or child artifacts,
Codex must create or enter the coordinator branch/worktree. If that cannot be
done safely, Codex stops before modifying files and reports the planned paths,
planned content status and blocker. A blocked coordinator records the blocker
in the coordinator artifact only after artifact writing is allowed, and it does
not launch child work. Local `main` must remain clean: no sidecar artifacts,
sidecar commits or untracked sidecar files are written there.

Coordinator and child artifacts are written only inside the coordinator
branch/worktree. Fan-out cannot start for a dependency-ready child unless the
coordinator artifact records that child's artifact path and handoff-ready
preparation status. Child executors consume prepared handoff artifacts and do
not repair missing coordinator artifact state or regenerate `spec.md`,
`plan.md` or `tasks.md` from their own checkout/worktree.

### Sidecar Held Child Dispatch Barrier

Sidecar child dispatch uses a narrow, non-atomic two-phase barrier. It is not a
generic transaction mechanism and adds no filesystem lock, queue, daemon,
generic IPC service or indefinite polling loop.

A tracked artifact cannot literally contain the SHA of the commit that contains
that artifact. An evidence-producing commit therefore identifies its own
unresolved identity as `SELF/HEAD`, following the same bounded convention used
by finalization H2, or leaves that field unresolved until the commit exists.
After commit, normal push and fetch, the coordinator resolves one exact immutable
evidence SHA. When the artifact must persist that literal SHA, a later recording
commit records the earlier evidence SHA. The recording commit does not need to
record its own SHA; its exact fetched remote head remains current external
evidence. A later recording head is normally different from the earlier
evidence SHA, so readiness is proven by ancestry, never by requiring the current
remote ref to equal that earlier evidence commit. This bounded pattern creates
no recursive metadata-commit chain or generic state subsystem.

The prepared-handoff identity uses canonical schema
`sidecar-prepared-handoff-v1`. It is SHA-256 over UTF-8 bytes of one PowerShell
ordered object serialized by `ConvertTo-Json -Compress -Depth 4`. Its exact
ordered fields are: schema, run ID, coordinator and child issue integers,
coordinator branch/remote/worktree, child branch/worktree, exact 40-hex control
revision, prepared spec/plan/tasks paths, dependency-layer integer, ascending
hard-dependency integer array, PR target, exact child-then-coordinator related
reference array, `handoff-ready`, `pending`, and false implementation/delivery
Booleans. The digest is 64 lowercase hex without a prefix. Artifact content is
validated separately. The fingerprint itself, artifact blob/content hashes,
evidence SHAs, recording/activation heads and child-agent identity are excluded,
preventing either an evidence-commit or self-containing artifact cycle.

For one dependency-ready layer, the barrier proceeds in this order:

1. The coordinator records complete `handoff-ready` evidence while factual
   launch state remains non-launched, normally `pending`, and implementation and
   delivery permissions remain false. It creates and normally pushes the
   handoff-ready evidence commit, fetches it, and resolves its exact immutable
   SHA.
2. A later coordinator recording commit stores that literal handoff-ready
   evidence SHA when the durable artifact requires it. After a normal push and
   fetch, the current remote handoff-ready recording head must contain the
   evidence commit by ancestry. Dispatch binds both the immutable evidence SHA
   and the exact current recording head; it does not require those SHAs to be
   equal.
3. The coordinator dispatches the exact prepared handoff through an approved
   held/preflight-only child-agent capability. Successful dispatch requires
   unambiguous acceptance and one stable child/task identity correlated with
   the existing run ID, child issue, child branch, child worktree,
   handoff-ready evidence SHA, current recording head and prepared-handoff
   identity or fingerprint. A later unrelated invocation is not the same held
   child.
4. During held preflight and until targeted durable continuation begins, that
   child may validate only its run and child identity, branch/worktree identity,
   prepared artifacts, dependency layer, the handoff-ready evidence/recording
   pair and false permissions. It performs zero repository or GitHub edits: no
   file edit, staging, prepared task execution, commit, push, PR open/update or
   GitHub mutation.
5. Only after accepted dispatch may the coordinator create the factual launched
   evidence commit for that exact child. That commit records `launched` and the
   current implementation and delivery permissions, using `SELF/HEAD` or an
   unresolved field for its own identity. It is normally pushed and fetched to
   resolve an exact immutable launched evidence SHA. A later activation/record
   commit may store that literal SHA. The fetched current remote
   activation/record head must contain the launched evidence commit by ancestry;
   it need not equal the launched evidence SHA. Every accepted child in the
   batch remains held and non-editing until this evidence and required recording
   state are durable.
6. Targeted durable continuation authorizes only the same held child to fetch
   and incorporate the current remote activation/record head into its
   still-clean child branch by a normal fast-forward or normal merge without
   rewriting history while implementation and delivery remain false. It
   verifies the
   factual launched evidence commit in ancestry, plus run ID, child issue,
   branch, worktree, prepared-handoff identity, factual `launched` state and
   current permissions. The coordinator releases only that correlated stable
   child identity. After the child confirms that its worktree stayed clean
   through the barrier and acknowledges release, it may begin the prepared
   tasks. Delivery remains
   separately gated by completed tasks, current permission, fresh passing
   validation, correct target and exact PR wording.

Current remote and repository evidence is authoritative; private conversation
state is not durable launch evidence. Rejected dispatch records no `launched`,
blocks the definite child with the factual reason and permits no edit or
delivery. Ambiguous dispatch is not retried blindly: it creates no replacement
or duplicate child, records no `launched` for the ambiguous child, keeps
affected children unreleased and non-editing, and stops with the ambiguity
preserved. A launch-state commit or normal push failure after accepted dispatch
keeps the exact child held and permits no edit or delivery. Failure to persist
or push the later evidence-SHA recording commit has the same result when that
record is required. Child refresh, launched-evidence ancestry verification or
activation/record-head verification failure also keeps the child unreleased.

Release failure after durable launched evidence does not roll factual
`launched` back to `pending`; the child is blocked or resume-needed and performs
no implementation or delivery. An interruption with `launched` recorded but no
verifiable active child is ambiguous: the workflow must not infer that the
child is running or dispatch a replacement. Failure after release retains
factual `launched` and uses current child-agent, branch, worktree and validation
evidence to report blocked, paused or resume-needed state without presenting
partial work as completed.

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

Each sidecar child artifact directory contains `spec.md`, `plan.md` and
`tasks.md`. Those names are part of the sidecar child handoff contract and do
not change normal sequential Spec Kit naming.

The GitHub issue number is the authoritative uniqueness key in each sidecar
artifact path. The slug is descriptive. Build the slug as a stable, lowercase,
hyphen-separated title slug after removing issue title prefixes such as
`[Workflow]`, `[Epic]`, or conventional type prefixes such as `feat:` or
`docs:` when present. Replace non-alphanumeric runs with a single hyphen and
trim leading or trailing hyphens.

Before creating sidecar artifacts, routing-authorized sidecar preparation must
compute the coordinator target path and every child target path. Existing same-number
coordinator artifacts may be resumed only when their exact stable `run_id`
proves that
the artifact belongs to the same coordinator run, matching the coordinator
issue number, URL, title/source context, computed artifact path and recorded
sidecar run identity. Otherwise the workflow must
stop and report a collision instead of overwriting, merging, deleting, silently
reusing or automatically renaming artifacts when any of these are true:

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
current `origin/main`. Codex fetches current `origin/main` without updating
local `main`, merging unrelated work into `main`, committing on `main`, or
using `main` as a sidecar delivery branch while preparing that coordinator
branch.

The coordinator branch/worktree is the sidecar artifact write boundary.
Artifact paths and contents may be planned before this boundary is entered,
but artifact files are written only after Codex creates or enters the
coordinator branch/worktree. If branch/worktree preparation is unsafe or
blocked, Codex stops before modifying files.

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

Before creating, switching to, merging into, pushing, writing artifacts, or
reusing a sidecar Git resource, the workflow must compute every target branch
and checkout/worktree name. Branch, checkout, worktree, directory and artifact
collisions stop execution unless the coordinator artifact or explicit
user-provided context proves the resource is the intended sidecar resource for
the same issue, slug and run identity. The workflow must not guess, overwrite,
delete, silently reuse or automatically rename colliding resources.

Before sidecar Git operations that require stable state, Codex checks the
affected checkout/worktree with `git status --porcelain` or equivalent. Dirty
paths stop branch creation, worktree creation or reuse, coordinator push,
artifact writing, and child delivery until the dirty state is resolved by the
user or by a workflow that explicitly permits the operation.

For a new sidecar run, Codex computes the coordinator branch and worktree path,
checks for dirty state and collisions, fetches `origin main`, creates the
coordinator branch from `origin/main`, creates or enters one isolated
coordinator worktree, and records the local coordinator branch ref, source ref,
and worktree path in the coordinator artifact when artifact writing is allowed.
On resume, Codex re-reads GitHub and repository evidence and stops if recorded
coordinator branch/worktree state does not match current local or remote state.

Before held child dispatch or any child PR delivery can occur, the coordinator
integration branch must be pushed to `origin` with a normal non-force push and
the exact fetched remote recording head must contain the immutable
handoff-ready evidence commit by ancestry. The coordinator artifact records the
literal evidence SHA only in a later commit or uses the bounded `SELF/HEAD`
resolution described above; it does not require a commit to contain its own
literal SHA. The current fetched recording head is observed separately and
need not equal the earlier evidence SHA. If the coordinator branch cannot be
pushed or verified safely, Codex stops before child dispatch or delivery. It
must not use `--force`, `--force-with-lease`, rebase-push,
delete-and-recreate, or any history-rewriting remote update to make the
coordinator branch push succeed.

Child branch/worktree preparation starts only when the local coordinator branch
exists, the remote coordinator branch exists, required artifacts are prepared
or handoff-ready, and the child layer is dependency-ready. Each child
implementation branch starts from the coordinator branch, not from `main`.
Each active child implementation uses an isolated local checkout/worktree
recorded in the coordinator artifact and supplied in the child handoff. The
coordinator artifact records each child branch name, source coordinator branch,
checkout/worktree path, child PR target branch and isolation state.

Each dispatch candidate receives exactly one prepared handoff in held,
preflight-only mode. The handoff includes coordinator context, child issue body,
prepared `spec.md`, `plan.md` and `tasks.md`, shared contract, dependency layer,
branch/worktree context, exact handoff-ready evidence commit SHA, current remote
recording head, prepared-handoff identity, current implementation and delivery
permissions, validation requirements, child PR target rules, exact
issue-reference wording rules and out-of-scope boundaries. It also prohibits
pre-release repository or GitHub edits, child-side planning artifact
regeneration, shared-contract redefinition, sibling scope, GitHub issue mutation
and `main` targets. Factual `launched` state, the immutable launched evidence
commit, current activation/record head and targeted release are governed by the
held-dispatch barrier above.

Sidecar child PR guidance must target the coordinator branch. Sidecar child PRs
must not target `main` directly. Hard-dependent layers wait until prerequisite
child PRs are integrated and required coordinator or active-child refresh is
complete.

After the user merges a child PR into the remote coordinator branch, Codex
first re-reads current GitHub and repository evidence, fetches the remote
coordinator branch, and refreshes the local coordinator branch/worktree from
that remote branch. Local coordinator refresh may use fast-forward or a normal
merge only. It stops on unexpected local changes, missing branch state, unsafe
divergence, stale evidence that prevents a safe decision, failed fetch or
conflicts. Codex must not rebase, force-push, use `--force-with-lease`,
perform history-rewriting updates, update local `main`, merge into local
`main`, delete resources, mutate GitHub issues or merge PRs to make refresh
succeed.

A completed child is integrated only when its PR is merged into the coordinator
branch and local coordinator state has been refreshed from the remote
coordinator branch containing that merge. Only after local coordinator refresh
may Codex refresh still-active child branches/worktrees, launch the next
dependency layer or consume merged child work as fresh coordinator evidence.
Still-active sidecar child branches or worktrees that need the latest
coordinator state are updated from the updated local coordinator branch using a
normal merge only when needed. They must not refresh from stale local
coordinator state.

Sidecar branches must not be rebased, force-pushed, updated with
`--force-with-lease`, or updated with any history-rewriting operation.
Validation affected by coordinator refresh or active child refresh is stale
until rerun.

### Sidecar Local Cleanup Journal and Execution

Local sidecar branches and worktrees are retained after individual child PR
merges. Cleanup remains ineligible until current evidence identifies exactly
one same-run final coordinator PR and confirms that its expected coordinator
source and H2 head, `main` base, merged state and merge evidence in current
`origin/main` evidence all agree. A known-unmerged final PR records an
ineligible outcome. Missing, stale, ambiguous or inconsistent merge evidence
blocks cleanup. The evidence refresh needed to make this decision is evidence
collection, not remote cleanup.

Cleanup state is stored outside every tracked worktree. From repository
context, the coordinator resolves and normalizes the result of
`git rev-parse --git-common-dir`, then uses the exact stable `run_id` already
recorded in the coordinator artifact to write:

```text
<git-common-dir>/catworld-sidecar/runs/<run-id>/cleanup-state.json
```

Schema version 1 has exactly these top-level fields:

- `schema_version`;
- `run_id`;
- `eligibility`;
- `owned_resources`;
- `skipped_reasons`;
- `attempted_operations`;
- `result`; and
- `updated_at_utc`.

The journal is local operational state, not independent merge, ownership or
cleanup-authority evidence. It is never committed or written back into H2. The
frozen coordinator artifact supplies the same-run ownership ledger. Every
candidate must match that ledger's exact normalized worktree path, exact local
branch, recorded repository Git common directory and live Git association.
Branch-name prefixes, directory-name patterns and live Git state alone never
prove ownership. An absent stable `run_id`, unknown resource, unmatched path or
branch, different Git common directory, unsafe control checkout or other
inconsistency blocks the complete cleanup batch before its first deletion.

Eligibility does not authorize deletion automatically. Destructive local
cleanup additionally requires explicit current authority consistent with the
repository operation rules. Before the first deletion, the coordinator
preflights every candidate worktree for staged, unstaged and untracked changes;
all candidates must be clean at the same batch boundary. It must also persist
the eligible in-progress journal successfully. Any dirty candidate or failed
pre-destructive journal write blocks the entire batch without deleting a local
resource.

Authorized execution removes each owned worktree through standard non-force
Git worktree removal before attempting standard non-force deletion of its
associated local branch. The journal is updated after every attempted local
operation. Execution stops on the first failure. If nothing was removed, the
result is `blocked`; if an earlier operation succeeded, the result is
`partial`, with only actual attempts and outcomes recorded. `completed` is
valid only after every approved local target was removed successfully. The
state pairs are:

- known-unmerged final PR: `eligibility = ineligible`,
  `result = ineligible`;
- missing, stale or inconsistent final-merge evidence:
  `eligibility = ineligible`, `result = blocked`;
- confirmed final merge without explicit current cleanup authority:
  `eligibility = eligible`, `result = not_started`;
- dirty, unknown or inconsistent candidate state after confirmed merge:
  `eligibility = eligible`, `result = blocked`;
- authorized execution after all preflight gates:
  `eligibility = eligible`, `result = in_progress`;
- all approved operations succeeded: `eligibility = eligible`,
  `result = completed`; and
- an operation failed after an earlier success: `eligibility = eligible`,
  `result = partial`.

`partial` and `completed` are factual terminal records for #259. A later
session reports them and does not automatically retry, continue or infer
missing-resource ownership from the journal; elaborate recovery remains out of
scope.

Local cleanup never changes H2 or
`specs/032-final-coordinator-delivery/finalization.md`, creates H3/H4 or another
repository commit, force-removes a worktree, force-deletes a branch, deletes or
otherwise cleans up a remote branch, prunes remotes or remote-tracking refs,
mutates GitHub issues or comments, merges or approves PRs, or enables
auto-merge. Issue #259 validated this boundary with one compact shared
temporary-Git fixture and the seven focused cleanup cases. Issue #260 completed
the accepted sidecar end-to-end and cross-workflow validation; its dry-run
evidence remains historical rather than current routing authority.

### Sidecar Resume State Tracking

These resume state rules apply only to sidecar coordinator parallel execution.
They do not change normal sequential issue implementation, direct child issue
implementation outside `parallel`, or closed-child coordinator final passes.

The coordinator artifact is the durable resume source. A later Codex session
must re-read current GitHub and repository evidence before continuing:

- coordinator issue body, state, labels and listed child issues;
- child issue bodies, states, labels, dependencies and blockers;
- relevant child PR states, target branches, readiness, merge status and final
  coordinator PR state;
- coordinator artifact and child artifacts;
- stable held child/task identity; exact handoff-ready evidence commit and
  current remote recording head; exact launched evidence commit and current
  remote activation/record head; prepared-handoff identity; implementation and
  delivery permissions; release state; and clean-through-barrier evidence when
  dispatch has begun;
- remote coordinator branch state;
- local coordinator branch/worktree state;
- active child branch/worktree state;
- local checkout/worktree existence and path state;
- validation evidence, status and freshness;
- child PR URL, target branch and ready/draft state when child delivery has
  occurred;
- the complete prepared-child ledger, merge observations and refreshed
  coordinator ancestry proofs;
- fetched `origin/main` target-base SHA, PR-equivalent merge base, local and
  remote coordinator heads, ancestry and integrated scope state;
- `H` and `H2` finalization identity, direct-parent/sole-artifact evidence,
  H results, H2 rerun requirements and resolved current H2 evidence;
- final-template blob and render inputs, stable same-run final PR identity,
  current final PR source, target, body, readiness and URL evidence;
- blockers, conflicts and human-only decision state;
- the local cleanup journal when it exists, its exact `run_id`, eligibility,
  execution result and explicit current cleanup-authority state.

Resume must not rely on private conversation context as the source of truth.
If the current evidence conflicts with recorded resume state, Codex stops and
reports the mismatch instead of guessing, deleting resources, rebasing,
force-pushing or treating stale validation as fresh.

When a sidecar coordinator is waiting on user merges, Codex reports exactly
which child PRs must be merged into the remote coordinator branch before
resume. When all child PRs are integrated, the next lifecycle state is
integrated coordinator validation, not another child execution layer. Once the
complete child ledger passes the terminal gate and finalization begins, resume
must not launch another child layer.

For each child issue, sidecar resume state distinguishes completed, integrated,
active, blocked, pending, waiting-for-dependency-merge, ready-next-layer,
held-preflight, launched, paused and resume-needed work. It records child
artifact path, branch, local checkout/worktree, PR, validation state, workflow
status, blockers, remote coordinator branch state, held child identity,
handoff-ready evidence/recording pair, launched evidence/activation-record pair,
current permissions and release state, local coordinator refresh state, active
child refresh state and cleanup eligibility when those values exist.

Resume during the dispatch barrier must re-prove the exact held child identity
and current child-agent state from available evidence. Accepted dispatch without
a durable immutable launched evidence commit and current remote
activation/record head containing it by ancestry remains held and cannot edit.
Durable `launched` without a verifiable active child is ambiguous and must not
cause blind replacement dispatch. Durable `launched` with failed release
remains factual but blocked or resume-needed. Only the same verifiable child
that incorporates the current activation/record head, verifies the launched
evidence commit in ancestry, passes identity and clean-worktree checks, and
receives targeted release may continue prepared implementation.

After the user merges a child PR into the remote coordinator branch, completed
child state remains recorded but is not marked integrated until local
coordinator state has been refreshed from the remote coordinator branch.
Still-active child branches or worktrees that need the latest coordinator
state are marked refresh-needed and are updated from the updated local
coordinator branch using a normal merge only when needed. Rebase, force-push,
force-with-lease and history-rewriting updates remain prohibited. Validation
affected by coordinator refresh or active child refresh is stale until rerun
after the update.

After observed merges and refresh, the coordinator recomputes dependency
layers from child dependencies, integrated child state, active/blocked/pending
state, shared contract state, conflict risk, validation freshness and updated
local coordinator branch state. It may launch a next dependency-ready layer
only when every hard dependency is integrated into the updated local
coordinator branch and no shared-contract, validation, human-only, conflict,
unsafe dependency or child-agent capability blocker remains. Unsafe resume
stops with blockers instead of silently switching to sequential mode.

When validation fails, is skipped, is timed out, is interrupted, is partial, is
stale, is blocked or is not run before a pause, that state remains visible
after resume and does not support ready status. Blockers remain recorded with
their category, affected scope, evidence and required next action or human
decision.

Resume also records factual finalization transitions: complete integrated
validation at H; creation of direct artifact-only H2 with required reruns still
pending; resolved H2 check, scope, base and remote-head evidence; and creation
or observation of the unique ready final PR. It preserves prior validation
attempts as historical evidence while identifying exactly one current result
for every readiness requirement and evaluated state. It never upgrades stale
or inconsistent artifact, branch, validation or existing-PR evidence silently.
The PR URL and resolved post-H2 state remain current evidence and final-report
data rather than causing an H3 or H4 artifact update. Post-final-merge cleanup
eligibility, skipped reasons, attempts and results are written to the local
Git-common-dir journal, not the frozen coordinator artifact. Cleanup remains
ineligible after individual child PR merges; after the final coordinator PR is
proven merged into `main`, only explicitly authorized, exact same-run-owned,
clean local resources may be removed under the cleanup contract above.

A closed-child coordinator final pass uses the existing sequential workflow and
normal sequential state handling. It may reference closed child issues for
traceability, but it must not use sidecar resumability state or present closed
child issue scope as newly implemented work.

### Integrated Coordinator Validation and Finalization

This procedure applies only to a routing-authorized run after the local
coordinator branch has been refreshed from its remote branch. Its runtime
target base is fetched `origin/main`. Historically, the #249 build-out
implementation branches for #258 and #259 instead started from and validated
against `origin/workflow/sidecar-buildout`; their PRs targeted
`workflow/sidecar-buildout` and used `Related to #258` or `Related to #259` as
applicable. That issue-stage implementation base is not a runtime coordinator
target and does not replace the current `origin/main` branch origin or `main`
final-PR target.

Before final validation, Codex re-reads the coordinator issue, every prepared
child issue and dependency, every child PR target and merge state, local and
remote coordinator refs, coordinator and child artifacts, validation evidence,
blockers, cleanup state and existing final PR evidence. Private conversation
context is not a source of truth. Finalization requires one complete, unique
ledger for the prepared child set. Every child PR must target and be merged
into the coordinator branch, and every delivered child commit must be present
in refreshed local coordinator ancestry; merged metadata alone is insufficient.
Every child workflow state must be `integrated`. Missing, duplicate, unexpected,
active, blocked, pending, dependency-incomplete or conflicting child state
stops finalization. Open child issues may remain open for the final PR's closing
authority and do not by themselves indicate incomplete integration.

Codex discovers the complete required integrated checks from the coordinator
issue, prepared child artifacts, shared contracts, affected surfaces,
repository instructions and combined source maps. Reports preserve historical
attempts and record exactly one current result per requirement, evaluated head
and relevant input set. Fresh applicable child results may be consumed only as
identified evidence and do not replace required integrated coordinator checks.
At literal coordinator head `H`, Codex first fetches current `origin/main`
without updating local `main`, records that runtime target-base SHA as `B` and
the PR-equivalent merge base for B and H, and reviews the complete
merge-base-to-H diff against coordinator scope, child issues and PRs, approved
artifacts, shared contracts and combined source maps. That review must pass and
be recorded as the H scope result before the H2 artifact can cite it. The
complete required implementation suite then runs at H; every current required
result must be fresh and `passed` before finalization continues.

Runtime finalization uses exactly two heads:

- `B` is the freshly fetched `origin/main` target-base SHA;
- `H` is the fully integrated coordinator head at which the complete required
  implementation suite ran; and
- `H2` is the direct child of `H` containing only the factual coordinator
  finalization artifact update.

The H2 artifact records literal B, literal H, `H2 = SELF/HEAD`, expected parent
H, the sole allowed artifact path, complete H check results, a complete
status-free H2 rerun manifest, and a non-empty applicability reason for every H
result that will remain applicable. It also records H scope state, post-H2
scope/base recheck criteria, final-template blob identity and render-input
requirements, remaining risks, cleanup `ineligible` with reason
`pending final PR merge`, and readiness `pending H2 checks`. It does not
preclaim its resolved self SHA, post-H2 statuses, final H2 scope or readiness,
rendered-body fingerprint or PR URL.

After committing H2, Codex proves that H2 has exactly one parent and that the
parent is H, and proves that the exact `H..H2` name/status delta contains only
the explicitly allowed artifact with its expected change type. It reruns every
artifact-affected check listed in the H2 manifest, including artifact/schema
validation, explicit-range `git diff --check`, source-map/scope review and
base/head checks. Resolved statuses remain current evidence and final-report
data. An H result may be consumed at H2 only when its applicability reason
explains why the artifact-only delta cannot invalidate it. The workflow does
not claim that the complete suite ran at H2 unless it actually did and does not
create H3 to store resolved evidence or the later PR URL.

H2 is pushed to the remote coordinator branch only by a normal non-force push.
Codex fetches that ref and requires it to equal H2. Rejection or mismatch stops
delivery without force-push, force-with-lease, rebase-push, branch recreation
or other history rewriting. Any extra parent, path or commit after H2, failed
H2 check, missing applicability reason, remote mismatch or stale evidence also
stops final delivery.

After H2 exists, the integrated scope review is rerun as an artifact-affected
check using B and the recorded PR-equivalent merge base. The complete
merge-base-to-H2 diff is reconciled with coordinator scope, child issues and
PRs, approved artifacts, shared contracts and combined source maps, and the
workflow confirms that only the allowed finalization artifact changed since
the passed H review. Unexplained scope or changed base/ancestry evidence is a
blocker.
Immediately before final PR creation or a separately permitted safe update,
Codex re-fetches `origin/main` and the remote coordinator branch, then rechecks
the target-base SHA, merge base, local and remote H2, ancestry, diff scope,
validation freshness, final template and render inputs, and existing same-run
PR evidence. Relevant movement or inconsistency makes affected evidence stale
and stops delivery rather than silently changing readiness.

### Sidecar PR Delivery Rules

These pull request rules apply only to sidecar coordinator parallel delivery.
They do not change normal one-issue/one-PR delivery, direct child issue
delivery outside `parallel`, or closed-child coordinator final passes.

Sidecar child PRs target the coordinator integration branch. They must not
target `main` directly. Their descriptions contain exactly two issue references,
each on its own line, and no other issue reference anywhere in the body:

```md
Related to #<child-issue>
Related to #<coordinator-issue>
```

Child PRs must not use closing keywords for either issue or imply that the child
PR is the final delivery PR to `main`.

After the same held #256 child has incorporated the current remote
activation/record head, verified the immutable launched evidence commit in its
ancestry, received targeted release, completed its prepared tasks and validated
successfully, it may commit scoped child changes, push the prepared child branch
with a normal non-force push, and open or update the child PR only when current
delivery permission and repository rules permit delivery. A child PR is ready
only when the stable child identity, handoff-ready evidence/recording pair,
launched evidence/activation-record pair, release and permission evidence remain
current; required validation is fresh and passed; its target and exact
two-reference wording are valid; and no unresolved blocker affects the child.
If any barrier evidence is missing or ambiguous, or required validation is
failed, skipped, timed out, interrupted, partial, stale, blocked or not run, no
ready child PR may be created or reported.

After every integrated validation and finalization gate passes, Codex re-reads
current PR evidence for the stable same-run final-delivery identity and creates
at most one final coordinator PR. An existing same-run PR may be reused or
updated only when that operation is separately permitted and every affected
requirement is freshly revalidated. If its source, target, body, readiness,
validation or identity is stale or inconsistent, Codex stops and reports the
exact required user action; it does not create a duplicate, silently mutate
readiness or use a draft as a fallback.

The body is rendered from
`.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md` using
current evidence. The final PR must:

- be ready for review;
- source the remote coordinator integration branch verified at H2 and target
  `main`;
- identify integrated child PRs or child issue references for traceability;
- list complete checks at H and resolved artifact-affected checks at H2 with
  explicit statuses and freshness;
- record target-base SHA, merge base, local and remote H2, integrated scope
  result, applicability rationale, remaining risks and cleanup `ineligible`
  with reason `pending final PR merge`; and
- use closing keywords only for the coordinator and delivered child issues.

The final coordinator PR is the only sidecar PR that may target `main` or close
the coordinator set during sidecar parallel delivery. This runtime authority
does not apply to temporary #249 build-out PRs such as #258 and #259, whose
target and non-closing issue reference remain the build-out integration branch
and `Related to` wording. Current GitHub evidence and the final report record
the returned final PR URL and readiness; Codex does not create H3 or H4 merely
to write the URL, rendered-body fingerprint, resolved post-H2 evidence or
cleanup evidence back into the coordinator artifact.

Codex reports readiness for sidecar child PRs and the final coordinator PR.
The user performs every merge. Codex must not merge, approve or enable
auto-merge on pull requests. Local cleanup remains `ineligible` with reason
`pending final PR merge` until current evidence shows that the final
coordinator PR has merged into `main`; eligibility still does not supply
destructive cleanup authority.

GitHub issue body, checklist, label, assignee, milestone, issue state and
public comment mutations require explicit user approval in a workflow that
permits the operation. PR description wording is not permission to separately
modify issue metadata, issue bodies, checklists, issue state or public
comments. Remote branch deletion, remote pruning and remote cleanup also
require a separate explicitly approved workflow and are never part of the
sidecar local cleanup phase.

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
- `blocked`
- `not run`

These are the canonical sidecar validation statuses. Reports preserve prior
attempts as historical evidence and identify exactly one current readiness
result for each requirement, evaluated head and relevant input set. Unavailable
or dishonest-to-run evidence is recorded as `blocked` or `not run` with a
reason rather than omitted. Consumed child evidence is named and scoped, and
it never substitutes for a required integrated coordinator check.

Failed validation is never summarized as passed. Failed, timed-out, skipped,
interrupted, partial, stale, blocked and not-run validation is never summarized
as passed. A report may contain passed evidence, but the summary still
preserves every non-passed status and its readiness impact.

Validation becomes stale when a coordinator branch update, remote coordinator
refresh, local coordinator refresh, active child branch refresh, conflict
resolution, target-base or merge-base movement, artifact change or other
relevant change could affect previous evidence. Stale evidence must be rerun
before sidecar readiness is reported, or it stays explicitly reported as
stale. Coordinator readiness must not consume stale child evidence as fresh
evidence. H evidence may remain current at H2 only after direct-parent and
sole-artifact-delta proof and a non-empty applicability rationale showing why
the H2 artifact cannot invalidate that result.

Finalization reporting distinguishes the complete suite run at H from the
artifact-affected checks rerun at H2. It records actual statuses at their
evaluated heads and does not claim the complete suite ran at H2 unless it did.
It also reports target-base, merge-base, local/remote H2, scope, template,
existing-PR and cleanup-ineligibility evidence from the final pre-creation
recheck. Later cleanup reporting reads the local Git-common-dir journal and
does not rewrite H2 or the finalization artifact.

A sidecar child PR is ready only when the immutable launched evidence commit is
ancestry-proven in the incorporated current activation/record head, targeted
release and current delivery permission are proven for the same stable child,
required validation is fresh and passed, no unresolved blocker affects the
child, and the approved target and exact two-reference rule are satisfied. A
sidecar child PR is draft/not-ready when a separately permitted review-useful
draft exists but required validation is failed, skipped, timed out, interrupted,
partial, stale, not run or blocked, unless the non-passed evidence is explicitly
outside child readiness and the report explains why. Missing or ambiguous
dispatch-barrier evidence prohibits child delivery rather than authorizing a
draft fallback. Final coordinator readiness follows the same freshness and
blocker principle for coordinator-level and consumed child evidence, but it has
no draft fallback: any required non-passing, unavailable, stale, scope-drift,
base/head, remote-ref or existing-PR blocker prevents final PR creation or an
allowed update. An existing final PR is not reported ready while its evidence
is stale or inconsistent.

Sidecar reports distinguish:

- child-specific blockers that affect exactly one child issue;
- coordinator-wide blockers that affect the coordinator branch, integration
  set or multiple children;
- shared-contract blockers that affect cross-child contracts or handoff
  expectations;
- child-agent/subagent capability blockers that stop fan-out without sequential
  fallback;
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
The user can either run the coordinator with explicit `parallel` through the
current sidecar workflow when preflight is safe, or implement the open
sub-issues directly through the sequential workflow.

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
