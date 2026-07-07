Closes #220
Closes #231
Closes #232

Adds the completed sidecar coordinator delivery set for validation and state tracking.

Integrated child PRs:
- #401 for #231
- #402 for #232

Changes:
- Integrates sidecar validation, blocker, and conflict rules.
- Integrates sidecar resumable state tracking and cleanup policy rules.

Validation:
- `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,docs/ARCHITECTURE.md -Pattern 'final coordinator PR','target `main`','explicit user approval'`
- Manual review against #220, #231, and #232.

Coordinator delivery notes:
- Source branch: `sidecar/220-coordinator-add-opt-in-codex-coordinator-parallel-workflow`
- Target branch: `main`
- Use this sample only for sidecar coordinator delivery into `main`.
- This final coordinator PR is the only sidecar PR sample that may close the coordinator set.
- Codex reports readiness; the user performs merges.
- GitHub issue bodies, checklists, labels, assignees, milestones, issue state, and public comments require explicit user approval before mutation.
- Remote branch deletion, remote pruning, and remote cleanup require explicit user approval.
