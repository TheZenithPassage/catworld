# Feature Specification: Remove Workflow Alternatives

**Feature Branch**: `chore/302-remove-alternate-implementation-workflows`

**Created**: 2026-07-18

**Input**: User description: "GitHub issue #302: remove all repository implementation workflows except catworld-implement-issue"

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes

- **TO-001 - One supported implementation route (Priority: P1)**: CatWorld exposes exactly one repository-level implementation workflow: one concrete GitHub issue routes to `catworld-implement-issue`, which uses one normal issue branch and one pull request to `main`.
  - **Why this priority**: Multiple coordinator, child, Sidecar, and mode-specific routes make repository execution ambiguous and can resume obsolete behavior after cleanup.
  - **Acceptance Scenarios**:
    1. **Given** the retained repository instructions and skills, **when** a single issue number, `#reference`, or issue URL is supplied, **then** it has exactly one route through `catworld-implement-issue`.
    2. **Given** wording such as `parallel` or `sequential`, **when** repository routing is reviewed, **then** that wording has no special workflow meaning.
    3. **Given** multiple issue references without a clear target, **when** the instructions are followed, **then** the user is asked which issue to implement.
  - **Validation Evidence**: Review of `AGENTS.md`, `.agents/skills/catworld-implement-issue/SKILL.md`, the remaining top-level skill directories, and the repository-wide stale-reference search required by issue #302.

- **TO-002 - Minimal retained Spec Kit closure (Priority: P1)**: Only `catworld-implement-issue` and its six invoked internal phases remain under `.agents/skills`, with only the scripts, templates, manifests, configuration, and constitution required by that workflow retained under `.specify`.
  - **Why this priority**: Removing executors without removing or correcting their registries and support files would leave dormant alternatives or broken retained dependencies.
  - **Acceptance Scenarios**:
    1. **Given** the final `.agents/skills` directory, **when** its direct child directories are listed, **then** the only entries are `catworld-implement-issue`, `speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, and `speckit-converge`.
    2. **Given** the retained workflow and six phase skills, **when** every referenced skill, script, template, constitution, and manifest path is checked, **then** every required path exists.
    3. **Given** both Spec Kit integration manifests, **when** their retained path entries are inspected, **then** every entry exists and no deleted path remains.
  - **Validation Evidence**: Direct directory listing, manifest review, and dependency-reference existence audit.

- **TO-003 - Obsolete workflow surfaces removed atomically (Priority: P1)**: Sidecar and coordinator skills, optional standalone Spec Kit commands, hook infrastructure, specialized GitHub templates, active workflow architecture documentation, and exact workflow-only spec directories named by issue #302 are absent without replacement abstractions.
  - **Why this priority**: Partial cleanup could leave an active instruction, template, extension, registry, or historical executor capable of reintroducing unsupported routes.
  - **Acceptance Scenarios**:
    1. **Given** the exact deletion inventory in issue #302, **when** the final tree is inspected, **then** every listed path is absent and no similarly purposed replacement is added.
    2. **Given** retained active repository surfaces, **when** they are searched for obsolete workflow terminology, **then** no active routing, skill, template, extension, registry, or architecture source refers to a deleted workflow.
    3. **Given** retained product specifications with historical coordinator wording, **when** search results are reviewed individually, **then** product source-of-truth specs `196-*`, `197-*`, and `198-*` remain and are not treated as active workflow routing.
  - **Validation Evidence**: Path absence checks, repository-wide `rg` review, and changed-file scope review.

- **TO-004 - Product and CI surfaces preserved (Priority: P1)**: The cleanup does not change application source, product-behavior tests, database migrations, dependency files, or the backend and frontend GitHub Actions workflows.
  - **Why this priority**: This issue removes repository implementation machinery only; product behavior and CI are outside its approved scope.
  - **Acceptance Scenarios**:
    1. **Given** the final changed-path list, **when** it is compared with the protected surfaces in issue #302, **then** no protected application, test, migration, dependency, or CI path is changed.
    2. **Given** product architecture documentation, **when** the workflow-routing chapter is removed, **then** all product architecture before it and `## Diagrams` plus subsequent product documentation remain intact.
  - **Validation Evidence**: `git diff --name-only`, targeted protected-path review, and the architecture-document diff.

### Edge Cases

- A repository-wide stale-term search may find historical wording in retained product specs; each hit must be reviewed for whether it is an active workflow surface rather than deleted mechanically.
- Numeric spec prefixes can collide: `specs/008-coordinator-orchestration-skill` must be removed while `specs/008-creator-attribution` must remain.
- Product deletion-rule specs `196-*`, `197-*`, and `198-*` must remain even though their history relates to a coordinator effort.
- Integration manifests can remain syntactically valid while naming deleted paths; validation must verify target existence for every retained entry.
- Removing `.specify/extensions.yml` eliminates hook-driven context updates; the retained workflow and phase skills must not retain dangling hook or active-plan-pointer lifecycle instructions.
- Post-merge issue, branch, and worktree hygiene is deliberately deferred and must not be performed by this implementation PR.

## Requirements *(mandatory)*

### Technical Requirements

