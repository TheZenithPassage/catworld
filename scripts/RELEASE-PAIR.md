# Release pair interface

The `release-pair.yml` job is entered only for a published GitHub Release. It
resolves the release tag to a full commit, checks out that commit, and validates
both application images on a native `ubuntu-24.04-arm` runner. Normal CI does not
publish images. The release's `prerelease` value is recorded without promoting a
floating tag or triggering deployment.

Before publication, the job has two local images named
`ghcr.io/<owner>/<repository>-backend:run-<run-id>-<attempt>` and
`ghcr.io/<owner>/<repository>-frontend:run-<run-id>-<attempt>`. Both carry OCI
source, revision and version labels from the same tag commit. A dependent
whole-stack check can use these exact local tags after the build step and before
the publication step; it must fail the job on error. The `SOURCE_SHA`,
`BACKEND_IMAGE`, `FRONTEND_IMAGE`, `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`
environment variables and the `source_sha` step output supply its inputs.

After both pushes and unauthenticated pulls succeed, the job uploads exactly
one `catworld-delivery.json` release asset. It contains `schema`, `repository`,
`release_id`, `tag`, `prerelease`, `source_sha`, `backend`, `frontend`,
`workflow_run` and `workflow_attempt`. Image fields are immutable
`ghcr.io/...@sha256:...` references. This asset is the selected pair. A retry
uses fresh run/attempt tags and refuses to replace an existing selected asset.
Partial uploads may remain after interruption, but they have no delivery record.
The workflow does not change package visibility; both packages must already
allow anonymous pull before selection can succeed.


## One-time first public GHCR package setup

The public CatWorld repository does **not** automatically make its GHCR packages
public. Publication of a Release may push two new packages that initially
remain private. The first workflow run can then intentionally stop at the
anonymous-pull guard without producing catworld-delivery.json.

After the first authorized push, the repository owner must explicitly open the
package settings for **both** catworld-backend and catworld-frontend under the
GitHub account Packages area, select public visibility and confirm the
consequence. Public GHCR visibility is an exposure decision and is not silently
changed by CI. Confirm that the repository still belongs to the intended public
distribution posture before doing so.

Then rerun the **same release's** failed GitHub Actions workflow/job; do not
create a new tag, publish an unrelated Release or bypass the recorded source
identity. The retry uses its own unique run/attempt image tags and publishes a
delivery record only after independently authenticated-free pulls by digest of
**both** packages succeed. A failed or partial push is not a selected release.
Once published, use the delivery record's exact source SHA and digest pair;
never deploy image tags or replace an existing record.
