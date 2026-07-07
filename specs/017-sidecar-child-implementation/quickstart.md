# Quickstart: Sidecar Child Implementation Skill Validation

## Prerequisites

- Work from branch `chore/228-create-sidecar-child-implementation-skill`.
- Keep `.agents/skills/catworld-implement-issue/SKILL.md` unchanged.
- Use issue #228, parent epic #220, and the prepared artifact model from #227 as the scope contract.

## Local Sample Handoff Review

Create or review `specs/017-sidecar-child-implementation/samples/sample-child-handoff.md`.

Expected outcome:

- the sample handoff identifies exactly one child issue;
- it includes coordinator context, prepared `spec.md`, `plan.md`, `tasks.md`, shared contract references, validation requirements, dependency status, and target coordinator branch/worktree context;
- it shows at least one missing-context blocker example;
- it does not ask the child skill to generate planning artifacts, create branches, open PRs, mutate GitHub issues, or target `main`.

## Text Checks

Run these checks from the repository root after implementation:

```powershell
Test-Path .agents/skills/catworld-parallel-child-implementation/SKILL.md
rg "Required Handoff Inputs|Stop Conditions|prepared.*spec.md|prepared.*plan.md|prepared.*tasks.md|shared contract|closed-child coordinator final pass|catworld-implement-issue" .agents/skills/catworld-parallel-child-implementation/SKILL.md
rg "sidecar child|catworld-parallel-child-implementation|closed-child coordinator final" docs/ARCHITECTURE.md
```

Expected outcome:

- the new skill exists;
- the skill names the required prepared inputs, stop conditions, shared-contract boundary, and normal workflow exclusions;
- architecture documentation records the sidecar child boundary without changing product architecture.

## Normal Workflow Preservation

Run:

```powershell
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
```

Expected outcome:

- no output. The normal implementation skill is untouched.

## Scope and Formatting Review

Run:

```powershell
git diff --name-only
git diff --check
```

Expected outcome:

- changed files are limited to the new sidecar child skill, focused workflow documentation if needed, and #228 Spec Kit artifacts;
- no whitespace errors are reported.

## Freshness Rule

Rerun the relevant checks after any later edit to the sidecar skill, architecture documentation, or sample handoff. If a check is not rerun after a relevant late edit, report it as `not revalidated` rather than passed.
