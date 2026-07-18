# Research: Remove Workflow Alternatives

## Research Status

No researchable unknowns remain. Issue #302 defines the intended workflow, exact retained dependency closure, deletion inventory, validation evidence, protected surfaces, and delivery constraints. Repository inspection confirmed that all 50 named deletion targets exist and that the proposed closure can use existing core skills, scripts, and templates.

## Decision 1: Retain the existing single implementation workflow

- **Decision**: Retain `catworld-implement-issue` as the only user-facing CatWorld implementation workflow and retain only the six phases it invokes.
- **Rationale**: This is the issue-approved smallest correct path and preserves normal branch, validation, commit, push, and PR-to-`main` safeguards.
- **Alternatives considered**: Keeping Sidecar/coordinator modes dormant, introducing a replacement orchestrator, or moving routing to another framework. All add unsupported complexity and are explicitly rejected by issue #302.

## Decision 2: Collapse retained template resolution to core templates

- **Decision**: Retained Spec Kit setup resolves `spec-template.md`, `plan-template.md`, and `tasks-template.md` directly from `.specify/templates`; remove hook dispatch, extension templates, preset/override composition, and unused composition code.
- **Rationale**: The approved minimum closure contains only those core templates and deletes extension infrastructure. Leaving resolution branches for absent optional layers would preserve dangling or dormant compatibility behavior.
- **Alternatives considered**: Leave no-op fallback branches, retain empty extension/preset directories, or add a compatibility shim. Each conflicts with the no-dormant-fallback and no-replacement-abstraction boundaries.

## Decision 3: Keep manifests as byte-accurate inventories

- **Decision**: Prune each manifest to issue-approved retained entries and recompute lowercase SHA-256 values from final file bytes.
- **Rationale**: Existence-only pruning can leave stale hashes; issue #302 requires both manifests to match retained files.
- **Alternatives considered**: Remove manifests or retain stale hashes. Manifest removal violates the keep list, while stale hashes fail the retained-file match requirement.

## Decision 4: Classify stale-term hits rather than over-delete

- **Decision**: Review every repository-wide stale-term search hit individually; remove hits from active workflow surfaces while preserving permitted historical wording in retained product source-of-truth specs.
- **Rationale**: Literal broad deletion would wrongly remove `008-creator-attribution` or product specs `196-*`, `197-*`, and `198-*`.
- **Alternatives considered**: Delete by numeric prefix or require zero raw search hits. Both would ignore explicit issue exceptions and risk product-document loss.
