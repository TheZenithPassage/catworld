# Sample: Sidecar Cleanup Eligibility

Coordinator issue: #220
Workflow: sidecar coordinator parallel

## Cleanup State Before Final Coordinator PR Merge

| Resource | Created By Sidecar Workflow? | Current State | Cleanup Eligible? | Reason |
|----------|------------------------------|---------------|-------------------|--------|
| `sidecar/229-sidecar-git-rules` | yes | child PR merged into coordinator branch | no | Individual child PR merges do not make local cleanup eligible |
| `C:\worktrees\catworld-sidecar\229-sidecar-git-rules` | yes | retained local child checkout | no | Local sidecar worktrees are retained until final coordinator PR merge |
| `sidecar/232-sidecar-resume-state` | yes | active child branch | no | Active work cannot be cleaned up |
| `C:\worktrees\catworld-sidecar\232-sidecar-resume-state` | yes | active child checkout | no | Active work cannot be cleaned up |
| remote `origin/sidecar/229-sidecar-git-rules` | yes | remote branch exists | no | Remote cleanup requires explicit user approval |

## Cleanup State After Final Coordinator PR Merge Into `main`

| Resource | Created By Sidecar Workflow? | Cleanup Eligible? | Limit |
|----------|------------------------------|-------------------|-------|
| Local child branch `sidecar/229-sidecar-git-rules` | yes | yes | Local cleanup only |
| Local child worktree `C:\worktrees\catworld-sidecar\229-sidecar-git-rules` | yes | yes | Local cleanup only |
| Local coordinator branch `sidecar/220-coordinator-parallel-workflow` | yes | yes | Local cleanup only |
| User-created unrelated branch | no | no | Outside sidecar-created resource set |
| Remote child branch | yes | blocked without approval | Explicit user approval required |
| Remote pruning | N/A | blocked without approval | Explicit user approval required |

## Summary

Local cleanup is ineligible after individual child PR merges. Local cleanup
becomes eligible only after the final coordinator PR has merged into `main`,
and only for local branches and worktrees created by the sidecar workflow.
Remote branch deletion, remote pruning, and any remote cleanup remain blocked
unless the user explicitly approves them.
