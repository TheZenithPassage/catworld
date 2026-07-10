# Quickstart: Merge-Aware Sidecar Resume and Next-Layer Progression

## Prerequisites

- Work from the issue branch for #257.
- Do not mutate GitHub issues, labels, comments, milestones, or assignees.
- Do not create real sidecar child PRs or merge PRs as validation fixtures.
- Keep `.agents/skills/catworld-implement-issue/SKILL.md` unchanged.
- Treat `workflow/sidecar-buildout` as this issue's temporary integration PR
  base only. Future sidecar coordinator branches still follow the activated
  sidecar workflow model.

## Validation Commands

Implemented validation scenarios:

- `remote-refresh-order`
- `active-child-refresh`
- `resume-states`
- `validation-staleness`
- `unexpected-local-changes`
- `unsafe-divergence`
- `evidence-mismatch`
- `prohibited-operations`

Verify local coordinator refresh occurs before active child refresh:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario remote-refresh-order
```

Expected outcome: the fixture fetches the remote coordinator branch, updates
the local coordinator branch/worktree from that remote state, and only then
allows active child refresh or child integration marking.

Verify active child refresh from updated local coordinator state:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario active-child-refresh
```

Expected outcome: the still-active child branch receives the updated
coordinator state by normal merge only, without rebase, force-push, or history
rewriting.

Verify completed, active, blocked, pending, and ready-next-layer resume states:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario resume-states
```

Expected outcome: the coordinator artifact model records integrated,
active/refreshed, blocked, pending, waiting-for-dependency-merge, and
ready-next-layer child states with reasons after observed merges.

Verify validation freshness handling:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario validation-staleness
```

Expected outcome: validation affected by coordinator refresh or active child
refresh is marked stale until rerun and is not summarized as passed.

Verify unexpected local coordinator changes block resume:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario unexpected-local-changes
```

Expected outcome: dirty local coordinator state blocks refresh before child
integration, child refresh, next-layer launch, or GitHub mutation.

Verify unsafe coordinator divergence blocks resume:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario unsafe-divergence
```

Expected outcome: unsafe local/remote divergence blocks refresh and does not
attempt rebase, force-push, force-with-lease, history rewriting, or local
`main` updates.

Verify conflicting resume evidence blocks continuation:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario evidence-mismatch
```

Expected outcome: current evidence conflicting with recorded coordinator
artifact state blocks resume instead of relying on private conversation
context.

Verify prohibited operations stay blocked:

```powershell
.\specs\031-merge-aware-sidecar-resume\validation\simulate-merge-aware-sidecar-resume.ps1 -Scenario prohibited-operations
```

Expected outcome: rebase, force-push, force-with-lease, history rewriting,
local `main` updates, GitHub issue mutation, PR merges, remote cleanup,
resource deletion, and silent sequential fallback remain prohibited.

Confirm the normal sequential implementation skill was not modified:

```powershell
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
```

Expected outcome: no output.

Run final whitespace validation:

```powershell
git diff --check
```

Expected outcome: no whitespace errors.

Rerun affected validation after relevant late edits to sidecar skill text,
architecture documentation, the #257 contract, or the validation script.
