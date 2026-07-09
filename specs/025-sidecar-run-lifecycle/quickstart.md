# Quickstart

## Prerequisites

- Work from the active issue branch for #251.
- Treat issue #250 as the completed dormant-routing baseline.
- Do not create real sidecar branches, worktrees, child-agent launches, PRs, or
  GitHub issue mutations while implementing #251.
- Rerun affected validation after any late edit to routing, lifecycle, PR, or
  artifact-writing text.

## Validation Commands

```powershell
rg -n "not implemented yet|future sidecar|after adoption|Stop after preflight|do not launch child execution" AGENTS.md .agents/skills docs/ARCHITECTURE.md
```

Expected outcome: remaining inactive/adoption-gate wording is intentional until
#261 and cannot be read as enabling sidecar product use early.

```powershell
git diff --check
```

Expected outcome: no whitespace errors.

## Manual Routing Matrix

Review active workflow guidance and confirm these outcomes:

| Scenario | Expected Current Behavior | Expected Post-#261 Behavior |
|----------|---------------------------|-----------------------------|
| Normal issue | Sequential workflow. | Sequential workflow. |
| Direct child issue | Sequential workflow. | Sequential workflow unless it is a prepared sidecar handoff. |
| Non-coordinator `parallel` | Stop with routing error. | Stop with routing error. |
| Valid coordinator `parallel` | Stop because sidecar parallel is not active until #261. | Start or resume sidecar lifecycle when eligible. |
| Blocked coordinator `parallel` | Report activation/preflight blocker. | Report the specific lifecycle blocker. |
| Coordinator waiting for user merge | Report required user merges before resume. | Same. |
| Resumed coordinator | Stop before real sidecar execution while build-out is inactive. | Re-read evidence, refresh coordinator branch/worktree, and continue only if consistent. |
| Closed-child coordinator final pass | Existing sequential final-pass guardrails. | Same. |

## Manual Lifecycle Matrix

Review the changed sidecar lifecycle text and confirm:

- Every lifecycle state has entry conditions, stop conditions, and allowed next
  states.
- Codex-owned operations are separated from user-owned merges.
- Dependency layers are preserved and hard-dependent layers do not start
  together.
- Waiting states tell the user exactly which child PRs must be merged into the
  remote coordinator branch before resume.
- Resume refreshes the local coordinator branch/worktree from the remote
  coordinator branch before continuing.
- Active child branches refresh from the updated coordinator branch by
  fast-forward or normal merge only.
- Integrated validation precedes the final coordinator PR to `main`.
- Local cleanup is eligible only after the final coordinator PR has merged into
  `main`.

## Manual Artifact Boundary Matrix

Review the changed text and confirm:

- Artifact paths and content may be planned before branch/worktree preparation.
- Artifact files are not written while the current checkout is `main`.
- If the coordinator branch/worktree cannot be created or entered safely, Codex
  stops before modifying files.
- Coordinator and child artifacts are written only inside the coordinator
  branch/worktree.
- Local `main` remains clean during artifact planning: no sidecar artifacts,
  sidecar commits, or untracked sidecar files.
