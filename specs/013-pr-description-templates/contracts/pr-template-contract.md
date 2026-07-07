# PR Template Contract

This contract defines the observable wording requirements for issue #224.

## Sidecar Child PR Description

Applies to PRs from a child branch into a coordinator branch.

- Must reference the child issue as `Related to #<child-issue>`.
- Must reference the coordinator issue as `Related to #<coordinator-issue>`.
- Must not use default issue-closing keywords for the child or coordinator issue.
- Must include enough summary, change, and validation space for reviewer context.

## Final Coordinator PR Description

Applies to the sidecar coordinator branch PR into `main`.

- May use `Closes #<coordinator-issue>`.
- May use `Closes #<child-issue>` for each child issue that should be closed by the final delivery PR.
- Must include enough summary, child PR, change, and validation space for reviewer context.

## Normal Sequential and Closed-Child Final-Pass PR Descriptions

Normal one-issue/one-PR work keeps the existing PR description behavior from
`AGENTS.md`. A coordinator with all child issues closed that enters the existing
sequential final-pass workflow also uses normal sequential PR wording.
