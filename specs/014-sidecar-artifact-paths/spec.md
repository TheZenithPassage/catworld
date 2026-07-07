# Feature Specification: Sidecar Artifact Paths

**Feature Branch**: `chore/225-define-sidecar-artifact-paths`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #225: Define stable artifact paths for the sidecar coordinator parallel workflow only. Parent epic: #220. Depends on #221 and #222."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: Repository workflow documentation defines sidecar-only Spec Kit artifact path conventions that map coordinator and child artifacts directly to GitHub issue numbers.
  - **Why this priority**: Issue #225 prepares future sidecar coordinator parallel execution without changing normal sequential Spec Kit behavior.
  - **Acceptance Scenarios**:
    1. **Given** a sidecar coordinator issue, **When** its artifact path is determined, **Then** the documented path shape is `specs/<coordinator-number>-coordinator-<slug>/`.
    2. **Given** sidecar child implementation issues, **When** their artifact paths are determined, **Then** each documented path shape is `specs/<child-issue-number>-<child-slug>/`.
    3. **Given** the normal sequential implementation workflow or a closed-child coordinator final pass, **When** the artifact path guidance is reviewed, **Then** it states that sidecar artifact naming does not change that workflow.
  - **Validation Evidence**: Manual review of changed workflow documentation against issues #220, #221, #222, and #225, plus a local simulation of one coordinator and three child artifact paths.

- **TO-002**: Repository workflow documentation defines sidecar artifact collision detection and stop rules before any future sidecar workflow creates artifacts.
  - **Why this priority**: Parallel child artifacts must not overwrite each other, existing sidecar artifacts, or normal sequential artifacts.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator and three distinct child issues, **When** the documented path simulation is reviewed, **Then** all four paths are distinct and include the relevant GitHub issue number.
    2. **Given** a repeated sidecar artifact preparation run where a target path already exists, **When** the stop rules are reviewed, **Then** the guidance requires the sidecar workflow to stop and report the collision instead of overwriting, merging, or silently reusing the path.
    3. **Given** duplicate child issue numbers in a coordinator child list, **When** sidecar artifact preparation is reviewed, **Then** the guidance requires the sidecar workflow to stop because parallel child artifacts would collide.
  - **Validation Evidence**: Local path simulation and repeated-run collision check against the documented rules.

### Edge Cases

- A coordinator path already exists with the expected issue-numbered sidecar prefix.
- A child path already exists with the expected child issue number, whether from a prior sidecar run or from normal sequential work.
- Two child entries reference the same GitHub issue number.
- Two different child issue titles normalize to the same slug but have different issue numbers.
- A coordinator final pass runs after all child issues are closed through the existing sequential workflow.
- A normal sequential issue implementation creates Spec Kit artifacts using the current Spec Kit directory rules.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: Workflow documentation MUST state that sidecar coordinator artifact paths use `specs/<coordinator-number>-coordinator-<slug>/`.
- **TR-002**: Workflow documentation MUST state that sidecar child implementation artifact paths use `specs/<child-issue-number>-<child-slug>/`.
- **TR-003**: Workflow documentation MUST state that the issue number is the authoritative uniqueness key in each sidecar artifact path and that the slug is descriptive.
- **TR-004**: Workflow documentation MUST define the slug as a stable, lowercase, hyphen-separated title slug after removing issue title prefixes such as `[Workflow]`, `[Epic]`, or conventional type prefixes when present.
- **TR-005**: Workflow documentation MUST state that sidecar artifact path conventions apply only to sidecar coordinator parallel execution.
- **TR-006**: Workflow documentation MUST state that normal sequential Spec Kit behavior remains unchanged unless a later issue explicitly decides to align it.
- **TR-007**: Workflow documentation MUST state that a coordinator final pass after all child issues are closed uses the existing sequential workflow and does not require sidecar artifact naming unless that workflow creates artifacts on its own terms.
- **TR-008**: Workflow documentation MUST require future sidecar artifact preparation to check the coordinator target path and every child target path before creation.
- **TR-009**: Workflow documentation MUST require future sidecar artifact preparation to stop and report a collision if any target path already exists, instead of overwriting, merging, deleting, or silently reusing it.
- **TR-010**: Workflow documentation MUST require future sidecar artifact preparation to stop when duplicate child issue numbers would create colliding child artifacts.
- **TR-011**: Validation MUST simulate one coordinator and three child artifact paths and verify that repeated runs detect existing sidecar paths safely.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld repository workflow documentation and generated feature artifacts.
- **SB-002**: Feature MUST preserve the current sequential implementation workflow as default behavior.
- **SB-003**: Feature MUST NOT generate sidecar artifacts, replace Spec Kit, create sidecar execution skills, or modify existing implementation skill behavior.
- **SB-004**: Feature MUST NOT change CatWorld product behavior, application architecture, persistence, authorization, APIs, frontend behavior, operations, or product documentation.

### Out of Scope

- Generating sidecar coordinator or child artifacts.
- Replacing Spec Kit or changing its normal directory numbering behavior.
- Modifying `.agents/skills/catworld-implement-issue/SKILL.md`.
- Creating sidecar coordinator or child implementation skills.
- Implementing git branch, worktree, issue, pull request, or delivery orchestration logic.
- Changing CatWorld product code or runtime behavior.

### Open Questions

- None. Issues #220, #221, #222, and #225 define the required sidecar-only artifact path documentation behavior for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Documentation maps a sidecar coordinator artifact path directly to `specs/<coordinator-number>-coordinator-<slug>/`.
- **SC-002**: Documentation maps sidecar child artifact paths directly to `specs/<child-issue-number>-<child-slug>/`.
- **SC-003**: Documentation explicitly states that sidecar artifact paths do not change normal sequential Spec Kit behavior.
- **SC-004**: Documentation explicitly states that closed-child coordinator final passes remain in the existing sequential workflow and do not require sidecar artifact naming.
- **SC-005**: A local simulation with one coordinator and three child issues produces four distinct issue-numbered paths.
- **SC-006**: A repeated-run simulation detects existing sidecar paths and reports that the workflow must stop safely.

## Assumptions

- Repository workflow documentation remains the appropriate source of truth for longer sidecar workflow explanation because issue #222 established that `AGENTS.md` should keep only short mandatory routing guardrails.
- Slugs are descriptive rather than authoritative; the GitHub issue number provides artifact uniqueness.
