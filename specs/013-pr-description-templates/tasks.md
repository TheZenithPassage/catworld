# Tasks: PR Description Templates for Sidecar Coordinator Delivery

**Input**: Design documents from `specs/013-pr-description-templates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pr-template-contract.md, quickstart.md

**Tests**: Required evidence is local PR-description sample review, text checks for issue-closing keywords, and manual review against issues #220-#224. Backend and frontend runtime tests are not required because this feature changes repository workflow templates only.

**Organization**: Tasks are grouped by the single verifiable technical outcome TO-001.

## Phase 1: Technical Outcome 1 - Sidecar PR Description Templates (Priority: P1)

**Goal**: Provide sidecar child and final coordinator PR description templates, usage guidance, and local samples that preserve the approved issue-closing contract.

**Verification**: The child template and sample use `Related to` lines and contain no issue-closing keywords; the final coordinator template and sample can close coordinator and child issues; the coordinator final-pass sample follows normal sequential wording.

### Implementation

- [X] T001 [TO1] Add sidecar child PR template in `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`
- [X] T002 [TO1] Add sidecar final coordinator PR template in `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`
- [X] T003 [TO1] Add PR template usage guidance in `.github/PULL_REQUEST_TEMPLATE/README.md`
- [X] T004 [P] [TO1] Add sidecar child sample PR description in `specs/013-pr-description-templates/samples/sidecar-child-pr.md`
- [X] T005 [P] [TO1] Add sidecar final coordinator sample PR description in `specs/013-pr-description-templates/samples/sidecar-final-coordinator-pr.md`
- [X] T006 [P] [TO1] Add closed-child coordinator final-pass sample PR description in `specs/013-pr-description-templates/samples/coordinator-final-pass-pr.md`

### Evidence

- [X] T007 [TO1] Review `.github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md`, `.github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md`, `.github/PULL_REQUEST_TEMPLATE/README.md`, and `specs/013-pr-description-templates/samples/` against `specs/013-pr-description-templates/contracts/pr-template-contract.md`
- [X] T008 [TO1] Run the child-template closing-keyword check from `specs/013-pr-description-templates/quickstart.md`
- [X] T009 [TO1] Run the final-coordinator closing-keyword check from `specs/013-pr-description-templates/quickstart.md`
- [X] T010 [TO1] Run the default-template absence check from `specs/013-pr-description-templates/quickstart.md`
- [X] T011 [TO1] Manually review `.github/PULL_REQUEST_TEMPLATE/` and `specs/013-pr-description-templates/samples/` against issues #220, #221, #222, #223, and #224

**Checkpoint**: TO-001 is fully implemented and objectively verifiable.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T012 Run `git diff --check -- .github/PULL_REQUEST_TEMPLATE specs/013-pr-description-templates` for changed workflow and Spec Kit files
- [X] T013 Review changed files with `git status --short` and `git diff --name-only` against the source map in `specs/013-pr-description-templates/plan.md`
- [X] T014 Rerun affected quickstart validation from `specs/013-pr-description-templates/quickstart.md` after any late wording changes, or report any stale checks explicitly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TO-001)**: No prerequisites beyond the generated Spec Kit artifacts.
- **Final Phase**: Depends on TO-001 implementation and evidence tasks.

### Technical Outcome Dependencies

- **TO-001**: No other technical outcomes.

### Within TO-001

- T001-T003 establish the PR templates and guidance.
- T004-T006 may run in parallel after the relevant template wording is drafted.
- T007-T011 run after the templates, guidance, and samples exist.
- T012-T014 run after implementation and evidence tasks.

### Parallel Opportunities

- T004, T005, and T006 touch different sample files and can run in parallel after the template wording is available.

---

## Parallel Example: TO-001

```text
Task: "Add sidecar child sample PR description in specs/013-pr-description-templates/samples/sidecar-child-pr.md"
Task: "Add sidecar final coordinator sample PR description in specs/013-pr-description-templates/samples/sidecar-final-coordinator-pr.md"
Task: "Add closed-child coordinator final-pass sample PR description in specs/013-pr-description-templates/samples/coordinator-final-pass-pr.md"
```

---

## Implementation Strategy

### First Verifiable Increment

1. Complete T001-T006.
2. Run T007-T011 evidence checks.
3. Complete T012-T014 freshness and scope checks.

### Delivery

After tasks and validation pass, the CatWorld issue workflow handles commit, push, PR creation or update, and checkout restoration.