- **TR-001**: `AGENTS.md` MUST route any one issue number, `#reference`, or issue URL directly to `catworld-implement-issue`, MUST require clarification for multiple unclear issue references, and MUST contain no special `parallel`, `sequential`, coordinator, child, final-pass, label-classification, Sidecar-preflight, or historical issue-number routing.
- **TR-002**: Repository boundaries in `AGENTS.md` MUST preserve the normal scope, architecture-decision, validation, repository-operation, language, and completion safeguards while removing Sidecar branch and worktree exceptions.
- **TR-003**: `.agents/skills/catworld-implement-issue/SKILL.md` MUST retain normal branch preparation; specify, plan, tasks, analyze, implement, and converge sequencing; validation; commit; normal push; PR-to-`main` delivery; stop conditions; and reporting, without Sidecar/coordinator/child routing, sub-issue delivery, active-plan-pointer lifecycle, or deleted-workflow references, and MUST NOT redesign or expand the remaining workflow.
- **TR-004**: The only direct child directories under `.agents/skills` MUST be `catworld-implement-issue` and `speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, and `speckit-converge`.
- **TR-005**: The standalone skills `speckit-agent-context-update`, `speckit-clarify`, `speckit-checklist`, `speckit-constitution`, and `speckit-taskstoissues` MUST be deleted; the retained `speckit-specify` skill MUST contain no `/speckit-clarify` references, and the retained `speckit-plan` skill MUST contain no direct AGENTS context mutation or associated output/rules.
- **TR-006**: `.specify/workflows`, `.specify/extensions.yml`, `.specify/extensions`, `create-new-feature.ps1`, `checklist-template.md`, and `constitution-template.md` MUST be deleted, while `.specify/memory/constitution.md` and the minimum required configuration, manifests, PowerShell scripts, and templates listed in issue #302 MUST remain.
- **TR-007**: Both retained Spec Kit integration manifests MUST contain only retained paths, and every skill, script, template, constitution, configuration, or manifest path referenced by `catworld-implement-issue` and its six internal phases MUST exist. Retained skills and scripts MUST remove hook or extension-template resolution branches that reference the deleted extension infrastructure; they MUST resolve only through the minimum retained core support and MUST NOT preserve dormant compatibility behavior.
- **TR-008**: `catworld-orchestrate-coordinator-issue`, `catworld-parallel-coordinator`, and `catworld-parallel-child-implementation` MUST be deleted completely.
- **TR-009**: The five Sidecar-specific GitHub issue and pull-request template paths named in issue #302 MUST be deleted without adding a replacement coordinator, child, epic, topology, or workflow template.
- **TR-010**: The complete `## Codex Workflow Routing` block in `docs/ARCHITECTURE.md` MUST be removed through the content immediately preceding `## Diagrams`, while all product architecture outside that block remains unchanged.
- **TR-011**: Every exact workflow-only spec directory named for deletion in issue #302 MUST be absent, while `specs/008-creator-attribution`, `specs/196-*`, `specs/197-*`, `specs/198-*`, other product specs, and this issue's single normal spec directory MUST remain.
- **TR-012**: No retained active instruction, skill, template, extension, registry, or architecture source MUST refer to Sidecar, deleted CatWorld coordinator/parallel executors, routing authorization, held dispatch, parallel mode, coordinator issues, or coordinator/child behavior.
- **TR-013**: The change MUST NOT touch application source code, product-behavior tests, database migrations, dependency files, `.github/workflows/backend-ci.yml`, or `.github/workflows/frontend-ci.yml`.
- **TR-014**: Validation MUST include `git diff --check`, a complete changed-path review, the required top-level skill-directory listing, the required stale-reference search with individual hit review, retained dependency-path verification, and protected-surface verification.
- **TR-015**: Delivery MUST use the one normal issue branch and one pull request to `main`; it MUST NOT rewrite history, merge the pull request, reuse or merge the failed issue #286 Sidecar branch, modify old workflow issues, or perform post-merge branch/worktree hygiene.

### Scope Boundaries

- **SB-001**: The feature is limited to repository implementation instructions, retained Spec Kit workflow support, workflow-specific GitHub templates, workflow documentation, and workflow-only specification artifacts explicitly covered by issue #302.
- **SB-002**: Retained phases are internal implementation details of `catworld-implement-issue`, not alternative user-facing end-to-end entry points.
- **SB-003**: Existing CatWorld product behavior, data, schema, authorization, dependencies, CI, and product documentation outside the named workflow-routing block remain unchanged.
- **SB-004**: The cleanup MUST be atomic in one issue branch and one pull request, with routing simplified before alternative executors and support paths are removed.

### Out of Scope

- Creating coordinator or child issues, fixtures, dry runs, replacement orchestration, compatibility layers, dormant fallbacks, simulators, workflow contracts, or new workflow abstractions.
- Reverting historical pull requests wholesale or deleting retained product specifications merely because they originated in coordinator work.
- Closing issues #286 through #298, #300, or #301; removing worktrees; deleting branches; or pruning remotes before this cleanup PR is reviewed and merged.
- Merging this pull request or changing any product behavior.

### Open Questions

- None. Issue #302 specifies the retained dependency closure, exact deletion inventory, protected surfaces, validation evidence, and delivery boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Listing direct child directories under `.agents/skills` returns exactly seven directories: the one retained entry workflow and its six internal phases.
- **SC-002**: Every path explicitly required to be deleted by issue #302 is absent, and every minimum retained path and retained workflow dependency resolves to an existing file or directory.
- **SC-003**: The required stale-reference search yields no unreviewed hit and no retained active surface referring to a deleted workflow or skill.
- **SC-004**: `git diff --check` exits successfully, and changed-path review confirms that no application source, product-behavior test, migration, dependency, or protected CI workflow changed.
- **SC-005**: Repository instructions describe one issue-to-branch-to-PR implementation path, and no replacement or mode-specific routing abstraction is introduced.

## Assumptions

- The current `origin/main` tree fetched during branch preparation is the baseline for deciding which repository paths are active before cleanup.
- Case-insensitive stale-term matching may produce historical product-spec hits; explicit human-authored issue boundaries determine whether a retained hit is permissible after individual review.
