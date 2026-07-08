# Quickstart

## Prerequisites

- Work from the active issue branch.
- Keep `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` unmodified unless explicit user approval is obtained during this task.
- Rerun validation after any late edit to active routing or template text.

## Validation Commands

```powershell
rg -n "catworld-orchestrate-coordinator-issue|seed|Closes #<child|Related to #<child|parallel mode|#261|must still stop|Git branch or worktree operations|pull request handling" AGENTS.md .agents/skills docs/ARCHITECTURE.md .github specs/024-dormant-coordinator-routing
```

Expected outcome: any remaining `catworld-orchestrate-coordinator-issue` references are dormant, historical, or explicitly non-routing; remaining `seed`, child PR issue-reference, final coordinator PR closing, `parallel mode`, and #261 activation references do not contradict issue #250.

```powershell
git diff -- .agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md
```

Expected outcome: no diff unless explicit user approval was obtained.

```powershell
git diff --check
```

Expected outcome: no whitespace errors.

## Manual Review

- Confirm normal issue and direct child issue routing still points to `catworld-implement-issue`.
- Confirm coordinator issues without active sidecar `parallel` routing keep existing open-child and closed-child guardrails.
- Confirm explicit eligible coordinator `parallel` guidance is future-facing and depends on #261 activation.
- Confirm sidecar child guidance uses `Related to` wording and does not close issues from child PRs.
- Confirm final sidecar coordinator PR guidance may close the coordinator issue and included child issues through closing keywords.
- Confirm child agents must use coordinator-provided artifacts and stop on unresolved shared contracts or product behavior.
- Confirm no active automatic seed-first behavior remains.
