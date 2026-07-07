# Research: Sidecar Artifact Preparation

No unresolved researchable unknowns remain.

## Decision: Extend the existing sidecar coordinator skill

**Rationale**: Issue #227 explicitly says to extend only the new sidecar coordinator skill from #226. That skill already owns sidecar preflight, source-of-truth review, dependency classification, prohibited side effects, and #225 artifact path awareness.

**Alternatives considered**:

- Update `.agents/skills/catworld-implement-issue/SKILL.md`: rejected because #227 requires the normal sequential Spec Kit flow to remain unchanged and specifically asks to confirm `catworld-implement-issue` is untouched.
- Create a separate artifact-preparation skill: rejected because #227 says to extend only the sidecar coordinator skill from #226.
- Implement an artifact generator script: rejected because #227 concerns workflow skill preparation rules, while branch/worktree operations and later execution mechanics remain out of scope.

## Decision: Define artifacts as prepared workflow handoff requirements, not product artifacts

**Rationale**: Coordinator orchestration and child `spec.md`/`plan.md`/`tasks.md` artifacts are instructions and planning context for future child implementers. They do not change CatWorld runtime behavior, data, APIs, persistence, authorization, or UI.

**Alternatives considered**:

- Treat coordinator and child artifacts as application contracts: rejected because they are repository workflow artifacts, not runtime interfaces.
- Skip artifact contracts entirely: rejected because #227 requires validation against coordinator, child issue bodies, source-of-truth docs, and shared contracts before delegation.

## Decision: Stop rather than invent shared-contract or foundation child issues

**Rationale**: Issue #227 explicitly prohibits inventing seed, foundation, or shared-contract child issues unless they already exist or the user explicitly approves creating them. The sidecar skill must therefore surface missing shared contracts as blockers before delegation.

**Alternatives considered**:

- Automatically create a shared-contract child issue: rejected because GitHub issue mutation and unapproved child creation are out of scope.
- Fold missing shared-contract work into one child artifact silently: rejected because it would hide a cross-child dependency and risk unsafe delegation.

## Decision: Keep closed-child coordinator final passes outside sidecar artifact preparation

**Rationale**: Issues #220 through #227 distinguish sidecar parallel preparation from the existing sequential final-pass workflow after all child issues are closed. Running sidecar artifact preparation in that final pass could redo closed child scope.

**Alternatives considered**:

- Always prepare sidecar artifacts for coordinator issues: rejected because #227 explicitly says this path is not used when all listed child issues are closed and the coordinator enters the existing sequential workflow.
