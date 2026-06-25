# v1.0 Database Upgrade Validation

Issue: `#135`  
Executed and evidence-rerun: 2026-06-24  
Tagged source: `v1.0.0` (`5676d08d69a27497d751bb69da841791ac772cfe`)  
Upgrade source: `87c1bf1f764b3411d821d721326dd1b85c49f154`

## Result

PASS. An authentic, populated `v1.0.0` database was upgraded in place. Its
pre-upgrade dump was then restored into a second empty volume and upgraded
again. Counts, UUIDs, relationships, populated optional values, and null
optional values matched in the four observed states: tagged, first upgrade,
restored, and second upgrade.

Both upgrades applied Flyway V2 exactly once, bootstrapped one encoded enabled
`ADMIN`, authenticated that account, and authorized it for `GET /api/users`.
Restarting the first upgraded stack did not change account or Flyway rows.

No migration, application, Compose, or operations-documentation defect was
found. `docs/OPERATIONS.md` was not changed because its backup and restore
process worked as documented.

## Isolation

| Purpose | Compose project | Database volume | Host port |
| --- | --- | --- | --- |
| Tagged database and in-place upgrade | `catworld135_upgrade` | `catworld135_upgrade_catworld_mysql_data` | `14351` |
| Restore and second upgrade | `catworld135_restore` | `catworld135_restore_catworld_mysql_data` | `14352` |

Each project used a separate temporary environment file outside the repository.
Only disposable values were used; their actual credentials are not recorded.
The database was not exposed to the host. Docker Engine `29.2.0`, Docker
Compose `5.0.2`, and MySQL `8.0.45` were observed.

The sanitized environment-file shapes were:

```dotenv
DB_NAME=<isolated-database>
DB_USER=<isolated-database-user>
DB_PASSWORD=<isolated-database-password>
DB_ROOT_PASSWORD=<isolated-root-password>
CATWORLD_SECURITY_USERNAME=<bootstrap-admin>
CATWORLD_SECURITY_PASSWORD=<bootstrap-admin-password>
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=http://localhost:<isolated-port>
FRONTEND_PORT=<isolated-port>
```

## Authentic tagged database

The detached worktree and tagged stack were created with:

```powershell
git worktree add --detach <temporary-v1-worktree> v1.0.0

docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml config --quiet
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml up --build -d
```

The tagged application log showed an empty schema, creation of
`flyway_schema_history`, and successful application of `V1__init.sql`.

### API creation commands

The following is the sanitized PowerShell equivalent of the executed requests.
It includes every request field; only HTTP Basic credentials are placeholders.

```powershell
$base = 'http://localhost:14351/api'
$token = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes('<bootstrap-admin>:<bootstrap-admin-password>')
)
$headers = @{ Authorization = "Basic $token" }

function PostJson($path, $body) {
  Invoke-RestMethod -Method Post -Uri "$base$path" -Headers $headers `
    -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
}

