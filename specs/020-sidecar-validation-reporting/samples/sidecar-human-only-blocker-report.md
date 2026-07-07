# Sample Report: Human-Only Blocker

Coordinator issue: #220
Affected children: #231, #234
Coordinator readiness: blocked

## Human-Only Blocker

Category: Git/GitHub workflow outside the approved model

Evidence: A proposed sidecar recovery step would force-push a child branch
after a coordinator branch refresh.

Affected scope: active sidecar child branches and coordinator delivery safety.

Required human decision: provide explicit guidance for an approved recovery
model or revise the sidecar workflow. Codex must not force-push, rebase-push,
or invent a history-rewriting recovery path.

## Validation Evidence

| Evidence | Status | Notes |
|----------|--------|-------|
| Review against issue #229 Git rules | passed | #229 disallows rebase, force-push and history-rewriting updates. |
| Review against issue #231 human-only blocker rules | passed | Git/GitHub workflow outside the approved model is human-only. |
| Recovery validation | not run | Blocked pending human decision. |

## Summary

The blocker is human-only because it would change the approved Git/GitHub
workflow model. Sidecar work remains blocked until the user provides guidance.
