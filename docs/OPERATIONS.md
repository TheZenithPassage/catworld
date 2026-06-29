# CatWorld Operations

Operations procedures for the current CatWorld deployment.

## Current Production Deployment

The current production deployment runs from the host machine with `compose.prod.yml`.

Only the frontend is exposed to the host. The backend and database stay inside the Docker Compose network, and browser API requests go through the frontend `/api` proxy.

External access, if needed, must point only to the frontend URL. Backend and database ports must not be exposed directly.

Real production data must not be mixed with sample or test data.

## Configuration

Copy the production environment template:

```
Copy-Item .env.production.example .env.production
```

Set real values in `.env.production` before starting the stack:

```
DB_NAME=catworld
DB_USER=catworld_app
DB_PASSWORD=replace_with_a_strong_password
DB_ROOT_PASSWORD=replace_with_a_strong_root_password
CATWORLD_SECURITY_USERNAME=admin
CATWORLD_SECURITY_PASSWORD=replace_with_a_strong_admin_password
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=http://localhost:4200
FRONTEND_PORT=4200
```

On a fresh database, `CATWORLD_SECURITY_USERNAME` and `CATWORLD_SECURITY_PASSWORD` bootstrap the first `ADMIN` account in `user_accounts`. The password is encoded before storage.

When any user already exists, startup does not create, update, re-enable or overwrite accounts. Changing these environment variables after the first bootstrap does not rotate or reset the stored administrator password.

Do not commit real `.env.production` values.

## Start and Stop

Start the production stack:

```
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

Open the app:

```
http://localhost:4200
```

Stop the stack without deleting data:

```
docker compose --env-file .env.production -f compose.prod.yml down
```

Do not use `down -v` unless the production database volume should be deleted.

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
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE" > /tmp/catworld-backup.sql'
```

Copy it to the local backup directory:

```
docker compose --env-file .env.production -f compose.prod.yml cp db:/tmp/catworld-backup.sql "backups/catworld_$timestamp.sql"
```

Remove the temporary dump:

```
docker compose --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/catworld-backup.sql
```

## Restore

Stop the stack and delete the production database volume:

```
docker compose --env-file .env.production -f compose.prod.yml down -v
```

Start only MySQL:

```
docker compose --env-file .env.production -f compose.prod.yml up -d db
```

Copy the selected backup into the database container:

```
docker compose --env-file .env.production -f compose.prod.yml cp backups/catworld_YYYYMMDD_HHMMSS.sql db:/tmp/restore.sql
```

Restore it:

```
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/restore.sql'
```

Remove the temporary restore file:

```
docker compose --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/restore.sql
```

Start the full stack:

```
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

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
