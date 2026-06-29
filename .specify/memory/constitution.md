<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder Principle 1 -> I. Domain Focus and Sustainable Evolution
- Placeholder Principle 2 -> II. Layered Monolith Responsibilities
- Placeholder Principle 3 -> III. Backend and Database Authority
- Placeholder Principle 4 -> IV. Schema Evolution
- Placeholder Principle 5 -> V. Protected Stay Model
- Added VI. Specification and Planning Discipline
- Expanded VI. Specification and Planning Discipline with proportional
  architecture and technology evaluation requirements
- Clarified VI. Specification and Planning Discipline human approval
  requirements for significant technical decisions
- Refined VI. Specification and Planning Discipline proportionality and
  approval-flow requirements for significant decisions
- Added VII. Focused Changes and Proportional Validation
- Added VIII. Operational Safety and Sources of Truth
Added sections:
- Product and Architecture Boundaries
- Development Workflow and Validation
Removed sections:
- Generic placeholder sections and example comments
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ .specify/templates/commands/*.md not present in this checkout
Runtime guidance:
- ✅ README.md reviewed; no constitution-driven update required
- ✅ docs/ARCHITECTURE.md reviewed; no constitution-driven update required
- ✅ docs/OPERATIONS.md reviewed; no constitution-driven update required
Follow-up TODOs: None
-->
# CatWorld Constitution

## Core Principles

### I. Domain Focus and Sustainable Evolution

CatWorld is an evolving administration system for the cat-boarding domain,
intended to grow toward complete operational administration. Confirmed real
operational needs MUST guide product validation, but one person, account,
location, installation, deployment model, or current workflow MUST NOT become
an unnecessary architectural assumption. Features MUST use the smallest correct
design for confirmed requirements and MUST avoid speculative frameworks,
premature generalization, generic rules engines, or platform infrastructure
without concrete requirements. Neutral, reusable domain concepts MAY be used
when they are equally simple and do not weaken current requirements. Potential
reuse by future products MUST NOT drive speculative cross-species abstractions
into CatWorld without concrete requirements and explicit approval.

Rationale: CatWorld must stay grounded in cat-boarding work while leaving room
for sustainable growth without overfitting to today's installation.

### II. Layered Monolith Responsibilities

CatWorld MUST preserve the controller -> service -> repository -> database
structure unless an explicitly approved architectural decision replaces it.
Controllers MUST handle HTTP concerns and delegate application behavior.
Business rules, transactions, and use cases MUST live in services. Repositories
MUST handle persistence access. DTOs and mappers MUST separate HTTP contracts
from JPA entities.

Rationale: The current layered monolith is simple, testable, and documented; it
protects business behavior from leaking into transport or persistence details.

### III. Backend and Database Authority

The backend MUST be authoritative for business rules, authorization,
validation, and important calculations. Frontend behavior MAY assist, preview,
hide, or warn, but it MUST NOT be the only protection for important rules.
Database constraints MUST remain the final protection for persisted integrity
where the schema can enforce it.

Rationale: CatWorld handles operational records; browser-only protection is not
enough for integrity or authorization.

### IV. Schema Evolution

Flyway migrations under `src/main/resources/db/migration` MUST be the mechanism
for real schema evolution. Hibernate schema auto-update MUST NOT be used for
real schema changes. Schema-changing work MUST include migration validation
proportional to risk, including verification that the application still
validates the intended schema.

Rationale: Explicit migrations protect production data and make database
changes reviewable.

### V. Protected Stay Model

Stay status MUST remain derived from dates and cancellation data and MUST NOT be
persisted as redundant state. Core stay invariants MUST remain protected:
`endAt` is after `startAt`, each stay includes at least one cat, all
participating cats belong to the stay owner, duplicate cats are rejected, and
active stays do not overlap for the same cat. Cancelled stays MUST be excluded
from active-stay overlap validation. Changes to these invariants require an
explicit specification, tests at the responsible layer, and architectural
review.

Rationale: Stays are the central booking concept; redundant lifecycle state and
weakened booking invariants would risk inconsistent operations.

### VI. Specification and Planning Discipline

Specifications MUST describe observable behavior, scope, edge cases, and
exclusions without becoming implementation tutorials. Feature plans MUST resolve
important architectural, persistence, security, shared-contract, and
cross-cutting UI decisions before implementation. When a feature introduces one
or more significant decisions, the feature plan MUST perform a proportional
architecture and technology evaluation before implementation. Significant
decisions include a significant shared or cross-cutting capability; confirmed
repeated use across approved features; a non-trivial accessibility or
correctness responsibility; a material security, persistence, shared-contract,
or operational decision; introduction of a significant dependency; or a decision
with meaningful replacement or migration cost. Ordinary local implementation
choices, small CRUD changes, routine use of an already approved framework,
minor component organization, local utilities, and normal coding details MUST
NOT require mandatory human approval or ceremonial assessment. The evaluation
MUST consider, where plausible, existing browser, framework, or project
capabilities; relevant established libraries, frameworks, or services; and
focused custom implementation. The evaluation MUST compare fit for confirmed
current requirements, confirmed medium-term reuse, accessibility and correctness
responsibilities, integration and maintenance cost, dependency maturity and
lock-in, operational risk, and reversibility and migration cost. The selected
option MUST be explicitly recorded and approved before implementation. Approval
MUST come from the user or another explicitly authorized human reviewer.
Explicit human approval of a feature plan that clearly contains the selected
approach counts as approval of that technical decision; a second separate
approval is not required. A still-applicable decision previously approved in
the constitution or another explicit architectural decision record MAY be
referenced instead of being approved again, and the feature plan MUST explain
why that prior decision applies to the current work. An implementation or
planning agent MUST NOT supply, infer, or mark its own technical decision as
human-approved, and MUST NOT treat undocumented historical behavior as an
approved architectural decision. If the selected approach changes materially,
fresh human approval is required.
Implementation agents MUST NOT silently select or introduce significant
architecture, framework, library, or shared-infrastructure decisions, and MUST
NOT silently redefine project principles or unresolved product behavior.
Unresolved product decisions that materially affect scope or behavior, and
unresolved architectural or technology decisions that trigger the required
assessment, MUST block implementation.

Rationale: Spec Kit artifacts must make decisions visible before code changes
turn uncertainty into accidental architecture.

### VII. Focused Changes and Proportional Validation

Changes MUST remain focused, reviewable, and free from unrelated refactors.
Tests and review depth MUST be proportional to affected risk. Business rules
MUST be tested at their responsible layer. Persistence, migration, security,
and shared-contract changes MUST receive stronger validation than local
presentation changes.

Rationale: The project benefits from small, comprehensible changes while still
raising the validation bar for high-risk behavior.

### VIII. Operational Safety and Sources of Truth

Secrets and real credentials MUST NOT be committed. Real operational data MUST
remain separated from test and sample data. Production exposure, access
boundaries, backup requirements, and recovery procedures MUST be explicitly
documented and reviewed for the active deployment model. README.md,
docs/ARCHITECTURE.md, docs/OPERATIONS.md, docs/uml, migrations, tests, and
current code are sources of truth for implemented behavior, but they MUST NOT
automatically become evidence of permanent product constraints.

Rationale: Operational safety is mandatory, while current deployment mechanics
must not silently constrain future CatWorld evolution.

## Product and Architecture Boundaries

- CatWorld remains focused on the cat-boarding domain. Cross-species
  abstractions, multi-tenancy, generic platform claims, and unrelated products
  require concrete requirements and explicit approval before entering this
  repository.
- Current implementation details, including current authentication mechanisms,
  role names, infrastructure versions, UI libraries, deployment shape, manual
  backup procedure, and absent features, MUST NOT be promoted to permanent
  principles without explicit human approval.
- Release-specific scope, issue-specific sequencing, roadmap details, and
  temporary agent or Git instructions MUST NOT be encoded in this constitution.
- Individual class, method, and file prescriptions MUST stay out of the
  constitution unless they are the only practical way to state a stable
  project-wide rule.

## Development Workflow and Validation

- Every feature plan MUST include a constitution compliance check before
  implementation and MUST re-check compliance after design decisions are made.
- Plans that touch domain invariants, schema, authorization, persistence,
  shared API contracts, or cross-cutting UI behavior MUST identify responsible
  layers and validation evidence before implementation begins.
- Plans that require architecture and technology evaluation MUST record options
  considered, selected approach, tradeoffs, reversibility, and human approval
  before implementation begins.
- Specifications MUST distinguish implemented facts, assumptions, explicit
  exclusions, and unresolved questions. Unresolved major product or
  architectural questions block implementation until a human decision is
  recorded.
- Task lists MUST include constitution-required validation work when a change
  affects business rules, persistence, migrations, security, shared contracts,
  or operational safety.
- Documentation updates MUST accompany behavior, architecture, operations, or
  source-of-truth changes that would otherwise leave implemented behavior
  unclear or stale.

## Governance

This constitution supersedes conflicting local practices for CatWorld feature
planning and implementation. Amendments require an explicit documented reason,
human approval, a semantic version change, and updates to affected Spec Kit
templates or runtime guidance. Current implementation details MUST NOT be
promoted to permanent principles without explicit human approval.

Semantic versioning policy:

- MAJOR: Backward-incompatible governance changes, principle removals, or
  redefinitions that invalidate previously compliant work.
- MINOR: New principles, new mandatory sections, or materially expanded
  compliance requirements.
- PATCH: Clarifications, wording fixes, and non-semantic refinements.

Compliance review expectations:

- Every feature plan MUST evaluate all core principles in its Constitution
  Check.
- Pull requests or implementation reviews MUST identify any constitutional
  impacts and verify that required validation evidence is present.
- If a feature conflicts with this constitution, the constitution MUST be
  amended first or the feature plan MUST change.
- Release-specific decisions, roadmap scope, and issue-specific constraints
  MUST remain in their feature artifacts, not in the constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-29 | **Last Amended**: 2026-06-29
