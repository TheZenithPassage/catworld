# CatWorld Operations

Operations procedures for the current CatWorld deployment.

Cat profile photos are normalized JPEG binary data stored in MySQL. Every
backup must therefore use `mysqldump --hex-blob`; a restore drill must retrieve
a representative photo and compare its SHA-256 digest with the pre-backup
digest. Production runs Java 25 with
`--enable-native-access=ALL-UNNAMED` and libvips 8.18.5 built with HEIF support
and an HEVC decoder. The production native build also requires Little CMS for
profile-aware conversion of embedded ICC color profiles to sRGB.

## Production delivery

The normal production path does **not** compile on EC2. CatWorld uses the
backend/frontend ARM64 images from one published GitHub Release and selects
their immutable GHCR digest references from catworld-delivery.json. The release
workflow runs the real ARM64 application smoke **before** uploading a usable
pair. Publishing packages is separate from starting the application.

The first live release, package visibility change, and production exposure
remain owner-controlled operations. GitHub Release publication triggers the
package workflow; creating a bare Git tag or editing a draft does not.

Only the frontend is externally routed, through a host-managed HTTPS reverse
proxy. Docker binds the frontend to 127.0.0.1 only; the backend and database
remain on the internal Compose network. Do not expose 8080 or 3306.

### Obtain the exact released files

After the reviewed CatWorld version has been committed to main and the selected
GitHub Release publication workflow has succeeded, choose its full 40-character
source commit SHA from the release. On the Linux EC2 host, download the exact
release assets and its production tooling without a source checkout:

```bash
mkdir -p /opt/catworld/scripts
cd /opt/catworld
# Replace SHA with the actual validated release source commit.
SHA=<full-40-character-validated-commit>
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/$SHA/compose.prod.yml" -o compose.prod.yml
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/$SHA/scripts/production_pair.py" -o scripts/production_pair.py
curl -fsSL "https://raw.githubusercontent.com/TheZenithPassage/catworld/$SHA/.env.production.example" -o .env.production.example
curl -fL "https://github.com/TheZenithPassage/catworld/releases/download/v1.2.0/catworld-delivery.json" -o catworld-delivery.json
```

For another release, replace the displayed v1.2.0 asset URL with that exact
authorized release tag. Never use a floating latest image or a mixed pair.

### Configure, check and start

On first setup, copy the environment template to the private host file:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit the **local** .env.production with real unique database credentials,
initial administrator bootstrap credentials, the HTTPS frontend origin for
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS, the intended business time zone, and
the correct loopback frontend port. Do not commit the file or print its secrets.

The two image variables must be copied verbatim from the **verified**
catworld-delivery.json into .env.production as full image@sha256 references.
This allows later backup/stop/restore operations to use the identical selected
pair. The selection preflight independently validates those fields against the
release record and overrides any stale .env image values when starting.

The following validation does not change the host:

```bash
python3 scripts/production_pair.py --delivery catworld-delivery.json \
  --tag v1.2.0 --source "$SHA"
```

To deploy the selected pair after checking the private configuration, invoke
the same command with --deploy:

```bash
python3 scripts/production_pair.py --delivery catworld-delivery.json \
  --tag v1.2.0 --source "$SHA" --deploy
```

This preflight checks record/repository/tag/source/digests, validates Compose
service isolation and loopback ingress, pulls both ARM64 images and confirms
their OCI source/version/architecture metadata **before** Compose can replace
running services. It starts using --no-build and --pull never. A failed step
stops rather than compiling or silently selecting newer images. Check running
services, frontend, authenticated API and native photo processing after startup.

For subsequent operations, use the same Compose project name and selected pair:

```bash
cd /opt/catworld
docker compose --project-name catworld-prod --env-file .env.production \
  -f compose.prod.yml ps
docker compose --project-name catworld-prod --env-file .env.production \
  -f compose.prod.yml down
```

Stopping containers does not delete the MySQL volume. A previous image pair
may be restarted only when its database/schema compatibility is established;
image rollback alone is not a database downgrade.

## Backup

Backups are stored under `backups/` and must not be committed.

Create the backup directory:

```
New-Item -ItemType Directory -Force backups
```

Create a timestamp:

```
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
```

Create the dump inside the database container:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --hex-blob --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE" > /tmp/catworld-backup.sql'
```

Copy it to the local backup directory:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml cp db:/tmp/catworld-backup.sql "backups/catworld_$timestamp.sql"
```

Remove the temporary dump:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/catworld-backup.sql
```

## Restore

**Destructive operation — never run this against live data without a verified,
separately retained backup and an explicit restore decision.** Do not treat a
container/image restart as a reason to delete the database. Prefer a new
disposable Compose project for rehearsal.

Stop the stack and delete the selected project's database volume only when
the explicit restore procedure requires replacing that dataset:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml down -v
```

Start only MySQL:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml up -d db
```

Copy the selected backup into the database container:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml cp backups/catworld_YYYYMMDD_HHMMSS.sql db:/tmp/restore.sql
```

Restore it:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/restore.sql'
```

Remove the temporary restore file:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/restore.sql
```

Start the exact pinned image pair again through production_pair.py --deploy,
using the same release record/tag/source. Never add --build as a fallback.

Confirm the app opens and the restored data is visible:

```
http://localhost:4200
```

## Production Readiness Check

Before using real data:

1. Start the production stack.
2. Create sample owner, cat, vet and stay records.
3. Create a backup.
4. Restore the backup into a fresh database.
5. Confirm the sample data is visible from the frontend.
6. Remove sample data if it should not remain.

## Pre-Deployment Data Checks

Before deploying the creator-attribution migration from issue #146, confirm the
production operational tables are empty as expected:

```
docker compose --project-name catworld-prod --env-file .env.production -f compose.prod.yml exec -T db sh -c "mysql -u\"\$MYSQL_USER\" -p\"\$MYSQL_PASSWORD\" \"\$MYSQL_DATABASE\" -e \"SELECT 'owners' AS table_name, COUNT(*) AS rows_count FROM owners UNION ALL SELECT 'cats', COUNT(*) FROM cats UNION ALL SELECT 'vets', COUNT(*) FROM vets UNION ALL SELECT 'stays', COUNT(*) FROM stays;\""
```

If any of `owners`, `cats`, `vets` or `stays` contains rows, stop deployment
and obtain an explicit backfill or deployment decision before applying the
migration. Do not infer a creator for existing operational data without that
decision.
