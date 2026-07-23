---
name: "speckit-plan"
description: "Execute the implementation planning workflow using the plan template to generate design artifacts."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context by marking unknowns as "NEEDS CLARIFICATION" and classifying them as researchable unknowns or material decision blockers.
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Identify observable and correctness-sensitive surfaces affected by the feature, including visible UI state, validation, error handling, loading/disabled states, navigation, contracts, authorization, persistence, migrations, security, mobile/device-specific behavior, i18n-visible behavior, shared components, and global styling
   - Fill a responsible-layer validation evidence plan before task generation.
     For each distinct behavior or group of equivalent consumers, choose the
     smallest evidence sufficient for its actual regression risk and ongoing
     maintenance value, and record both the selected validation and the reason.
     Existing tests, compilation, build, directed inspection, focused review,
     or a temporary/manual check MAY be sufficient. A low-impact presentation
     change MAY require no new permanent test. Do not assume that observable
     frontend behavior requires a new DOM, harness, or component test, and do
     not create one evidence obligation per file, page, field, signal,
     acceptance criterion, or equivalent consumer.
   - Require the smallest useful automated test coverage when behavior is
     important, complex, costly to regress, or constitutionally or otherwise
     correctness-sensitive enough that maintaining the test is worthwhile.
     Preserve stronger responsible-layer evidence for business rules,
     authorization, security, persistence, migrations, shared contracts, and
     protected invariants. Appropriate evidence may include DOM or Angular
     Material/CDK harness checks for visible UI, routed navigation and
     focus/keyboard checks for interaction behavior, controller/API tests for
     contracts, service tests for business rules, authorization/security tests
     for access control, and Flyway/schema/data-integrity checks for persistence
     and migrations.
   - When replacing UI primitives, shared components, interaction mechanisms,
     presentation mechanisms, validation or error-handling mechanisms, or other
     behavior-preserving mechanisms with mismatch risk, fill a lightweight
     semantic-equivalence review. Identify the old behavior/source of truth,
     new semantics, mismatch risks, and mitigation. The review MUST NOT
     independently require a new permanent automated test: its proof selection
     MUST inherit the applicable proportional decision from the Validation
     Evidence Plan. That decision MAY use existing-suite execution,
     compilation, build, directed inspection, focused review, a
     temporary/manual check, no new permanent test, or the smallest useful
     focused automated test. Low-impact local migrations MAY rely on
     review/inspection/build evidence when sufficient for actual regression
     risk; genuinely correctness-sensitive replacements require stronger proof
     at the responsible layer. Mark the review N/A with a reason when no
     replacement or migration risk exists.
   - Phase 0: Generate research.md for researchable unknowns only. Resolve
     factual, technical, or repository-verifiable NEEDS CLARIFICATION items
     through repository inspection, project documentation, official/reference
     documentation, or objective technical research. Do not resolve material
     product, architecture, persistence, security, shared-contract,
     authorization, UX, operational, or correctness-sensitive decisions through
     research, assumptions, or agent-selected implementation choices; list them
     as blockers that require explicit human decision and stop planning before
     decision-dependent design.
   - Phase 1: Generate data-model.md (full model only when data changes apply; concise non-applicable note otherwise), contracts/, quickstart.md
   - Re-evaluate Constitution Check post-design

## Completion Report

Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and
generated artifacts. If planning stops on unresolved material decisions, report
those blockers and which decision-dependent artifacts were not generated.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - Classify each NEEDS CLARIFICATION before creating research tasks.
   - For each factual, technical, or repository-verifiable NEEDS CLARIFICATION
     → research task
   - For each material product, architecture, persistence, security,
     shared-contract, authorization, UX, operational, or correctness-sensitive
     decision → record as a blocking decision requiring explicit human approval;
     do not create a research task that chooses for the user
   - For each non-material or already-approved dependency → best practices task
   - For each non-material or already-approved integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each researchable unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each non-material technology choice or already-approved technology:
     Task: "Find best practices for {tech} in {domain}"
   ```

   If any material decision remains unresolved, stop before Phase 1 and report
   the blocker instead of generating decision-dependent design artifacts.

3. **Consolidate findings** in `research.md` using format for researchable
   findings only:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with researchable NEEDS CLARIFICATION items resolved,
plus any unresolved material decisions reported as blockers that require
explicit human decision before planning or implementation can continue

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete and no unresolved material product,
architecture, persistence, security, shared-contract, authorization, UX,
operational, or correctness-sensitive decisions

1. **Generate data model artifact** → `data-model.md`:
   - Generate a full data model only when the feature changes domain entities, persistence, API payloads, schema, browser storage, external contracts, or structured feature data
   - For a full data model, include entity name, fields, relationships, validation rules from requirements, and state transitions if applicable
   - If none of those data concerns apply, still create `data-model.md` with concise non-applicable content:

     ```markdown
     # Data Model

     Not applicable. This feature introduces no domain entities, persistence model,
     API payloads, schema changes, browser storage, external contracts or structured
     feature data.
     ```

2. **Define interface contracts** (if project has external interfaces) → `/contracts/`:
   - Identify what interfaces the project exposes to users or other systems
   - Document the contract format appropriate for the project type
   - Examples: public APIs for libraries, command schemas for CLI tools, endpoints for web services, grammars for parsers, UI contracts for applications
   - Skip if project is purely internal (build scripts, one-off tools, etc.)

3. **Create quickstart validation guide** → `quickstart.md`:
   - Document runnable validation scenarios that prove the feature works end-to-end
   - Include the selected proportionate evidence and its reason from the plan's
     validation evidence section. Call out any manual visible-device,
     focus/keyboard, navigation, i18n, authorization, migration, persistence,
     or contract checks that the selected automated evidence cannot fully prove.
   - State that validation must be rerun after relevant late changes, or reported as not revalidated rather than passed
   - Include prerequisites, setup commands, test/run commands, and expected outcomes
   - Use links or references to contracts and data model details instead of duplicating them
   - Do not include full implementation code, model/service/controller bodies, migrations, or complete test suites
   - Keep this artifact as a validation/run guide; implementation details belong in `tasks.md` and the implementation phase

**Output**: data-model.md, /contracts/*, quickstart.md

## Key rules

- Use absolute paths for filesystem operations; use project-relative paths for references in documentation
- ERROR on gate failures, unresolved researchable clarifications, or unresolved
  material decisions. Agents must not convert material open decisions into
  assumptions, research findings, or self-approved implementation choices.

## Done When

- [ ] Plan workflow executed and design artifacts generated
- [ ] Completion reported to user with branch, plan path, and generated artifacts
