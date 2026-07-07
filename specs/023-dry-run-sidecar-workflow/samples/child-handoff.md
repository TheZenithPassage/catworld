# Sidecar Child Handoff Evidence

This sample shows the handoff shape for `DRY-9902`. It is local evidence only;
no child implementation was launched.

## Handoff Summary

| Field | Value |
|-------|-------|
| Coordinator issue | `DRY-9901` |
| Child issue | `DRY-9902` |
| Child title | Child routing fixture |
| Child state | Open fixture |
| Prepared child artifacts | `specs/9902-child-routing-fixture/spec.md`, `plan.md`, `tasks.md` |
| Shared contract | Coordinator artifact shared contract section |
| Dependency status | Independent candidate |
| Coordinator branch | `sidecar/9901-coordinator-controlled-workflow-dry-run` |
| Child branch | `sidecar/9902-child-routing-fixture` |
| Child checkout/worktree | `<sidecar-parent>/9902-child-routing-fixture` |
| Intended child PR target | `sidecar/9901-coordinator-controlled-workflow-dry-run` |
| Issue reference wording | `Related to DRY-9902` and `Related to DRY-9901` |
| Cleanup eligibility | Not eligible until final coordinator PR merges into `main` |
| GitHub mutation approval | Absent; no issue mutation allowed |
| Public comment approval | Absent; no public comment allowed |
| Remote cleanup approval | Absent; no remote cleanup allowed |

## Required Inputs Present

- child issue number, title, body, state, dependencies, and validation requirements;
- coordinator issue number, title, child issue map, dependency layer, and source references;
- prepared `spec.md`, `plan.md`, and `tasks.md` paths;
- shared contract reference;
- dependency-ready status;
- coordinator branch and child branch expectations;
- child PR target and issue-reference wording;
- validation freshness requirements;
- blocker categories and human-only decision rules.

Status: passed for dry-run handoff shape.

## Blocked Child Handoff: DRY-9904

`DRY-9904` intentionally simulates a missing shared contract. Required behavior:

- stop before delegation;
- do not invent a seed, foundation, or shared-contract child issue;
- report the shared-contract blocker and required user guidance;
- do not create child branch, checkout/worktree, PR, GitHub mutation, or public comment.

Status: blocked. This is the expected result for the simulated shared-contract
gap.