$ownerA = PostJson '/owners' @{
  fullName = 'Release Validation Owner A'
  address = '135 Migration Lane'
  primaryPhone = '+34910000135'
  secondaryPhone = '+34600135135'
  secondaryPhoneName = 'Validation Contact'
  instagram = '@catworld_release_135'
  facebook = 'catworld.release.135'
}
$ownerB = PostJson '/owners' @{
  fullName = 'Release Validation Owner B'
  address = $null
  primaryPhone = '+34910000235'
  secondaryPhone = $null
  secondaryPhoneName = $null
  instagram = $null
  facebook = $null
}
$vet = PostJson '/vets' @{
  name = 'Release Validation Vet'
  address = '2 Safe Restore Street'
  phoneNumber = '+34910000335'
}
$catAlpha = PostJson '/cats' @{
  name = 'Migration Alpha'; birthDate = '2020-02-20'; sex = 'FEMALE'
  breed = 'European Shorthair'; coat = 'Short'; color = 'Tortoiseshell'
  foodBrand = 'Validation Food'; litterBrand = 'Validation Litter'
  personality = 'Curious and calm'
  lastInternalDewormerName = 'InternalSafe'
  lastInternalDewormingDate = '2026-05-01'
  lastExternalDewormerName = 'ExternalSafe'
  lastExternalDewormingDate = '2026-05-02'
  lastTripleFelineDate = '2026-04-15'; lastRabiesDate = '2026-04-16'
  ownerId = $ownerA.id; vetId = $vet.id
}
$catBeta = PostJson '/cats' @{
  name = 'Migration Beta'; birthDate = '2021-03-21'; sex = 'MALE'
  breed = $null; coat = $null; color = $null; foodBrand = $null
  litterBrand = $null; personality = $null
  lastInternalDewormerName = $null; lastInternalDewormingDate = $null
  lastExternalDewormerName = $null; lastExternalDewormingDate = $null
  lastTripleFelineDate = $null; lastRabiesDate = $null
  ownerId = $ownerA.id; vetId = $null
}
$catGamma = PostJson '/cats' @{
  name = 'Restore Gamma'; birthDate = '2022-04-22'; sex = 'FEMALE'
  breed = 'Siamese'; coat = $null; color = 'Cream'; foodBrand = $null
  litterBrand = 'Restore Litter'; personality = $null
  lastInternalDewormerName = $null; lastInternalDewormingDate = $null
  lastExternalDewormerName = $null; lastExternalDewormingDate = $null
  lastTripleFelineDate = $null; lastRabiesDate = $null
  ownerId = $ownerB.id; vetId = $null
}
$futureStay = PostJson '/stays' @{
  startAt = '2030-07-01T09:00:00'; endAt = '2030-07-10T18:00:00'
  notes = 'Future multi-cat release validation stay'
  catIds = @($catAlpha.id, $catBeta.id)
}
$cancelledStay = PostJson '/stays' @{
  startAt = '2030-08-01T09:00:00'; endAt = '2030-08-03T18:00:00'
  notes = $null; catIds = @($catGamma.id)
}
Invoke-WebRequest -Method Patch `
  -Uri "$base/stays/$($cancelledStay.stayId)/cancel" -Headers $headers
```

The API returned these representative UUIDs:

| Record | UUID |
| --- | --- |
| Owner A | `22daa2ec-2419-437a-a65c-5dd7b3d5528e` |
| Owner B | `3ed7902a-dadc-47b2-a8b7-2e2dd1101b83` |
| Vet | `31c71740-9155-4e14-9e26-0feeb4f5e29e` |
| Migration Alpha | `7988ea1e-65c3-4ec9-b848-8b2b2c41c5df` |
| Migration Beta | `d1217212-48c7-4702-9f12-c72c34ef71aa` |
| Restore Gamma | `f2b33c82-3a77-4ffe-afcf-10dbfd327d34` |
| Future multi-cat stay | `b43d4f6f-d799-4c45-8964-888a62a26a15` |
| Cancelled stay | `f8ba5f4d-d1b1-465f-93c3-7d5e63b85da0` |

## SQL comparison commands

Each query was executed before upgrade, after the first upgrade, after restore,
and after the second upgrade using this production-container pattern:

```powershell
docker compose -p <isolated-project> --env-file <isolated-env> `
  -f <compose-file> exec -T db sh -c `
  'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --batch --raw "$MYSQL_DATABASE" -e "<query>"'
```

The exact count query was:

```sql
SELECT 'owners' table_name, COUNT(*) row_count FROM owners
UNION ALL SELECT 'cats', COUNT(*) FROM cats
UNION ALL SELECT 'vets', COUNT(*) FROM vets
UNION ALL SELECT 'stays', COUNT(*) FROM stays
UNION ALL SELECT 'stay_cat', COUNT(*) FROM stay_cat;
```

The exact relationship queries were:

