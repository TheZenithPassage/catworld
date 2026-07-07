# Research: Sidecar Artifact Paths

## Decision: Document the path contract in `docs/ARCHITECTURE.md`

**Rationale**: Issue #222 established `docs/ARCHITECTURE.md` as the longer source-of-truth explanation for Codex workflow routing while `AGENTS.md` keeps short mandatory guardrails. Issue #225 extends that workflow documentation with sidecar artifact paths and does not request changes to implementation skills.

**Alternatives considered**:

- Update `AGENTS.md`: rejected because #222 keeps longer implementation explanation out of `AGENTS.md`.
- Update `.agents/skills/catworld-implement-issue/SKILL.md`: rejected because #225 explicitly avoids modifying existing implementation skill behavior.
- Create a new sidecar skill now: rejected because sidecar skill creation is out of scope for #225.

## Decision: Use GitHub issue numbers as sidecar artifact uniqueness keys

**Rationale**: Issue #225 requires sidecar artifact paths to map directly to GitHub issue numbers. Prefixing coordinator paths with `<coordinator-number>-coordinator-` and child paths with `<child-issue-number>-` makes each path traceable to its source issue and prevents child slug collisions from becoming path collisions.

**Alternatives considered**:

- Use normal sequential Spec Kit numbering: rejected because #225 defines issue-numbered paths only for sidecar parallel execution and does not change normal sequential behavior.
- Use child list indexes or execution-wave indexes: rejected because those indexes are less stable than GitHub issue numbers and can change when coordinator scope is reordered.
- Use slugs alone: rejected because two child issue titles can normalize to the same slug.

## Decision: Treat existing target paths and duplicate child issue numbers as stop conditions

**Rationale**: Issue #225 requires collision detection and safe repeated-run behavior. Stopping on existing target paths, same-number path prefixes, or duplicate child issue numbers prevents future sidecar execution from overwriting, merging, deleting, or silently reusing artifacts it may not own.

**Alternatives considered**:

- Overwrite existing paths: rejected because it risks losing prior sequential or sidecar planning artifacts.
- Reuse existing paths automatically: rejected because #225 has not defined resume semantics or ownership transfer rules.
- Rename colliding paths automatically: rejected because it would weaken the direct GitHub issue number mapping and hide workflow conflicts.

## Decision: Do not create contracts for this feature

**Rationale**: This feature changes repository workflow documentation only. It introduces no API, command schema, UI contract, persistence schema, browser storage, external system contract, or runtime interface.

**Alternatives considered**:

- Add a contract file for path rules: rejected because the path rules are documentation requirements rather than an external executable interface in this issue.
