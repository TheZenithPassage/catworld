# Issue Template Contract

## Coordinator Parallel Planning Template

The coordinator template must create an issue body with these sections:

- Goal
- Preserved scope
- Child issues
- Dependencies
- Execution model
- Validation
- Out of scope

The body must state that:

- The template does not activate parallel mode by itself.
- Sidecar parallel work requires an explicit `parallel` request on a clearly identified coordinator issue after sidecar support exists and has passed its adoption gate.
- Parallel readiness comes from coordinator preflight, child issue inspection, dependency classification, and source-of-truth review; the template must not require or invent a `parallel-ready` label.
- A coordinator with all listed child issues closed may enter the existing sequential workflow for final verification and delivery.
- Coordinator finalization must not reimplement closed child issue scope.

## Focused Child Issue Template

The child issue template must create an issue body with these sections:

- Parent coordinator
- Scope
- Dependencies
- Validation
- Out of scope

The body must state that:

- The template does not activate parallel mode by itself.
- Child issues may still be implemented directly through the normal sequential workflow when the user chooses to do them one by one.

## Non-Goals

- The templates must not change the normal issue workflow.
- The templates must not duplicate full Spec Kit artifacts.
- The templates must not define PR description templates.
