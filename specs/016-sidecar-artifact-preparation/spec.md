# Feature Specification: Sidecar Artifact Preparation

**Feature Branch**: `chore/227-add-coordinator-child-artifact-preparation`

**Created**: 2026-07-07

**Input**: User description: "GitHub issue #227: Teach the sidecar coordinator skill to prepare the coordinator artifact and child implementation artifacts before delegation. Parent epic: #220. Depends on #225 and #226."

## User Scenarios, Technical Outcomes & Testing *(mandatory)*

### Verifiable Technical Outcomes *(use instead of user stories for technical/enabling work)*

- **TO-001**: The sidecar coordinator skill prepares a coordinator orchestration artifact before any delegation or child implementation work.
  - **Why this priority**: Issue #227 requires coordinator planning evidence before the future sidecar workflow can safely split work across child issues.
  - **Acceptance Scenarios**:
    1. **Given** a clearly identified coordinator issue with listed child issues, dependency information, source-of-truth context, and an explicit sidecar preparation path, **When** the sidecar coordinator artifact preparation step runs, **Then** it produces or requires a coordinator orchestration artifact containing the child issue map, dependency layers, shared contract section, validation plan, and status table.
    2. **Given** the coordinator artifact cannot be prepared safely because child issue context, dependencies, source-of-truth context, or shared contracts are incomplete, **When** the sidecar coordinator evaluates readiness, **Then** it stops before delegation and reports the blocker for user guidance.
  - **Validation Evidence**: Simulated coordinator with at least three child issues, artifact path review against #225, and manual review that blocker behavior stops before delegation.

- **TO-002**: The sidecar coordinator skill prepares or describes issue-numbered `spec.md`, `plan.md`, and `tasks.md` artifacts for each child issue before delegation.
  - **Why this priority**: Future child implementers must receive scoped artifacts derived from the coordinator, child issue bodies, and shared contracts instead of inventing scope independently.
  - **Acceptance Scenarios**:
    1. **Given** a coordinator with three child issues, **When** artifact preparation determines child artifact locations, **Then** each child issue maps to `specs/<child-issue-number>-<child-slug>/` and contains or receives prepared `spec.md`, `plan.md`, and `tasks.md` guidance.
    2. **Given** a child issue whose planned artifacts conflict with the coordinator, the child issue body, source-of-truth documentation, or shared contract, **When** preparation validates the artifacts, **Then** the workflow stops before delegation and reports the conflict.
  - **Validation Evidence**: Local simulation of one coordinator and at least three child artifact sets, artifact path checks against #225, and manual validation of conflict-stop language.

- **TO-003**: The sidecar artifact-preparation path preserves approved workflow boundaries.
  - **Why this priority**: Issue #227 depends on the separate sidecar skill from #226 and explicitly requires the normal sequential Spec Kit flow and closed-child coordinator final pass to remain unchanged.
  - **Acceptance Scenarios**:
    1. **Given** normal sequential issue implementation or a closed-child coordinator final pass, **When** workflow routing is evaluated, **Then** this sidecar artifact-preparation path is not used.
    2. **Given** missing shared-contract decisions or a perceived need for a seed, foundation, or shared-contract child issue, **When** the sidecar coordinator prepares artifacts, **Then** it stops for user guidance instead of inventing or creating an unapproved child issue.
  - **Validation Evidence**: Changed-file review confirming `catworld-implement-issue` is untouched, local blocker simulation for missing shared contracts, and manual review that no seed/foundation issue creation is introduced.

### Edge Cases

- A coordinator issue has fewer than three child issues: the workflow still applies the same artifact-preparation rules, but #227 validation must simulate at least three child issues.
- A child issue is missing a body, title, dependency information, or source-of-truth references needed to derive safe artifacts: stop before delegation and report the missing context.
- A shared contract affects multiple child issues but is not specified by the coordinator, child issues, or source-of-truth documentation: stop for user guidance instead of creating a seed, foundation, or shared-contract child issue.
- A child artifact path from #225 already exists or collides with another target path: stop before writing or reusing artifacts unless a later approved workflow explicitly defines reuse behavior.
- A child issue is closed and the coordinator is entering the closed-child sequential final pass: this sidecar preparation path is not used and closed child scope must not be redone.
- A normal implementable issue or direct child issue is implemented through the sequential Spec Kit workflow: sidecar coordinator artifact preparation does not change that flow.
- Required source-of-truth documentation conflicts with a coordinator or child issue body: stop before delegation and report the conflict.

