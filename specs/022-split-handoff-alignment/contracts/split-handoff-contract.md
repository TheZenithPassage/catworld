# Split Handoff Contract

This contract defines the required output shape for explicit issue splitting.
It applies only when the user explicitly requests issue splitting or task-to-issue
handoff generation.

## Coordinator Rewrite Body

The rewritten coordinator issue body must contain these sections in order:

- Goal
- Preserved scope
- Child issues
- Dependencies
- Execution model
- Validation
- Out of scope

The coordinator body must state that:

- The split preserves the source issue scope and does not add or remove product behavior.
- Issue splitting does not activate parallel mode by itself.
- Normal issues and direct child issue end-to-end requests use the current sequential workflow.
- Sidecar parallel work requires an explicit `parallel` request on a clearly identified coordinator issue after sidecar support exists and has passed its adoption gate.
- Parallel readiness comes from coordinator preflight, child issue inspection, dependency classification, and source-of-truth review; the handoff must not require or invent a `parallel-ready` label.
- A coordinator end-to-end request while any listed child issue is still open must stop for routing.
- A coordinator with all listed child issues closed may enter the existing sequential workflow for final verification and delivery.
- Coordinator finalization is not a separate workflow and must not reimplement closed child issue scope.

## Child Issue Body

Each child issue body must contain these sections in order:

- Parent coordinator
- Scope
- Dependencies
- Validation
- Out of scope

Each child issue body must state that:

- The child references the coordinator issue.
- The child remains directly implementable through the normal sequential workflow when the user chooses one-by-one execution.
- The child does not activate sidecar parallel mode by itself.
- The child does not perform coordinator finalization or reimplement sibling child issue scope.

## Optional PR Wording Guidance

If the split handoff includes sidecar PR wording guidance:

- Child PR wording must use `Related to #<child-issue>` and `Related to #<coordinator-issue>`.
- Child PR wording must not close the child or coordinator issue by default.
- Final sidecar coordinator PR wording may close the coordinator issue and included child issues.
- Closed-child coordinator final-pass PR wording follows normal sequential PR wording.

## Non-Goals

- Do not create real product issues during local validation.
- Do not scan real issues unless explicitly requested.
- Do not change `.agents/skills/catworld-implement-issue/SKILL.md`.
- Do not add, remove, or reinterpret source issue product scope.
