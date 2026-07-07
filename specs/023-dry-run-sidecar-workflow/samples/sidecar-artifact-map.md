# Sidecar Artifact Map

This map describes the artifacts that the sidecar coordinator would prepare or
require for `DRY-9901` in dry-run mode. These paths are recorded, not created,
so this issue remains separate from real sidecar execution.

## Coordinator Artifact

| Field | Value |
|-------|-------|
| Coordinator issue | `DRY-9901` |
| Coordinator title | Controlled workflow dry-run coordinator |
| Coordinator artifact path | `specs/9901-coordinator-controlled-workflow-dry-run/` |
| Coordinator branch | `sidecar/9901-coordinator-controlled-workflow-dry-run` |
| Coordinator checkout/worktree | `<sidecar-parent>/9901-coordinator-controlled-workflow-dry-run` |
| Final PR target | `main` |

Required coordinator artifact sections:

- coordinator issue number, title, classification, and source references;
- child issue map;
- dependency layers;
- shared contract section;
- sidecar Git state;
- sidecar PR delivery state;
- sidecar validation reporting state;
- sidecar resume state;
- validation plan;
- child status table.

Status: passed.

## Child Artifacts

| Child | Title | Artifact Path | Branch | Checkout / Worktree | PR Target | Dependency Layer | Status |
|-------|-------|---------------|--------|---------------------|-----------|------------------|--------|
| `DRY-9902` | Child routing fixture | `specs/9902-child-routing-fixture/` | `sidecar/9902-child-routing-fixture` | `<sidecar-parent>/9902-child-routing-fixture` | `sidecar/9901-coordinator-controlled-workflow-dry-run` | Independent candidate | passed |
| `DRY-9903` | Child reporting fixture | `specs/9903-child-reporting-fixture/` | `sidecar/9903-child-reporting-fixture` | `<sidecar-parent>/9903-child-reporting-fixture` | `sidecar/9901-coordinator-controlled-workflow-dry-run` | Independent candidate | passed |
| `DRY-9904` | Child resume fixture | `specs/9904-child-resume-fixture/` | Not created in this dry-run | Not created in this dry-run | `sidecar/9901-coordinator-controlled-workflow-dry-run` | Blocked by simulated shared-contract gap as expected | blocked |

Each child artifact set would contain:

```text
specs/<child-issue-number>-<child-slug>/
├── spec.md
├── plan.md
└── tasks.md
```

## Collision and Scope Review

- Paths are distinct because issue numbers are the uniqueness key.
- The dry-run does not overwrite, merge, delete, silently reuse, or automatically rename any existing artifacts.
- No seed, foundation, or shared-contract child issue is invented.
- The simulated shared-contract gap for `DRY-9904` stops affected work for user guidance.

Status: passed.
