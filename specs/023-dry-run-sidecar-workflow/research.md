# Research

## Decision: Use Local Controlled Fixtures for the Valid Parallel Scenario

**Rationale**: A read-only GitHub search found no existing low-risk controlled
coordinator issue outside the #220-#234 sidecar epic set. Issues #220 through
#234 are explicitly barred from parallel routing while the sidecar workflow is
being designed, validated, and adopted. Creating or modifying GitHub issues
would be a GitHub mutation and requires explicit user approval. Local fixture
issue numbers let the dry-run record routing, artifact, branch, PR, validation,
and blocker evidence without violating the repository's operation rules.

**Alternatives considered**:

- Use issue #220 as the valid coordinator `parallel` scenario. Rejected because
  #220 through #234 must not route through parallel mode.
- Create new GitHub dry-run issues. Rejected because issue creation is a
  GitHub mutation and no explicit approval was provided.
- Skip the valid coordinator `parallel` scenario. Rejected because issue #234
  requires that outcome to be recorded; the local fixture records it as a
  controlled dry-run substitute.

## Decision: Keep Dry-run Evidence in Feature-local Markdown Artifacts

**Rationale**: The existing sidecar workflow is instruction-driven and prior
sidecar child issues validate behavior with local Markdown samples and text
review. Feature-local artifacts keep the dry-run separate from CatWorld product
implementation and avoid adding scripts, dependencies, or external services.

**Alternatives considered**:

- Add an automated dry-run runner. Rejected as beyond #234 scope and likely to
  introduce a new operational workflow decision.
- Record evidence only in the final chat response. Rejected because #234 asks
  for artifact paths, branch names, validation results, blockers, and
  corrections to be recorded for user review.

## Decision: Treat Workflow-source Edits as Conditional Corrections Only

**Rationale**: Issue #234 validates the sidecar workflow before adoption and
explicitly excludes changing normal implementation skill internals. The dry-run
should not churn workflow source files unless evidence proves a concrete
adoption gap that is safe and in scope to correct.

**Alternatives considered**:

- Proactively revise the sidecar skills before the dry-run. Rejected because it
  could obscure whether the current workflow already satisfies the adoption
  gate.
- Block immediately because a live coordinator issue is unavailable. Rejected
  because the specification permits documented equivalent evidence where real
  external operations would violate approval requirements.
