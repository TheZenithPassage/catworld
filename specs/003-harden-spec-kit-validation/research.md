# Research: Harden Spec Kit Validation Workflow

## Decision: Harden generation and enforcement points instead of adding tools

**Rationale**: Issue #189 asks for stronger workflow coverage while preserving the existing SDD flow and avoiding new runtime tools, dependencies, or validation frameworks. The most direct fix is to update the skill instructions and templates that create or enforce specs, plans, tasks, analysis, convergence, implementation execution, and final reporting.

**Alternatives considered**:

- Add new validation tooling: rejected as outside scope and heavier than necessary.
- Rewrite the Spec Kit workflow: rejected because the issue asks for targeted edits and proportional usability.
- Only update final reporting: rejected because incomplete evidence can enter much earlier during spec, plan, and task generation.

## Decision: Put observable detail in specification generation

**Rationale**: Missing visible-state expectations are easiest to prevent when the spec is generated. The spec should require enough detail for users and reviewers to know what changed, including validation messages, backend errors, empty/loading/disabled states, destructive confirmations, focus/keyboard behavior, route/dialog navigation, i18n-visible text, responsive/mobile behavior, and role-dependent visibility when applicable.

**Alternatives considered**:

- Leave observable detail to tasks only: rejected because tasks cannot reliably infer omitted behavior.
- Force full UI matrices on every feature: rejected as disproportionate for backend-only, documentation-only, or purely technical work.

## Decision: Add semantic-equivalence review to planning

**Rationale**: UI primitive replacement, shared component migration, dialog/overlay/routing/focus replacement, selector replacement, and presentation changes can alter semantics even when product behavior is intended to stay the same. The plan is the right place to record old behavior/source of truth, new component/framework semantics, mismatch risks, mitigation, and proof.

**Alternatives considered**:

- Treat all presentation migrations as low risk: rejected because prior gaps came from frontend-visible behavior.
- Require full architecture assessment for every local component replacement: rejected as too ceremonial.

## Decision: Make tasks and analysis require layer-appropriate evidence

**Rationale**: Tests that assert internal state or service spies can miss user-visible regressions. Future tasks and analysis should require DOM, Angular Material/CDK harness, navigation, focus/keyboard, or manual visible-device checks for frontend-visible behavior, and controller/service/persistence/security/migration evidence for backend or contract-sensitive behavior.

**Alternatives considered**:

- Require tests for every task: rejected because the constitution allows proportional validation.
- Allow generic "add tests" tasks: rejected because generic evidence can still miss the relevant layer.

## Decision: Track validation freshness and scope drift during implementation/convergence

**Rationale**: Manual smokes and validation commands can become stale after later edits, and files outside the plan can introduce hidden scope drift. Implementation and final orchestration should distinguish passed, failed, skipped, timed out, interrupted, partial, stale, and not revalidated checks. Convergence and final reporting should flag changed surfaces outside the plan/source map for review or justification.

**Alternatives considered**:

- Trust final validation summaries: rejected because the issue explicitly calls out stale and partial evidence.
- Use cross-branch comparison: rejected because repository instructions forbid inferring decisions from other branches and the workflow should only inspect the current branch/worktree.

## Decision: No constitution amendment unless needed after implementation review

**Rationale**: The constitution already requires observable specifications, responsible-layer validation, focused changes, and proportional evidence. Issue #189 can be implemented by making those existing principles concrete in skills/templates.

**Alternatives considered**:

- Amend the constitution immediately: rejected as unnecessary unless the skill/template updates reveal a stable governance rule missing from the constitution.
