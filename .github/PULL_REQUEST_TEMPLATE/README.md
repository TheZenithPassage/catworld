# Pull Request Templates

CatWorld keeps normal one-issue/one-PR pull request descriptions unchanged.

Use `sidecar-child-to-coordinator.md` only for a sidecar child branch pull
request into a coordinator branch. Child PR descriptions reference both issues
with `Related to` lines and do not close issues by default.

Use `sidecar-final-coordinator-to-main.md` only for the final sidecar
coordinator branch pull request into `main`. That final PR may close the
coordinator issue and the child issues included in the sidecar delivery.

A coordinator with all child issues already closed that enters the existing
sequential final-pass workflow uses normal sequential PR wording for any
remaining final pass, not the sidecar final coordinator template.

These templates do not activate parallel mode, replace the normal sequential
workflow, or require opening real PRs during validation.
