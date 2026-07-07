# Sample: Coordinator Resume State

Coordinator issue: #220
Workflow: sidecar coordinator parallel
Coordinator branch: `sidecar/220-coordinator-parallel-workflow`
Final coordinator PR: not opened
Cleanup eligibility: ineligible
Remote cleanup approval: not approved

## Resume Re-Read Checklist

Before continuing this coordinator run, the next session must re-read:

- coordinator issue #220 and listed child issues;
- child PR state for children already opened;
- coordinator artifact and child artifacts;
- coordinator branch state;
- active child branch and checkout/worktree state;
- validation evidence and freshness;
- blockers, conflicts, and human-only decisions;
- cleanup eligibility and remote cleanup approval state.

Private conversation context is not a source of truth for resume.

## Child Status Table

| Child | Artifact Path | Branch | Local Checkout / Worktree | PR | Validation State | Workflow Status | Blockers | Refresh State | Cleanup Eligibility |
|-------|---------------|--------|---------------------------|----|------------------|-----------------|----------|---------------|---------------------|
| #229 Add sidecar Git execution rules | `specs/229-sidecar-git-rules/` | `sidecar/229-sidecar-git-rules` | `C:\worktrees\catworld-sidecar\229-sidecar-git-rules` | #301 merged to coordinator | passed, fresh when merged | complete | none | not needed | ineligible until final coordinator PR merges into `main` |
| #232 Add resumable state tracking | `specs/232-sidecar-resume-state/` | `sidecar/232-sidecar-resume-state` | `C:\worktrees\catworld-sidecar\232-sidecar-resume-state` | not opened | stale after coordinator branch update | active | none | needed after #229 merge | ineligible until final coordinator PR merges into `main` |
| #233 Add explicit split handoff alignment | `specs/233-sidecar-split-handoff/` | `sidecar/233-sidecar-split-handoff` | `C:\worktrees\catworld-sidecar\233-sidecar-split-handoff` | draft | blocked | blocked | shared-contract blocker requires user guidance | not needed until blocker resolves | ineligible until final coordinator PR merges into `main` |
| #234 Add controlled dry-run and adoption gate | `specs/234-sidecar-adoption-dry-run/` | not started | not started | not opened | not run | pending | none | not needed | not eligible because no sidecar local resource exists |

## Resume Summary

- Completed child work is identifiable by merged PR state and retained artifact,
  branch, checkout, and validation evidence.
- Active child work is identifiable by branch, checkout, stale validation, and
  refresh-needed state.
- Blocked child work records the blocker category and required user guidance.
- Pending child work records its artifact path and status without implying that
  local Git resources exist.
- No local sidecar branches or worktrees are cleanup-eligible because the final
  coordinator PR has not merged into `main`.
- Remote cleanup is blocked because explicit user approval is absent.
