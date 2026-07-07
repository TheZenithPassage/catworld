# Quickstart: PR Description Templates for Sidecar Coordinator Delivery

## Prerequisites

- Work from `docs/224-add-pr-templates-sidecar-coordinator-delivery`.
- Do not open real PRs for validation.
- Re-run validation after any PR template, usage guidance, or sample wording change.

## Validation Steps

1. Confirm the sidecar child template exists and uses non-closing issue references:

   ```powershell
   Get-Content -Raw .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md
   ```

   Expected outcome: the template includes `Related to #<child-issue>` and
   `Related to #<coordinator-issue>`.

2. Confirm the sidecar child template and sample do not contain issue-closing keywords:

   ```powershell
   Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-child-to-coordinator.md,specs/013-pr-description-templates/samples/sidecar-child-pr.md -Pattern '(Closes|Fixes|Resolves)\s+#' -CaseSensitive
   ```

   Expected outcome: no matches.

3. Confirm the final coordinator template and sample reserve issue closure for the coordinator PR into `main`:

   ```powershell
   Select-String -Path .github/PULL_REQUEST_TEMPLATE/sidecar-final-coordinator-to-main.md,specs/013-pr-description-templates/samples/sidecar-final-coordinator-pr.md -Pattern 'Closes\s+#' -CaseSensitive
   ```

   Expected outcome: matches for coordinator and child issue closure lines.

4. Confirm normal PR descriptions remain without a default repository PR template:

   ```powershell
   Test-Path .github/pull_request_template.md
   Test-Path .github/PULL_REQUEST_TEMPLATE/pull_request_template.md
   ```

   Expected outcome: both commands print `False`.

5. Confirm closed-child coordinator final-pass wording follows normal sequential wording:

   ```powershell
   Get-Content -Raw specs/013-pr-description-templates/samples/coordinator-final-pass-pr.md
   ```

   Expected outcome: the sample uses normal sequential wording for a remaining
   final pass and does not use the sidecar final coordinator template wording.

6. Manually review `.github/PULL_REQUEST_TEMPLATE/README.md`, both PR templates,
   and all three samples against issues #220, #221, #222, #223, and #224.

   Expected outcome: child PRs cannot close issues by default, final coordinator
   PRs may close issues, normal sequential wording remains unchanged, and
   closed-child coordinator final pass uses normal sequential wording.
