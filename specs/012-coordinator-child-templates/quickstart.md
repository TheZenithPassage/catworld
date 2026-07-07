# Quickstart: Coordinator and Child Issue Templates

## Prerequisites

- Work on branch `docs/223-add-coordinator-child-issue-templates`.
- Review issue #223 and its routing sources #220, #221, and #222.

## Validation

1. Confirm the template files exist:

   ```powershell
   Test-Path .github/ISSUE_TEMPLATE/coordinator-parallel-planning.md
   Test-Path .github/ISSUE_TEMPLATE/focused-child-issue.md
   ```

   Expected result: both commands print `True`.

2. Create local sample bodies by stripping YAML front matter from both templates:

   ```powershell
   $templates = @(
     '.github/ISSUE_TEMPLATE/coordinator-parallel-planning.md',
     '.github/ISSUE_TEMPLATE/focused-child-issue.md'
   )
   foreach ($template in $templates) {
     $content = Get-Content -Raw $template
     if ($content -match '(?s)^---\r?\n.*?\r?\n---\r?\n(.*)$') { $matches[1] } else { $content }
   }
   ```

   Expected result: output includes a coordinator body and a child body without YAML front matter.

3. Manually review the coordinator sample body:

   - It includes goal, preserved scope, child issues, dependencies, execution model, validation, and out of scope.
   - It says the template does not activate parallel mode by itself.
   - It says all-listed-child-issues-closed coordinator finalization uses the existing sequential workflow.
   - It says coordinator finalization must not reimplement closed child issue scope.

4. Manually review the child sample body:

   - It includes parent coordinator, scope, dependencies, validation, and out of scope.
   - It says the template does not activate parallel mode by itself.
   - It says child issues may be implemented directly through the normal sequential workflow one by one.

5. Re-run these checks after any template wording change. If the checks are not rerun after relevant edits, report them as not revalidated rather than passed.