```sql
SELECT BIN_TO_UUID(c.id) cat_id,
       c.name,
       BIN_TO_UUID(c.owner_id) owner_id,
       IFNULL(BIN_TO_UUID(c.vet_id), 'NULL') vet_id
FROM cats c
ORDER BY c.name;

SELECT BIN_TO_UUID(s.id) stay_id,
       BIN_TO_UUID(s.owner_id) owner_id,
       IFNULL(CAST(s.cancelled_at AS CHAR), 'NULL') cancelled_at,
       GROUP_CONCAT(BIN_TO_UUID(sc.cat_id)
                    ORDER BY BIN_TO_UUID(sc.cat_id)) cat_ids
FROM stays s
JOIN stay_cat sc ON sc.stay_id = s.id
GROUP BY s.id, s.owner_id, s.cancelled_at
ORDER BY s.start_at;
```

The exact optional-field snapshot queries were:

```sql
SELECT full_name,
       IFNULL(address, 'NULL') address,
       IFNULL(secondary_phone, 'NULL') secondary_phone,
       IFNULL(secondary_phone_name, 'NULL') secondary_phone_name,
       IFNULL(instagram, 'NULL') instagram,
       IFNULL(facebook, 'NULL') facebook
FROM owners ORDER BY full_name;

SELECT name,
       IFNULL(address, 'NULL') address,
       IFNULL(phone_number, 'NULL') phone_number
FROM vets ORDER BY name;

SELECT name,
       IFNULL(breed, 'NULL') breed,
       IFNULL(coat, 'NULL') coat,
       IFNULL(color, 'NULL') color,
       IFNULL(food_brand, 'NULL') food_brand,
       IFNULL(litter_brand, 'NULL') litter_brand,
       IFNULL(personality, 'NULL') personality,
       IFNULL(last_internal_dewormer_name, 'NULL') internal_name,
       IFNULL(CAST(last_internal_deworming_date AS CHAR), 'NULL') internal_date,
       IFNULL(last_external_dewormer_name, 'NULL') external_name,
       IFNULL(CAST(last_external_deworming_date AS CHAR), 'NULL') external_date,
       IFNULL(CAST(last_triple_feline_date AS CHAR), 'NULL') triple_date,
       IFNULL(CAST(last_rabies_date AS CHAR), 'NULL') rabies_date
FROM cats ORDER BY name;

SELECT BIN_TO_UUID(id) stay_id,
       IFNULL(notes, 'NULL') notes,
       IFNULL(CAST(cancelled_at AS CHAR), 'NULL') cancelled_at
FROM stays ORDER BY start_at;
```

Flyway was queried with:

```sql
SELECT installed_rank, version, description, type, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

## Captured domain results

All four count results were identical:

| Table | Tagged | First upgrade | Restored | Second upgrade |
| --- | ---: | ---: | ---: | ---: |
| `owners` | 2 | 2 | 2 | 2 |
| `cats` | 3 | 3 | 3 | 3 |
| `vets` | 1 | 1 | 1 | 1 |
| `stays` | 2 | 2 | 2 | 2 |
| `stay_cat` | 3 | 3 | 3 | 3 |

The relationship output was also identical in all four states:

```text
7988ea1e-65c3-4ec9-b848-8b2b2c41c5df | Migration Alpha | owner 22daa2ec-2419-437a-a65c-5dd7b3d5528e | vet 31c71740-9155-4e14-9e26-0feeb4f5e29e
d1217212-48c7-4702-9f12-c72c34ef71aa | Migration Beta  | owner 22daa2ec-2419-437a-a65c-5dd7b3d5528e | vet NULL
f2b33c82-3a77-4ffe-afcf-10dbfd327d34 | Restore Gamma   | owner 3ed7902a-dadc-47b2-a8b7-2e2dd1101b83 | vet NULL

