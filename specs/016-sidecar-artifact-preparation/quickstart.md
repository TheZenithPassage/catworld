# Quickstart: Sidecar Artifact Preparation

## Prerequisites

- Work from `chore/227-add-coordinator-child-artifact-preparation`.
- Do not run child implementation, branch/worktree orchestration, PR creation,
  GitHub issue mutation, or product code changes for this feature.
- Re-run these checks after any relevant edit to the sidecar skill,
  documentation, or feature artifacts.

## Simulation Fixture

Use this local coordinator simulation for manual validation:

| Issue | Title | Role | Dependencies |
|-------|-------|------|--------------|
| #300 | `[Workflow] Parallel coordinator adoption dry run` | Coordinator | Children #301, #302, #303 |
| #301 | `[Workflow] Prepare owner detail child` | Child | Shared contract: detail-dialog navigation |
| #302 | `[Workflow] Prepare cat detail child` | Child | Depends on shared contract from #301/#303 |
| #303 | `[Workflow] Prepare stay detail child` | Child | Shared contract: detail-dialog navigation |

Expected coordinator path:

```text
specs/300-coordinator-parallel-coordinator-adoption-dry-run/
```

Expected child paths:

```text
specs/301-prepare-owner-detail-child/
specs/302-prepare-cat-detail-child/
specs/303-prepare-stay-detail-child/
```

Expected coordinator artifact sections:

- child issue map;
- dependency layers;
- shared contract section;
- validation plan;
- status table.

Expected child artifact set for each child:

```text
specs/<child-issue-number>-<child-slug>/
├── spec.md
├── plan.md
└── tasks.md
```

## Local Checks

1. Confirm artifact-preparation language exists in the sidecar skill:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'artifact-preparation','coordinator orchestration artifact','child issue map','dependency layers','shared contract','validation plan','status table'
   ```

   Expected outcome: matches for all required artifact-preparation concepts.

2. Confirm child artifact expectations and #225 path rules exist:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'spec.md','plan.md','tasks.md','specs/<coordinator-number>-coordinator-<slug>','specs/<child-issue-number>-<child-slug>'
   ```

   Expected outcome: matches for child artifacts and both path patterns.

3. Confirm blocker behavior for unsafe artifacts and missing shared contracts:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'stop before delegation','missing shared contract','unsafe','scope conflict','artifact path'
   ```

   Expected outcome: matches show the workflow stops before delegation when
   prepared artifacts, shared contracts, or paths are unsafe.

4. Confirm the workflow does not invent seed, foundation, or shared-contract child issues:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'seed','foundation','shared-contract child'
   ```

   Expected outcome: matches prohibit inventing or creating such child issues
   unless they already exist or the user explicitly approves creating them.

5. Confirm closed-child coordinator final passes remain outside sidecar artifact preparation:

   ```powershell
   Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'closed-child','final pass','not use artifact preparation'
   ```

   Expected outcome: matches preserve the existing sequential final-pass path.

6. Confirm `catworld-implement-issue` is untouched:

   ```powershell
   git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
   ```

   Expected outcome: no output.

7. Confirm changed files stay within issue #227 scope:

   ```powershell
   git diff --name-only
   ```

   Expected outcome: changed paths are limited to `.agents/skills/catworld-parallel-coordinator/SKILL.md`, aligned workflow documentation if needed, and `specs/016-sidecar-artifact-preparation/`.

8. Check whitespace in changed files:

   ```powershell
   git diff --check
   ```

   Expected outcome: no output and exit code `0`.

## Freshness Rule

Any check affected by later edits must be rerun. If a check cannot be rerun,
report it as `not revalidated` instead of passed.
