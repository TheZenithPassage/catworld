# CatWorld Operations

This runbook covers production on EC2 and the [public demo on Windows](#public-demo-on-windows).
Its commands are instructions for an authorized operator. Record observed
production results in the release, deployment or operations record. The separate
release acceptance task owns actual production checks.

## Production topology and boundaries

CatWorld runs on an ARM64 EC2 host with Docker Compose. The fixed Compose project
is `catworld-prod` in `/opt/catworld`. `compose.prod.yml` runs MySQL 8.0 (`db`),
the Java 25 Spring Boot API (`app`) and the Angular/Nginx `frontend`. MySQL data,
including normalized cat photos, lives in the persistent
`catworld_mysql_data` Docker volume. Neither `db` nor `app` publishes a host
port. The frontend alone binds `127.0.0.1:${FRONTEND_PORT:-4200}`.

A dedicated Cloudflare Tunnel sends `admin.catworld.com.ar` to
`http://127.0.0.1:4200` on the host. Cloudflare Access limits entry to approved
operator identities; CatWorld's own HTTP Basic login and backend `ADMIN`/`STAFF`
rules remain necessary after that gate. Verify the actual Access policy,
unauthorized rejection and authorized login before use. Keep EC2 inbound
application ports closed. `catworld.com.ar` is reserved for the future public
website and is not an alias for the admin application.

The host's `.env.production` contains private database and first-admin
bootstrap values and must remain outside Git with root-only access. The
bootstrap account is created only when the application user table is empty.
Never print the environment file or paste its values into an issue or log.
The production app requires Java native access and libvips 8.18.5 with
HEIF/HEVC and Little CMS support for photo normalization; these dependencies
are built into the backend image, not installed by compiling on EC2.

## Publish and select a release

1. Merge the reviewed product changes, including this documentation, into the
   exact source revision intended for release. In GitHub, create `v1.2.0` at
   that full commit SHA and publish a non-prerelease GitHub Release for the tag.
   A bare tag or draft Release does not trigger image publication. Do not retarget
   the tag after publication.
2. The committed [release workflow](../.github/workflows/release-pair.yml) checks
   out the tag commit on a native `ubuntu-24.04-arm` runner, verifies backend
   and frontend, builds ARM64 images, exercises the image-only stack, and pushes
   backend and frontend packages to GHCR. Both images carry the same source
   revision and version labels. The workflow checks anonymous pulls by digest
   and uploads one `catworld-delivery.json` asset only after the pair is usable.
3. Confirm the GitHub Release tag, full source commit, successful workflow run
   and delivery asset agree. The record's `backend` and `frontend` fields are
   immutable `ghcr.io/...@sha256:...` references; deploy those two exact
   digests together. Do not select a run tag, `latest`, a partial push or images
   from different releases.

The first push may create private GHCR packages. The release workflow does not
change package visibility. The repository owner must explicitly approve public
visibility for **both** packages, verify an unauthenticated pull of each digest,
then retry the **same Release's** failed workflow. A retry uses new run/attempt
image tags but cannot replace an existing delivery asset. Follow the
[release-pair interface](../scripts/RELEASE-PAIR.md) for that one-time decision,
anonymous-pull guard and safe retry; do not bypass the guard or republish a
different tag to work around it.

## Prepare EC2 and deploy without compiling

Use Session Manager and an authorized root shell for the root-owned
`/opt/catworld` files. Establish the current host identity and free memory/disk,
Docker/Compose service health, private configuration mode, Cloudflare Tunnel
and Access settings before mutation. The [production template](../.env.production.example)
lists the required keys. Provision unique database and bootstrap credentials,
`BUSINESS_TIME_ZONE=America/Argentina/Buenos_Aires`, the frontend loopback port,
and `CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=https://admin.catworld.com.ar` in
`/opt/catworld/.env.production`. Compose supplies the same IANA business zone to
both application services. Use the host's existing private file when
updating; never replace it with the public template. Populate `BACKEND_IMAGE`
and `FRONTEND_IMAGE` with the verified record's exact digest references for
ordinary later Compose operations.

From the authorized release, download the delivery asset and the production
Compose/template/preflight files from the record's full source SHA. Example for
the selected version (replace the tag only for a separately authorized release):

```bash
set -euo pipefail
cd /opt/catworld
mkdir -p scripts
RELEASE_TAG=v1.2.0
TAG_SHA="$(git ls-remote --exit-code https://github.com/TheZenithPassage/catworld.git \
  "refs/tags/${RELEASE_TAG}" "refs/tags/${RELEASE_TAG}^{}" | \
  awk '$2 ~ /\^\{\}$/ {peeled=$1} $2 !~ /\^\{\}$/ {tag=$1} END {print peeled ? peeled : tag}')"
[[ "$TAG_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release tag commit' >&2; exit 1; }
curl -fL "https://github.com/TheZenithPassage/catworld/releases/download/${RELEASE_TAG}/catworld-delivery.json" -o catworld-delivery.json
SOURCE_SHA="$(python3 -c 'import json; print(json.load(open("catworld-delivery.json"))["source_sha"])')"
[[ "$SOURCE_SHA" == "$TAG_SHA" ]] || { echo 'Release asset and tag disagree' >&2; exit 1; }
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/${SOURCE_SHA}/compose.prod.yml" -o compose.prod.yml
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/${SOURCE_SHA}/scripts/production_pair.py" -o scripts/production_pair.py
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/${SOURCE_SHA}/.env.production.example" -o .env.production.example
```

The tag lookup independently resolves annotated and lightweight tags to their
commit; the asset must agree before its source revision's script is fetched.
Also inspect the published Release in GitHub and confirm its version, commit
and successful workflow before running the preflight. Preserve existing host
files safely if a download or identity check fails. On a new host only, create the private file
from the template, edit its placeholders and restrict it:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

The first command below validates only the record's schema, repository, tag,
source and digest references; it does **not** inspect Docker or prove the host
is ready. The `--deploy` command additionally checks Compose isolation and
persistence, pulls both ARM64 digests, verifies architecture, repository digest
and OCI source/version labels, then starts the fixed project with
`up --no-build --pull never -d --wait`. A failure before startup must leave the
running services untouched; no step builds application images on EC2.

```bash
python3 scripts/production_pair.py --delivery catworld-delivery.json \
  --tag "$RELEASE_TAG" --source "$SOURCE_SHA"
python3 scripts/production_pair.py --delivery catworld-delivery.json \
  --tag "$RELEASE_TAG" --source "$SOURCE_SHA" --deploy
```

The preflight downloads `mysql:8.0` only if absent and does not implicitly
upgrade an existing MySQL image. A database image upgrade needs separate
compatibility and recoverability checks. Never add `--build`, select floating
application tags, expose ports 8080/3306, or deploy a pair that failed the
source/digest checks.

After startup, inspect the exact selected services and immutable image digests,
the MySQL volume, local frontend response, authenticated API, cat photo
normalization and the Access-protected external route. Check memory, disk and
container health on the small EC2 host. Record which checks actually passed;
an image smoke in CI is not an EC2 or Cloudflare acceptance result.

```bash
cd /opt/catworld
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml ps
curl -fsSI http://127.0.0.1:4200/
```

For an authorized stop, use the same project and private environment file:

```bash
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml down
```

`down` without `-v` preserves MySQL data. Restart or roll back an older
application pair only after checking its compatibility with the **current**
Flyway schema and data; changing image digests does not downgrade MySQL.

## Backup and off-host retention

The database includes operational records **and** JPEG photo binaries. Use
`mysqldump --hex-blob` so the binary content survives a text dump. Produce
backups in a root-only directory, restrict each dump, verify it is nonempty,
and retain a separately protected recoverable copy beyond the EC2 root disk.
An on-instance `backups/` directory alone is not disaster recovery. Establish
and verify the off-host transfer, access controls, retention and recovery
credentials before depending on backups for real data; a later PC-copy setup
must be tested before it counts as external retention.

The following procedure runs from `/opt/catworld` with the selected Compose
project and a healthy `db` service. It does not stop the application:

```bash
cd /opt/catworld
install -d -m 700 backups
umask 077
timestamp="$(date -u +'%Y%m%d_%H%M%S')"
dump="backups/catworld_${timestamp}.sql"
if docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml \
    exec -T db sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --hex-blob --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' > "${dump}.partial"; then
  mv "${dump}.partial" "$dump"
else
  rm -f "${dump}.partial"
  echo 'Database dump failed' >&2
  exit 1
fi
chmod 600 "$dump"
test -s "$dump"
sha256sum "$dump"
```

Record the dump name, SHA-256, source release/schema, size, UTC time and the
location and verification of its separately retained copy without storing
secrets or real data in the repository. Preserve the matching image pair and
private recovery materials. Rehearse restoration in an isolated disposable
Compose project with a distinct volume and loopback port before treating the
backup process as recoverable.

## Restore and verify

**Destructive production operation:** obtain an explicit restore decision and
verify the chosen dump, off-host copy and compatible image/schema pair first.
Do not erase a volume because an application container failed to start.
For rehearsal, substitute a disposable project name and environment with a
different frontend loopback port; use a copy of the dump and never point the
rehearsal at `catworld-prod` or its volume.

Only when replacing the selected project's dataset is explicitly authorized,
stop that project and remove its database volume, then start a clean MySQL
service. The commands below illustrate the destructive production path; do not
run them as part of documentation validation:

```bash
cd /opt/catworld
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml down -v
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml up -d --wait db
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml \
  exec -T db sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < backups/catworld_YYYYMMDD_HHMMSS.sql
```

Run `production_pair.py --deploy` again with the selected compatible release
record, tag and source SHA; never build on EC2. Verify representative owner,
cat, vet, stay and payment records, authentication and frontend/API health.
For a cat with a photo, retrieve the authenticated
`GET /api/cats/{id}/photo` JPEG before backup and after restore, then compare
their SHA-256 digests with `sha256sum`; record a mismatch as a failed restore.
The cat-photo resource's digest ETag is another check, not a substitute for
reading the restored bytes. Do not claim a successful restore from a completed
SQL import alone.

The creator-attribution checks once needed for migration #146 were a
historical rollout decision, not a standing pre-deployment command. For every
deployment, let Flyway apply the committed migrations and investigate any
schema/data incompatibility against the actual source and backup before
continuing; never invent creator attribution or bypass a failed migration.

## Public demo on Windows

The demo uses Docker Desktop's Linux engine and the fixed `catworld-demo`
project in [`compose.demo.yml`](../compose.demo.yml). It uses its own
`catworld_demo` schema, `catworld-demo_mysql_data` volume, and generated service
credentials. Only the frontend publishes a host port at `127.0.0.1:4210`.
MySQL and the API are on internal networks. The optional tunnel shares the
frontend's ingress network. Use only synthetic data in this shared workspace.

Use PowerShell from a stable checkout of this repository with Git, Docker Desktop,
and Python 3.12 or later. The examples use uv to select Python. A standard
installation can use `python` in place of `uv run --python 3.12 python`.

### Select and run a revision

Choose a full commit SHA on `origin/main` whose checks passed. Build while the
existing demo is running if needed. The build reads that exact commit from Git
and uses the project's two Dockerfiles to produce local images with the same SHA.

```powershell
git fetch origin
$revision = '<full validated commit SHA on origin/main>'
uv run --python 3.12 python scripts/demo/manage.py build $revision
uv run --python 3.12 python scripts/demo/manage.py start $revision --local-only
uv run --python 3.12 python scripts/demo/manage.py status
```

Open `http://127.0.0.1:4210` and enter the demo. `start` verifies both image
revision labels, replaces the workspace with current-date fixtures and checks
the seeded API before making it available to the optional tunnel. It generates
credentials on first use and keeps local state under `%LOCALAPPDATA%\CatWorldDemo`.
Keep that directory private and retain `demo.env` for the lifetime of the demo volume.

### Publish when the demo is ready

For the one-time Cloudflare setup, create a dedicated remotely managed tunnel
for the Windows demo. Add a published application route for
`test.catworld.com.ar` with service type **HTTP** and service URL `frontend:80`.
Use the token for this tunnel only. Keep public access enabled for this hostname
and bypass CDN caching for `/api/*`. The production admin tunnel and its Access
policy are configured independently. Follow the [Cloudflare Tunnel setup](https://developers.cloudflare.com/tunnel/get-started/)
for the dashboard steps.

```powershell
uv run --python 3.12 python scripts/demo/manage.py token
uv run --python 3.12 python scripts/demo/manage.py start $revision
```

Paste the token at the hidden prompt. Check that Cloudflare reports the
connector healthy and open `https://test.catworld.com.ar` to verify the demo
entry screen and synthetic records through the public route. If the tunnel
fails to start after seeding succeeds, the local demo stays available. Fix the
tunnel and retry with `uv run --python 3.12 python scripts/demo/manage.py publish`
to keep the current workspace.

### Reset, update, roll back or stop

Install the hourly reset task once as the Windows user who runs Docker Desktop.
The interactive task runs at the top of the hour while that user is signed in.
It leaves stopped services stopped and skips reset if the API recorded a
successful mutation since the start of the previous hour. It checks again
after closing ingress and gracefully stopping the API so a change committed
during shutdown preserves the workspace. A write with an uncertain outcome
also defers the automatic reset until an operator resets the demo. The task
uses the absolute checkout and Python paths. Reinstall it if either moves.
Task Scheduler displays the latest result and the command writes
`%LOCALAPPDATA%\CatWorldDemo\hourly-reset.log`.

```powershell
uv run --python 3.12 python scripts/demo/manage.py install-hourly
uv run --python 3.12 python scripts/demo/manage.py reset
uv run --python 3.12 python scripts/demo/manage.py stop
```

`reset` explicitly replaces the running workspace even after recent activity.
For an update, build a newly validated SHA and run `start` with that SHA. For
a rollback, run `start` with the previous validated SHA and its retained image
pair. Add `--local-only` to keep the public tunnel stopped. Both operations
reseed a fresh workspace for the selected revision and keep the demo volume.

Before replacing an existing workspace, the command saves a demo-only SQL
snapshot in `%LOCALAPPDATA%\CatWorldDemo\recovery.sql`. On a replacement failure
it attempts to restore the snapshot and check the previous running revision
before reopening its tunnel. If restoration fails or replacement is interrupted,
`status` reports the pending recovery and new replacements preserve the backup.
Fix the underlying failure, then run `uv run --python 3.12 python scripts/demo/manage.py recover`.
This restores the previous revision and starts it locally. Run `publish` to open
the tunnel when it is ready. Keep `recovery.sql` and `recovery-revision` together
until recovery completes.

`stop` closes the demo tunnel and services and keeps the volume. The public
demo is unavailable while the PC or Docker Desktop is off, and is started again
explicitly.
