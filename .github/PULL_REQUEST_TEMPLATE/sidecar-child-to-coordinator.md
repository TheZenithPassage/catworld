Related to #<child-issue>
Related to #<coordinator-issue>

Adds <one-sentence summary of the child issue result>.

Changes:
- <important child-scope change>
- <important child-scope change>

Validation:
- `<command or review evidence>`
- `<command or review evidence>`

Coordinator notes:
- Target coordinator branch: `<coordinator-branch>`
- Child issue scope only; sibling child work and coordinator finalization remain out of scope.
- This sidecar child PR is not the final delivery PR to `main`.
- Issue references use `Related to` wording only.
- Required merge method: the user performs the merge and selects GitHub's **"Create a merge commit"**.
- **"Squash and merge"** and **"Rebase and merge"** are prohibited because the exact delivered child commit must remain in refreshed coordinator ancestry; merged metadata alone is insufficient.
- Codex reports readiness but must not merge this PR or modify repository merge settings.
- A coordinator waiting state resumes only after the required child PR merges are complete and current GitHub and repository evidence is refreshed.
- GitHub issue bodies, checklists, labels, assignees, milestones, issue state, and public comments require explicit user approval before mutation.
- Remote branch deletion, remote pruning, and remote cleanup require explicit user approval.