b43d4f6f-d799-4c45-8964-888a62a26a15 | owner 22daa2ec-2419-437a-a65c-5dd7b3d5528e | cancelled NULL | cats 7988ea1e-65c3-4ec9-b848-8b2b2c41c5df,d1217212-48c7-4702-9f12-c72c34ef71aa
f8ba5f4d-d1b1-465f-93c3-7d5e63b85da0 | owner 3ed7902a-dadc-47b2-a8b7-2e2dd1101b83 | cancelled populated | cat f2b33c82-3a77-4ffe-afcf-10dbfd327d34
```

The optional-field query produced the same rows before/after both upgrades and
after restore:

- Owner A retained its address, secondary contact, Instagram, and Facebook;
  Owner B retained `NULL` for all those optional fields.
- The vet retained its address and phone.
- Migration Alpha retained every populated breed, coat, color, food, litter,
  personality, deworming, triple-feline, and rabies value.
- Migration Beta retained `NULL` for every queried optional cat field.
- Restore Gamma retained `Siamese`, `Cream`, and `Restore Litter`, with the
  remaining queried optional cat fields `NULL`.
- The future stay retained populated notes and `NULL` cancellation; the
  cancelled stay retained `NULL` notes and the same populated cancellation
  timestamp (`2026-06-24 18:00:06.667673`).

## Backup and in-place upgrade

The documented production-like backup commands were:

```powershell
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml exec -T db sh -c `
  'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE" > /tmp/pre.sql'
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml cp db:/tmp/pre.sql <temporary-backup>
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml exec -T db rm /tmp/pre.sql
```

The dump was `9,651` bytes with SHA-256
`F6E0F3269C12050ADABC2DED22919C5F7D41E422C9B769305644CC3D5D715442`.

The tagged stack was stopped without deleting the volume, and the current stack
was started with the same project and volume:

```powershell
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f <temporary-v1-worktree>/compose.prod.yml down
docker volume inspect catworld135_upgrade_catworld_mysql_data
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f compose.prod.yml up --build -d
```

Before upgrade, Flyway contained only:

```text
rank=1 | version=1 | init | SQL | V1__init.sql | checksum=1075158416 | success=1
```

After each upgrade, Flyway contained exactly:

```text
rank=1 | version=1 | init                 | SQL | V1__init.sql                 | checksum=1075158416  | success=1
rank=2 | version=2 | create user accounts | SQL | V2__create_user_accounts.sql | checksum=-1338992460 | success=1
```

V2 count and successful count were `1` and `1` in each upgraded database.

## Bootstrap, authentication, and ADMIN API

The first-upgrade bootstrap output, with username removed, was:

```text
user_id=e88690ee-f707-4676-83d0-9f9816af1b05 role=ADMIN enabled=1 hash_length=68 encoded=1
```

The second-upgrade bootstrap output was:

```text
user_id=e7d51996-f4fc-4c43-9050-1a1e60676c50 role=ADMIN enabled=1 hash_length=68 encoded=1
```

The raw encoded values were used only for in-memory equality comparison and
were never printed or recorded. Authentication and the ADMIN API were executed
with:

```powershell
$token = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes('<bootstrap-admin>:<bootstrap-admin-password>')
)
$headers = @{ Authorization = "Basic $token" }
Invoke-RestMethod -Method Post -Uri 'http://localhost:<port>/api/auth/login' `
  -Headers $headers
Invoke-RestMethod -Method Get -Uri 'http://localhost:<port>/api/users' `
  -Headers $headers
```

The sanitized login response for each upgraded database was:

```json
{"username":"<bootstrap-admin>","role":"ADMIN"}
```

The sanitized user-list response was:

```json
[{"id":"<bootstrap-uuid>","username":"<bootstrap-admin>","role":"ADMIN","enabled":true}]
```

## Restart comparison

A second ADMIN was created, then the bootstrapped account was changed to
`STAFF` and disabled so that role overwrite and re-enablement would be
observable:

```powershell
$guard = PostJson '/users' @{
  username = '<restart-guard>'
  password = '<restart-guard-password>'
  role = 'ADMIN'
}
$users = Invoke-RestMethod -Uri "$base/users" -Headers $headers
$bootstrap = ($users | Where-Object { $_.username -eq '<bootstrap-admin>' })
Invoke-RestMethod -Method Patch -Uri "$base/users/$($bootstrap.id)/role" `
  -Headers $headers -ContentType 'application/json' `
  -Body (@{ role = 'STAFF' } | ConvertTo-Json)

$guardHeaders = <Basic-auth header for the restart guard>
Invoke-RestMethod -Method Patch -Uri "$base/users/$($bootstrap.id)/enabled" `
  -Headers $guardHeaders -ContentType 'application/json' `
  -Body (@{ enabled = $false } | ConvertTo-Json)
```

