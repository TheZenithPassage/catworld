# Research: Sidecar Validation Reporting

## Decision: Use existing sidecar workflow sources plus local Markdown reports

**Rationale**: Issue #231 is a workflow reporting feature. Existing sidecar
coordinator and child skills already own routing, artifact, Git, PR, and
prohibited side-effect boundaries, while `docs/ARCHITECTURE.md` is the longer
repository source of truth for workflow routing. Extending those existing
sources and adding feature-local sample reports satisfies the issue without
adding automation, dependencies, product code, GitHub mutation, or normal
sequential reporting changes.

**Alternatives considered**:

- Add report-generation scripts. Rejected because #231 asks to define
  reporting rules and produce local sample reports, not introduce executable
  report automation.
- Modify the normal sequential implementation skill. Rejected because #231
  requires normal sequential validation/reporting behavior to remain unchanged.
- Add a new dedicated sidecar reporting skill now. Rejected as unnecessary for
  #231 because the existing sidecar coordinator/child skills are sufficient
  source-of-truth locations; a later issue may split this if adoption proves the
  need.

## Decision: Treat stale and incomplete validation as non-passing evidence

**Rationale**: Issue #231 explicitly requires reports to record commands run,
failed, and not run, and states that failed validation must never be summarized
as passed. The existing CatWorld workflow also requires stale validation after
late changes to be reported as stale or rerun before being counted as passed.

**Alternatives considered**:

- Allow stale validation to remain ready-eligible with a warning. Rejected
  because branch updates can invalidate child or coordinator evidence.
- Collapse skipped, not-run, partial, interrupted, and stale evidence into a
  generic warning. Rejected because #231 requires explicit and reproducible
  reporting.

## Decision: Stop for user guidance on material conflicts and human-only blockers

**Rationale**: Issue #231 identifies conflict surfaces and blocker categories
that Codex must not decide silently, including contracts, scope, persistence,
security, authorization, UX, domain behavior, new significant dependencies,
material architecture changes, production exposure, secrets, deployment
changes, and Git/GitHub workflow outside the approved model.

**Alternatives considered**:

- Let child executors resolve all conflicts locally. Rejected because sidecar
  children are implementation executors, not product or architecture decision
  makers.
- Permit the coordinator to create or mutate GitHub issues/comments to unblock
  work. Rejected because issue mutation and public comments require explicit
  user approval in a workflow that permits that operation.

## Decision: Validate with local samples and text checks only

**Rationale**: The feature changes repository workflow text, architecture
documentation, and local Spec Kit artifacts. No backend, frontend, persistence,
authorization, API, browser, or runtime behavior changes are in scope, so app
test suites would not prove the changed behavior. Local sample reports,
targeted text checks, manual issue review, changed-file review, and
`git diff --check` directly verify the requested contract.

**Alternatives considered**:

- Run full backend/frontend test suites. Rejected as disproportionate for a
  documentation/workflow-only change with no runtime surfaces.
- Open real pull requests or mutate GitHub issues for validation. Rejected
  because #231 keeps GitHub issue mutation and public comments behind explicit
  user approval.