## Requirements *(mandatory)*

### Technical Requirements *(include for technical, architectural, migration, security, operational, refactoring, or enabling work)*

- **TR-001**: The sidecar coordinator skill from #226 MUST define an artifact-preparation step before delegation or child implementation work.
- **TR-002**: The artifact-preparation step MUST produce or require a coordinator orchestration artifact with a child issue map, dependency layers, shared contract section, validation plan, and child status table.
- **TR-003**: The artifact-preparation step MUST prepare or describe issue-numbered `spec.md`, `plan.md`, and `tasks.md` artifacts for each child implementation issue.
- **TR-004**: Coordinator artifact paths and child artifact paths MUST follow the #225 naming rules: coordinator artifacts use `specs/<coordinator-number>-coordinator-<slug>/`, and child artifacts use `specs/<child-issue-number>-<child-slug>/`.
- **TR-005**: The artifact-preparation step MUST validate child artifacts against the coordinator issue, child issue bodies, relevant source-of-truth documentation, and the shared contract before delegation.
- **TR-006**: The sidecar coordinator skill MUST stop before delegation when prepared artifacts are missing, artifact paths collide, shared contracts are missing or unsafe, dependencies are unresolved, or scope conflicts remain.
- **TR-007**: The workflow MUST NOT invent or create seed, foundation, or shared-contract child issues unless those issues already exist or the user explicitly approves creating them.
- **TR-008**: The workflow MUST keep the normal sequential Spec Kit flow unchanged.
- **TR-009**: The sidecar artifact-preparation path MUST NOT be used for closed-child coordinator final passes that enter the existing sequential workflow.
- **TR-010**: Validation MUST simulate one coordinator with at least three child issues, verify artifact paths and blocker behavior, verify missing shared contracts stop for user guidance, and confirm `.agents/skills/catworld-implement-issue/SKILL.md` is untouched.

### Scope Boundaries

- **SB-001**: Feature MUST remain within CatWorld repository workflow infrastructure.
- **SB-002**: Feature MUST build on the sidecar coordinator skill introduced by #226 and the sidecar artifact path rules from #225.
- **SB-003**: Feature MUST distinguish artifact preparation from future child implementation, branch/worktree operations, pull request handling, GitHub issue mutation, and adoption dry-run behavior.
- **SB-004**: Feature MUST NOT change CatWorld product behavior, application architecture, persistence, authorization, APIs, frontend behavior, operations, or product documentation.

### Out of Scope

- Child implementation skill creation.
- Branch or worktree operations.
- Pull request creation, update, or mutation rules.
- GitHub issue mutation or child issue creation.
- Product code changes.
- Changes to `.agents/skills/catworld-implement-issue/SKILL.md`.
- Changes to the normal sequential Spec Kit workflow.
- Running this sidecar artifact-preparation path for closed-child coordinator final passes.

### Open Questions

- None. Issue #227, together with issues #225 and #226, defines the required artifact-preparation behavior and boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A local simulation with one coordinator and at least three child issues produces a coordinator artifact shape containing a child issue map, dependency layers, shared contract section, validation plan, and status table.
- **SC-002**: The same simulation maps each child issue to issue-numbered `spec.md`, `plan.md`, and `tasks.md` artifact locations using #225 path rules.
- **SC-003**: Manual review confirms the sidecar coordinator skill stops before delegation for artifact collisions, missing child context, missing shared contracts, unresolved dependencies, or scope conflicts.
- **SC-004**: Manual review confirms the sidecar coordinator skill does not create or invent seed, foundation, or shared-contract child issues.
- **SC-005**: Changed-file review confirms `.agents/skills/catworld-implement-issue/SKILL.md` is untouched and normal sequential Spec Kit behavior is unchanged.
- **SC-006**: Changed-file review confirms no CatWorld product code, branch/worktree automation, PR automation, or GitHub issue mutation behavior is introduced by #227.

## Assumptions

- The sidecar coordinator skill from #226 remains the correct implementation surface for #227 because the issue explicitly says to extend only that skill.
- The #225 artifact path rules are authoritative for sidecar artifact naming and collision expectations.