The comparison selected all account fields, including the encoded value, and
all Flyway evidence fields:

```sql
SELECT BIN_TO_UUID(id), username, password_hash, role, enabled,
       created_at, updated_at
FROM user_accounts ORDER BY username;

SELECT installed_rank, version, description, type, script, checksum,
       installed_by, execution_time, success
FROM flyway_schema_history ORDER BY installed_rank;
```

```powershell
function Invoke-IsolatedSql([string]$query) {
  $mysql = 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" ' +
    '--batch --raw --skip-column-names "$MYSQL_DATABASE" -e "' + $query + '"'
  docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
    -f compose.prod.yml exec -T db sh -c $mysql
}

$beforeAccounts = Invoke-IsolatedSql '<account query above>'
$beforeFlyway = Invoke-IsolatedSql '<Flyway query above>'

docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f compose.prod.yml restart

$afterAccounts = Invoke-IsolatedSql '<account query above>'
$afterFlyway = Invoke-IsolatedSql '<Flyway query above>'

@(Compare-Object $beforeAccounts $afterAccounts -SyncWindow 0).Count -eq 0
@(Compare-Object $beforeFlyway $afterFlyway -SyncWindow 0).Count -eq 0
```

Concrete restart output was:

```text
bootstrap_id=e88690ee-f707-4676-83d0-9f9816af1b05
guard_id=41c73335-db6f-4b45-bd01-8f3a9d3c6050

before:
e88690ee-f707-4676-83d0-9f9816af1b05 | <bootstrap-admin> | STAFF | enabled=0
41c73335-db6f-4b45-bd01-8f3a9d3c6050 | <restart-guard>  | ADMIN | enabled=1

after:
e88690ee-f707-4676-83d0-9f9816af1b05 | <bootstrap-admin> | STAFF | enabled=0
41c73335-db6f-4b45-bd01-8f3a9d3c6050 | <restart-guard>  | ADMIN | enabled=1

account_rows_equal=True
flyway_rows_equal=True
public_state_equal=True
v2_count=1
v2_successful_count=1
admin_api_count=2
```

Thus no account was created, renamed, re-enabled, role-modified, password-
rewritten, or audit-updated by restart, and Flyway history was unchanged.

## Restore and second upgrade

The second project's volume contained zero tables before restore. No
application was running during the restore.

```powershell
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f <temporary-v1-worktree>/compose.prod.yml up -d db
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f <temporary-v1-worktree>/compose.prod.yml cp <temporary-backup> db:/tmp/restore.sql
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f <temporary-v1-worktree>/compose.prod.yml exec -T db sh -c `
  'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/restore.sql'
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f <temporary-v1-worktree>/compose.prod.yml exec -T db rm /tmp/restore.sql
```

The restored counts, UUID relationships, optional-field snapshot, and single V1
Flyway row exactly matched the tagged pre-upgrade output. `user_accounts` was
absent (`0` matching tables). The current stack was then started against the
same restore project and volume:

```powershell
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f compose.prod.yml config --quiet
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f compose.prod.yml up --build -d
```

The second-upgrade counts, UUID relationships, optional-field snapshot, Flyway
rows, encoded bootstrap checks, authentication output, and ADMIN API output all
matched the first upgrade's expected results.

## Repository validation and cleanup

```powershell
./mvnw verify
docker compose -p catworld135_upgrade --env-file <isolated-upgrade-env> `
  -f compose.prod.yml config
docker compose -p catworld135_restore --env-file <isolated-restore-env> `
  -f compose.prod.yml config
```

`./mvnw verify` passed 85 tests with zero failures, errors, or skips. Both
production Compose configurations rendered successfully. Frontend validation
was not run because no frontend file changed.

After all evidence was captured, both isolated stacks, volumes, and dedicated
images were removed. The detached tag worktree and temporary environment and
backup files were also removed. No real production project, environment,
container, database, or volume was used.
