Related to #231
Related to #220

Adds sidecar validation, blocker, and conflict rules for coordinator delivery.

Changes:
- Defines validation and blocker expectations for one sidecar child issue.
- Keeps sibling child work and coordinator finalization outside this child scope.

Validation:
- `Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md -Pattern 'validation','blocked','conflict'`
- Manual review against #220 and the prepared coordinator handoff.

Coordinator notes:
- Source branch: `sidecar/231-sidecar-validation-blockers-conflicts`
- Target coordinator branch: `sidecar/220-coordinator-add-opt-in-codex-coordinator-parallel-workflow`
- Issue references use `Related to` wording only.
- This sidecar child PR is not the final delivery PR to `main`.
- Codex reports readiness; the user performs merges.
- GitHub issue bodies, checklists, labels, assignees, milestones, issue state, and public comments require explicit user approval before mutation.
- Remote branch deletion, remote pruning, and remote cleanup require explicit user approval.
