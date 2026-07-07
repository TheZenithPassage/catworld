# Quickstart: Sidecar PR Rules Validation

Run these checks after implementing issue #230 and rerun any affected check
after later edits to sidecar workflow or PR template text.

## Prerequisites

- Run commands from the CatWorld repository root.
- Do not open real pull requests.
- Do not mutate GitHub issues, labels, assignees, milestones, issue state, or
  public comments.
- Do not delete remote branches, prune remotes, or perform remote cleanup.

## 1. Review Local Sample PR Descriptions

Expected sample files:

```text
specs/019-sidecar-pr-rules/samples/sidecar-child-pr-231.md
specs/019-sidecar-pr-rules/samples/sidecar-child-pr-232.md
specs/019-sidecar-pr-rules/samples/sidecar-final-coordinator-pr.md
specs/019-sidecar-pr-rules/samples/coordinator-final-pass-pr.md
```

Expected outcome:

- Child samples target the coordinator branch and use `Related to` wording only.
- The child template and child samples do not contain `Closes`, `Fixes`,
  `Resolves`, or equivalent closing keywords.
- The final coordinator sample targets `main` and may close the coordinator
  issue and child issues.
- The closed-child coordinator final-pass sample uses normal sequential wording,
  not the sidecar child/final PR model.

## 2. Required Text Checks

```powershell
Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md,specs/019-sidecar-pr-rules/samples/sidecar-child-pr-231.md,specs/019-sidecar-pr-rules/samples/sidecar-child-pr-232.md -Pattern 'Closes|Fixes|Resolves'
Select-String -Path .agents/skills/catworld-parallel-coordinator/SKILL.md,.agents/skills/catworld-parallel-child-implementation/SKILL.md,docs/ARCHITECTURE.md,.github/PULL_REQUEST_TEMPLATE/README.md -Pattern 'Related to','coordinator branch','target `main`','explicit user approval','public comments','remote cleanup','closed-child coordinator final pass'
Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md -Pattern 'Related to #<child-issue>','Related to #<coordinator-issue>','Target coordinator branch'
Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md -Pattern 'Closes #<coordinator-issue>','Target branch: `main`','user performs merges'
git diff --name-only -- .agents/skills/catworld-implement-issue/SKILL.md
git diff --check
```

Expected outcome:

- The first command prints no matches.
- Required sidecar workflow text is present in the sidecar skills, architecture
  docs, and PR template guidance.
- The child template contains `Related to` references and coordinator branch
  target guidance.
- The final coordinator template contains closure-capable wording, `main`
  target guidance, and user-merge responsibility.
- `.agents/skills/catworld-implement-issue/SKILL.md` has no diff.
- `git diff --check` reports no whitespace errors.

## 3. Manual Review Checklist

- Verify child PR examples target the coordinator branch and cannot close issues
  prematurely.
- Verify the final coordinator PR example targets `main` and is the only sidecar
  PR example that may close the coordinator set.
- Verify no workflow text permits Codex to modify GitHub issue bodies,
  checklists, labels, assignees, milestones, issue state, or public comments
  without explicit user approval.
- Verify no workflow text permits remote branch deletion, remote pruning, or
  remote cleanup without explicit user approval.
- Verify normal sequential PR behavior is unchanged.
- Verify closed-child coordinator final passes remain outside sidecar PR
  routing and use normal sequential behavior.
- Review the implementation against issues #224, #229, and #220.
