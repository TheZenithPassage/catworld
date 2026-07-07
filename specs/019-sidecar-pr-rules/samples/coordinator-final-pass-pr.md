Closes #220

Adds the remaining coordinator final-pass verification for the sidecar workflow.

Changes:
- Verifies that already closed child issues collectively preserve coordinator scope.
- Completes remaining coordinator-level review without reimplementing closed child issue scope.

Validation:
- `Select-String -Path docs/ARCHITECTURE.md -Pattern 'closed-child coordinator final pass','normal sequential PR behavior'`
- Manual review against #220, #224, #229, and #230.

Sequential delivery notes:
- Target branch: `main`
- This is a closed-child coordinator final pass, not sidecar child/final PR routing.
- Normal one-issue/one-PR wording and delivery behavior applies.
- GitHub issue bodies, checklists, labels, assignees, milestones, issue state, and public comments require explicit user approval before mutation.
- Remote branch deletion, remote pruning, and remote cleanup require explicit user approval.
