# Quickstart: Harden Spec Kit Validation Workflow

## Prerequisites

- Work from the issue branch `chore/189-harden-spec-kit-workflow-validation-coverage`.
- Do not change CatWorld application behavior or existing generated feature directories under `specs/001-*` or `specs/002-*`.

## Validation Steps

1. Run whitespace validation from the repository root:

   ```powershell
   git diff --check
   ```

   Expected result: no output and exit code 0.

2. Review every changed Spec Kit skill/template file for contradictions:

   - `.agents/skills/speckit-specify/SKILL.md`
   - `.agents/skills/speckit-plan/SKILL.md`
   - `.agents/skills/speckit-tasks/SKILL.md`
   - `.agents/skills/speckit-analyze/SKILL.md`
   - `.agents/skills/speckit-converge/SKILL.md`
   - `.agents/skills/speckit-implement/SKILL.md`
   - `.agents/skills/catworld-implement-issue/SKILL.md`
   - `.specify/templates/spec-template.md`
   - `.specify/templates/plan-template.md`
   - `.specify/templates/tasks-template.md`

   Expected result: no stale contradiction allows incomplete validation evidence to be treated as complete.

3. Review changed files for duplicated rules that could drift.

   Expected result: each rule lives primarily at the generation or enforcement point where it is needed, with only short references elsewhere.

4. Confirm scope boundaries:

   ```powershell
   git status --short
   git diff --name-only
   ```

   Expected result: no application behavior code changes; no existing `specs/001-*` or `specs/002-*` files modified.

5. Confirm workflow proportionality:

   - Technical/enabling features can still use technical outcomes instead of artificial user stories.
   - Backend-only or documentation-only work is not forced into heavy UI matrices or manual smoke tests.
   - Observable, contract, authorization, persistence, migration, security, shared component, global style, mobile, i18n, and correctness-sensitive work requires appropriate evidence.

6. Confirm decision blocking:

   - Unresolved major product, architecture, persistence, security, shared-contract, UX, or operational decisions still block implementation.
   - Agents are not instructed to infer or approve their own significant technical decisions.
