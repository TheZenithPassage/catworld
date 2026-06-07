# CatWorld Operations

This document covers simple local/private operational procedures for CatWorld.

## Private MVP Authentication

The private production stack requires one configured login user.

Set these values in `.env.production` before starting the stack:

- `CATWORLD_SECURITY_USERNAME`: login username. Example: `admin`
- `CATWORLD_SECURITY_PASSWORD`: login password. Example: `replace_with_a_strong_admin_password`
- `CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS`: frontend origin allowed to call the API. Example: `http://localhost:4200`

Default local setup:

```env
CATWORLD_SECURITY_USERNAME=admin
CATWORLD_SECURITY_PASSWORD=replace_with_a_strong_admin_password
CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=http://localhost:4200
```

If the frontend is exposed on another host or port, update `CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS` to match the browser URL used to open CatWorld.

Start the private production stack with:

```bash
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

On Windows PowerShell:

```powershell
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

Then open:

```txt
http://localhost:4200
```

and log in with the configured username and password.

## Database Backups

Backups are stored locally under:

```txt
backups/
```

Use this naming convention:

```txt
catworld_YYYYMMDD_HHMMSS.sql
```

Example:

```txt
backups/catworld_20260602_153000.sql
```

Backup files may contain real owner, cat, vet and stay data. Do not commit them.

## Create a Backup

Start from the private production stack:

```bash
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

Create the backup directory:

```bash
mkdir -p backups
```

Create a MySQL dump from the running database container:

```bash
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' > "backups/catworld_$(date +%Y%m%d_%H%M%S).sql"
```

On Windows PowerShell, create the backup directory first:

```powershell
New-Item -ItemType Directory -Force backups
```

Then create a timestamp:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
```

Create the dump inside the database container:

```powershell
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE" > /tmp/catworld-backup.sql'
```

Copy the dump from the container to the local backup directory:

```powershell
docker compose --env-file .env.production -f compose.prod.yml cp db:/tmp/catworld-backup.sql "backups/catworld_$timestamp.sql"
```

Remove the temporary dump from the container:

```powershell
docker compose --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/catworld-backup.sql
```

Check that the backup file exists:

```powershell
Get-ChildItem backups
```

## Restore a Backup Into a Fresh Local Stack

Stop the private production stack and delete the local production database volume:

```bash
docker compose --env-file .env.production -f compose.prod.yml down -v
```

Start only MySQL so the database and user are created before restoring:

```bash
docker compose --env-file .env.production -f compose.prod.yml up -d db
```

Wait until MySQL is healthy:

```bash
docker compose --env-file .env.production -f compose.prod.yml ps
```

Restore the selected backup file:

```bash
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < backups/catworld_YYYYMMDD_HHMMSS.sql
```

On Windows PowerShell, first copy the selected backup into the database container:

```powershell
docker compose --env-file .env.production -f compose.prod.yml cp backups/catworld_YYYYMMDD_HHMMSS.sql db:/tmp/restore.sql
```

Then restore it from inside the container:

```powershell
docker compose --env-file .env.production -f compose.prod.yml exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/restore.sql'
```

Remove the temporary restore file from the container:

```powershell
docker compose --env-file .env.production -f compose.prod.yml exec -T db rm /tmp/restore.sql
```

Then start the full stack:

```bash
docker compose --env-file .env.production -f compose.prod.yml up --build -d
```

Check the containers:

```bash
docker compose --env-file .env.production -f compose.prod.yml ps
```

Open the frontend:

```txt
http://localhost:4200
```

## Manual Validation

Before using CatWorld with real data, test this procedure once with non-sensitive sample data:

1. Start the private production stack.
2. Create one sample owner, cat, vet if needed, and stay.
3. Create a backup.
4. Stop the stack with `down -v`.
5. Start only `db`.
6. Wait until MySQL is healthy.
7. Restore the backup.
8. Start the full stack.
9. Confirm the sample data is visible from the frontend.
10. Remove the sample data if it should not remain in the local database.