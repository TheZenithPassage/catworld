# Research: Sidecar Child Execution and PR Delivery

## Decision: Extend existing sidecar workflow text and local simulations

The #253-#255 build-out on `workflow/sidecar-buildout` already establishes the
required prerequisites for #256: prepared child artifacts, branch/worktree
context, one-child fan-out handoffs, validation requirements, and coordinator
branch PR target rules. The #256 implementation should extend those same
source-of-truth surfaces instead of adding a new framework or helper service.

**Rationale**: Existing sidecar skills and architecture docs are the contract
future Codex agents will consume. Keeping #256 in those surfaces preserves the
current build-out pattern and avoids premature automation before #261 activates
sidecar routing.

**Alternatives considered**:

- Add a repository-local PR delivery command: rejected for this issue because
  the current build-out validates workflow behavior through skills and
  simulations, and real sidecar PR mutation remains activation-gated.
- Add a GitHub Actions or queue-based child runner: rejected as out of scope
  and a new operational dependency before sidecar adoption.

## Decision: Validate PR delivery behavior with local sample checks

Use a PowerShell validation script under `specs/030-sidecar-child-execution/`
to model one prepared child handoff, child checkout/branch proof, task-scope
execution, PR target/body generation, and validation-readiness decisions.

**Rationale**: Issue #256 requires verification of PR body wording, PR target,
and draft/not-ready behavior without mutating GitHub issue state or creating
uncontrolled repository PRs during validation.

**Alternatives considered**:

- Create a real child PR during validation: rejected because it would create
  unnecessary remote mutation for a controlled local validation case.
- Only perform manual text review: rejected because the issue asks for a local
  sample child handoff execution and readiness behavior checks.

## Decision: Preserve normal sequential workflow surfaces unchanged

Do not modify `.agents/skills/catworld-implement-issue/SKILL.md`. Direct child
issue requests outside sidecar `parallel` continue to use the normal sequential
workflow.

**Rationale**: Issue #256 explicitly requires direct child issue requests
outside sidecar `parallel` to keep the normal sequential workflow, and its
validation requires confirming the normal implementation skill is not modified.

**Alternatives considered**:

- Add sidecar child delivery conditions to the sequential skill: rejected
  because that would blur routing boundaries and violate the issue's explicit
  preservation requirement.
