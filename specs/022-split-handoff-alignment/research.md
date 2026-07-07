# Research: Split Handoff Alignment

## Decision: Update the existing explicit task-to-issues skill

**Rationale**: `.agents/skills/speckit-taskstoissues/SKILL.md` is the repository's explicit task-to-GitHub-issues instruction surface. Issue #233 asks to update only explicit issue-split handoff instructions, so this is the narrowest target that avoids normal planning, normal implementation, and `.agents/skills/catworld-implement-issue/SKILL.md`.

**Alternatives considered**:

- Update `catworld-implement-issue`: rejected because #233 explicitly forbids changing it.
- Update only `docs/ARCHITECTURE.md`: rejected because the issue asks to change the split handoff instructions, not general routing documentation.
- Add a new script or automation: rejected because issue #233 is an instruction alignment task and does not approve new GitHub mutation automation.

## Decision: Use the #223 issue body sections as the split output contract

**Rationale**: Issue #233 requires rewritten coordinator issues to include goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope. These are the exact coordinator template sections already recorded in `specs/012-coordinator-child-templates/contracts/issue-template-contract.md`.

**Alternatives considered**:

- Invent a new split-specific coordinator format: rejected because it would diverge from #223.
- Reuse raw task list formatting only: rejected because it would omit coordinator execution model and routing details required by #220-#222.

## Decision: Validate with local sample output only

**Rationale**: Issue #233 requires a local sample split rewrite without creating real product issues. A local sample under the active feature directory proves the generated handoff shape without mutating GitHub issues.

**Alternatives considered**:

- Create real GitHub product issues: rejected as out of scope for #233 validation.
- Run backend/frontend application tests: rejected as disproportionate because this feature changes workflow instructions and local artifacts only.
