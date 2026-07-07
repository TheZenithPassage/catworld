# Feature Specification: Sidecar Coordinator Parallel Entrypoint

**Feature Branch**: `015-sidecar-coordinator-parallel-entrypoint`

**Created**: 2026-07-07

**Input**: User description: "Create the independent coordinator entrypoint for opt-in parallel execution. Parent epic: #220. Depends on #221, #222 and #225."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: A separate sidecar coordinator parallel entrypoint exists for explicit coordinator `parallel` prompts when repository routing guardrails allow sidecar use, without changing the current sequential implementation workflow or the existing coordinator/orchestration workflow.
  - **Why this priority**: #220 requires the sidecar workflow to be added beside, not inside or over, the current one-issue/one-PR sequential workflow.
  - **Acceptance Scenarios**:
    1. **Given** a clearly identified coordinator issue, an explicit `parallel` request, and repository routing guardrails that allow sidecar use, **When** the sidecar coordinator entrypoint is selected, **Then** the entrypoint performs coordinator preflight before any child implementation, branch, or worktree work.
    2. **Given** a normal issue or direct child issue and an explicit `parallel` request, **When** routing is evaluated, **Then** the entrypoint stops with a routing error that parallel mode only applies to coordinator issues.
    3. **Given** a direct coordinator end-to-end request with all listed child issues closed, **When** routing is evaluated, **Then** the request continues through the existing sequential end-to-end workflow and not through sidecar parallel execution.
  - **Validation Evidence**: Local routing examples covering the valid and invalid cases from #220, #221, and #222, plus manual review that the existing sequential and coordinator/orchestration workflow files are unchanged.

- **TO-002**: Parallel readiness is determined only by preflight evidence: coordinator issue inspection, listed child issue inspection, dependency classification, and relevant source-of-truth review.
  - **Why this priority**: #220, #222, and #226 explicitly reject a required or invented `parallel-ready` label.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator issue without a `parallel-ready` label, **When** the sidecar coordinator entrypoint evaluates readiness, **Then** it does not fail solely because that label is absent.
    2. **Given** incomplete coordinator context, missing child issue context, unresolved dependencies, or insufficient source-of-truth evidence, **When** preflight runs, **Then** the entrypoint stops before implementation and reports the blocker.
  - **Validation Evidence**: Manual review that no required `parallel-ready` label is introduced and local routing examples demonstrate preflight-based readiness.

- **TO-003**: Sidecar artifact path rules from #225 are acknowledged by the coordinator entrypoint without generating child artifacts in this issue.
  - **Why this priority**: #226 depends on #225 but keeps child artifact generation out of scope.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator selected for sidecar preflight, **When** the entrypoint describes or checks future sidecar artifact locations, **Then** coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/` and child implementation artifacts use `specs/<child-issue-number>-<child-slug>/`.
    2. **Given** this issue's implementation, **When** changed files are reviewed, **Then** no child implementation artifacts, sidecar worktrees, or sidecar branches are created as part of #226.
  - **Validation Evidence**: Local path examples and changed-file review.

### Edge Cases

- A prompt contains `parallel` for a non-coordinator issue: stop with a routing error instead of ignoring the flag or falling back silently.
- A prompt contains `parallel` for issues #220 through #234 while the sidecar workflow is being designed, validated, and adopted: use the current sequential workflow guardrails instead of sidecar parallel mode.
- A coordinator issue is requested end-to-end while any listed child issue is still open: stop under the #220-#222 routing contract; do not enter sidecar parallel execution unless the user explicitly requested `parallel`.
- A coordinator issue is requested end-to-end after all listed child issues are closed: use the existing sequential end-to-end workflow as the final pass and do not redo closed child scope.
- Coordinator or child issue context cannot be fetched or classified: stop before implementation and report the missing context.
- Child dependencies are hard-dependent or conflict-prone: stop or report that the coordinator is not ready for parallel execution rather than parallelizing blindly.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The implementation MUST add a new sidecar coordinator parallel workflow entrypoint that is separate from `.agents/skills/catworld-implement-issue/SKILL.md` and `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md`.
- **TR-002**: The sidecar coordinator entrypoint MUST activate only for explicit `parallel` requests on clearly identified coordinator issues when repository routing guardrails allow sidecar use.
- **TR-003**: The sidecar coordinator entrypoint MUST stop on `parallel` requests for non-coordinator issues.
- **TR-004**: The sidecar coordinator entrypoint MUST apply the direct coordinator routing contract from #220, #221, and #222 exactly, including open-child stops and closed-child sequential final-pass routing.
- **TR-005**: The sidecar coordinator entrypoint MUST determine parallel readiness through preflight, child issue inspection, dependency classification, and relevant source-of-truth review.
- **TR-006**: The sidecar coordinator entrypoint MUST NOT require, invent, or route based on a required `parallel-ready` label.
- **TR-007**: The sidecar coordinator entrypoint MUST stop before implementation when coordinator context, listed child issue context, dependency classification, or required source-of-truth context is incomplete.
- **TR-008**: The implementation MUST preserve the existing normal sequential implementation workflow and the existing coordinator/orchestration workflow unchanged for this issue.
- **TR-009**: The implementation MUST NOT generate child artifacts, perform Git branch or worktree operations, open pull requests, mutate GitHub issues, or change CatWorld product code as part of the new entrypoint.
- **TR-010**: Validation MUST include local routing examples covering #220-#222, manual review that existing workflows are unchanged, and confirmation that readiness is preflight-based rather than label-based.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld repository workflow infrastructure.
- **SB-002**: Feature MUST distinguish implemented sidecar entrypoint behavior from future child artifact generation, child implementation, Git execution, PR handling, cleanup, and adoption dry-run behavior.
- **SB-003**: Feature MUST NOT introduce product behavior, persistence behavior, authorization behavior, UI behavior, or operational deployment behavior changes.

### Out of Scope

- Child artifact generation.
- Git branch or worktree operations for sidecar execution.
- Pull request creation or update behavior for sidecar execution.
- Child implementation execution.
- Product code changes.
- Changes to the existing normal sequential implementation workflow.
- Changes to the existing coordinator/orchestration workflow.
- A separate sequential workflow for coordinator finalization.
- A required `parallel-ready` label.

### Open Questions

- None.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Local routing examples show that explicit coordinator `parallel` prompts enter sidecar preflight only when repository routing guardrails allow sidecar use, while non-coordinator `parallel` prompts stop with a routing error.
- **SC-002**: Local routing examples show that direct coordinator end-to-end prompts with open child issues stop and direct coordinator end-to-end prompts with all child issues closed route to the existing sequential end-to-end workflow.
- **SC-003**: Changed-file review confirms `.agents/skills/catworld-implement-issue/SKILL.md` and `.agents/skills/catworld-orchestrate-coordinator-issue/SKILL.md` are not changed by #226.
- **SC-004**: Manual review confirms no required or invented `parallel-ready` label appears in the sidecar coordinator entrypoint.
- **SC-005**: Changed-file review confirms #226 creates no child artifacts, sidecar worktrees, sidecar branches, pull requests, GitHub issue mutations, or CatWorld product code changes.

## Assumptions

- The new sidecar coordinator entrypoint may be expressed as a repo-local Codex skill because #220 recommends sidecar skills and #226 asks for a workflow entrypoint, while #226 does not approve changes to existing workflow internals.
- Future child implementation, Git orchestration, PR handling, cleanup, and adoption dry-run behavior will be handled by later child issues from #227 through #234.
