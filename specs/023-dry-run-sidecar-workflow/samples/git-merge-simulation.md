# Git Merge Simulation

This simulation was run in a temporary local Git repository. It did not create
real CatWorld sidecar branches, worktrees, pull requests, or remote state.

## Commands Modeled

- Create local `main`.
- Create coordinator branch from `main`.
- Create two child branches from the coordinator branch.
- Merge child A into the coordinator branch.
- Refresh active child B from the coordinator branch using a normal merge.

## Transcript

```text
Initialized empty Git repository in C:/Users/moshe/AppData/Local/Temp/catworld-sidecar-dryrun-2a8b3e153b274414a05cdf066cc4b131/.git/

[main (root-commit) 984ad10] initial main
 1 file changed, 1 insertion(+)
 create mode 100644 workflow.txt

[sidecar/9901-coordinator-controlled-workflow-dry-run a016022] coordinator setup
 1 file changed, 1 insertion(+)
 create mode 100644 coordinator.txt

[sidecar/9902-child-routing-fixture 8b1a264] child A work
 1 file changed, 1 insertion(+)
 create mode 100644 child-a.txt

[sidecar/9903-child-reporting-fixture cb4dbfd] child B work
 1 file changed, 1 insertion(+)
 create mode 100644 child-b.txt

Merge made by the 'ort' strategy.
 child-a.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 child-a.txt

Merge made by the 'ort' strategy.
 child-a.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 child-a.txt

CURRENT_BRANCH=sidecar/9903-child-reporting-fixture
GRAPH=
*   869f59b (HEAD -> sidecar/9903-child-reporting-fixture) refresh child B from coordinator
|\
| *   954510d (sidecar/9901-coordinator-controlled-workflow-dry-run) merge child A into coordinator
| |\
| | * 8b1a264 (sidecar/9902-child-routing-fixture) child A work
| |/
* / cb4dbfd child B work
|/
* a016022 coordinator setup
* 984ad10 (main) initial main

REBASE_OR_FORCE_PUSH_USED=false
HISTORY_REWRITING_USED=false
```

## Result

| Check | Status | Evidence |
|-------|--------|----------|
| Coordinator branch starts from main-equivalent base | passed | Coordinator branch was created after initial `main` commit. |
| Child branches start from coordinator branch | passed | Child A and child B were created after coordinator setup. |
| Child A merges into coordinator branch | passed | `merge child A into coordinator` is a merge commit on the coordinator branch. |
| Active child B refreshes from coordinator branch | passed | `refresh child B from coordinator` is a merge commit on child B. |
| Rebase used | passed | Not used. |
| Force-push used | passed | Not used. |
| History rewriting used | passed | Not used. |

Validation affected by the child branch refresh must be rerun or marked stale
before child B can be reported ready.
