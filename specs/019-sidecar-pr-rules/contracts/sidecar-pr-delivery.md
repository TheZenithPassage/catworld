# Contract: Sidecar PR Delivery Rules

This contract defines the observable pull request target, issue closure, and
GitHub mutation rules for issue #230.

## Sidecar Child PR

Applies to PRs from a sidecar child branch into the coordinator integration
branch.

- Must target the coordinator integration branch.
- Must not target `main` directly.
- Must reference the child issue with `Related to #<child-issue>`.
- Must reference the coordinator issue with `Related to #<coordinator-issue>`.
- Must not use issue-closing keywords for child or coordinator issues.
- Must not imply that the child PR is the final delivery PR to `main`.
- Must not modify GitHub issue bodies, checklists, labels, assignees,
  milestones, issue state, or public comments without explicit user approval.

## Final Sidecar Coordinator PR

Applies to the sidecar coordinator branch PR into `main`.

- Must target `main`.
- May use issue-closing wording for the coordinator issue.
- May use issue-closing wording for child issues in the sidecar set.
- Must identify integrated child PRs or child issue references clearly enough
  for reviewer traceability.
- Must state that the user performs merges and Codex reports readiness.
- Must not modify GitHub issue bodies, checklists, labels, assignees,
  milestones, issue state, or public comments without explicit user approval.

## Normal Sequential and Closed-Child Final-Pass PRs

Normal one-issue/one-PR work keeps the existing PR target and closure behavior.
Direct child issue work outside explicit sidecar `parallel` mode also uses the
normal sequential PR behavior.

A coordinator with all child issues already closed that enters the existing
sequential final-pass workflow uses normal sequential PR behavior for any
remaining final pass. It does not use the sidecar child/final PR model.

## Remote Cleanup

Remote branch deletion, remote pruning, and remote cleanup require explicit user
approval. Sidecar PR delivery rules must not imply remote cleanup authority.
