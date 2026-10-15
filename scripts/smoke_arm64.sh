#!/usr/bin/env bash
# Disposable full-stack smoke; never contacts GHCR or production.
set -euo pipefail
test "$(uname -m)" = aarch64
tmp=$(mktemp -d)
project="catworld-release-smoke-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
registry="catworld-smoke-registry-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
export DB_NAME=catworld_smoke DB_USER=catworld_smoke
export DB_PASSWORD=disposable_only_password DB_ROOT_PASSWORD=disposable_only_root
export CATWORLD_SECURITY_USERNAME=smoke_admin CATWORLD_SECURITY_PASSWORD=disposable_only_admin
export CATWORLD_SECURITY_CORS_ALLOWED_ORIGINS=http://127.0.0.1:18420
export FRONTEND_PORT=18420 BUSINESS_TIME_ZONE=America/Argentina/Buenos_Aires
cleanup() {
  docker compose -p "$project" -f compose.prod.yml down -v --remove-orphans >/dev/null 2>&1 || true
  docker rm -f "$registry" >/dev/null 2>&1 || true
  rm -rf "$tmp"
}
trap cleanup EXIT
built_backend="$BACKEND_IMAGE:run-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
built_frontend="$FRONTEND_IMAGE:run-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
for image in "$built_backend" "$built_frontend"; do
  test "$(docker image inspect --format '{{.Architecture}}' "$image")" = arm64
  test "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" = "$SOURCE_SHA"
  test "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$image")" = "$RELEASE_TAG"
done
docker run -d --name "$registry" -p 127.0.0.1:5000:5000 registry:2 >/dev/null
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5000/v2/ >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:5000/v2/ >/dev/null
docker tag "$built_backend" 127.0.0.1:5000/catworld-backend:smoke
docker tag "$built_frontend" 127.0.0.1:5000/catworld-frontend:smoke
docker push 127.0.0.1:5000/catworld-backend:smoke | tee "$tmp/back.log"
docker push 127.0.0.1:5000/catworld-frontend:smoke | tee "$tmp/front.log"
backend_digest=$(sed -n 's/.*digest: \(sha256:[0-9a-f]\{64\}\).*/\1/p' "$tmp/back.log" | tail -n 1)
frontend_digest=$(sed -n 's/.*digest: \(sha256:[0-9a-f]\{64\}\).*/\1/p' "$tmp/front.log" | tail -n 1)
[[ "$backend_digest" =~ ^sha256:[0-9a-f]{64}$ ]]
[[ "$frontend_digest" =~ ^sha256:[0-9a-f]{64}$ ]]
export BACKEND_IMAGE="127.0.0.1:5000/catworld-backend@$backend_digest"
export FRONTEND_IMAGE="127.0.0.1:5000/catworld-frontend@$frontend_digest"
docker pull --platform linux/arm64 "$BACKEND_IMAGE"
docker pull --platform linux/arm64 "$FRONTEND_IMAGE"
docker pull mysql:8.0
python3 - <<'PY'
import json, os, subprocess
cfg = json.loads(subprocess.check_output(
    ["docker","compose","-f","compose.prod.yml","config","--format","json"], text=True))
s = cfg["services"]
assert set(s) == {"db", "app", "frontend"}
assert all("build" not in v for v in s.values())
assert s["app"]["image"] == os.environ["BACKEND_IMAGE"]
assert s["frontend"]["image"] == os.environ["FRONTEND_IMAGE"]
assert not s["db"].get("ports") and not s["app"].get("ports")
assert len(s["frontend"]["ports"]) == 1 and s["frontend"]["ports"][0]["host_ip"] == "127.0.0.1"
PY
docker compose -p "$project" -f compose.prod.yml up --no-build --pull never -d
wait_for_app() {
  for i in $(seq 1 120); do
    if curl -fsS -u "$CATWORLD_SECURITY_USERNAME:$CATWORLD_SECURITY_PASSWORD" \
      -X POST http://127.0.0.1:18420/api/auth/login -o "$tmp/login.json"; then
      jq -e '.role == "ADMIN"' "$tmp/login.json" >/dev/null && return 0
    fi
    sleep 2
  done
  docker compose -p "$project" -f compose.prod.yml logs --tail=100 app frontend
  return 1
}
wait_for_app
curl -fsS http://127.0.0.1:18420/ -o "$tmp/index.html"
grep -qi '<html' "$tmp/index.html"
curl -fsS http://127.0.0.1:18420/runtime-config.json |
  jq -e '.businessTimeZone == "America/Argentina/Buenos_Aires"' >/dev/null
owner=$(curl -fsS -u "$CATWORLD_SECURITY_USERNAME:$CATWORLD_SECURITY_PASSWORD" \
  -H "Content-Type: application/json" -d '{"fullName":"CI Owner","primaryPhone":"123456789"}' \
  http://127.0.0.1:18420/api/owners)
owner_id=$(printf '%s' "$owner" | jq -er .id)
jq -n --arg owner "$owner_id" \
  '{name:"CI Cat",birthDate:"2021-01-01",sex:"MALE",ownerId:$owner}' > "$tmp/cat.json"
docker run --rm --entrypoint sh \
  --mount "type=bind,src=$tmp,dst=/smoke" "$built_backend" -c \
  'vips black /smoke/photo.v 96 72 --bands 3 && vips copy /smoke/photo.v /smoke/photo.heic[compression=hevc]'
created=$(curl -fsS -u "$CATWORLD_SECURITY_USERNAME:$CATWORLD_SECURITY_PASSWORD" \
  -F "cat=@$tmp/cat.json;type=application/json" -F "photo=@$tmp/photo.heic;type=image/heic" \
  http://127.0.0.1:18420/api/cats)
cat_id=$(printf '%s' "$created" | jq -er .id)
curl -fsS -u "$CATWORLD_SECURITY_USERNAME:$CATWORLD_SECURITY_PASSWORD" \
  "http://127.0.0.1:18420/api/cats/$cat_id/photo" -o "$tmp/before.jpg"
test "$(file -b --mime-type "$tmp/before.jpg")" = image/jpeg
docker compose -p "$project" -f compose.prod.yml up --no-build --pull never -d --force-recreate
wait_for_app
curl -fsS -u "$CATWORLD_SECURITY_USERNAME:$CATWORLD_SECURITY_PASSWORD" \
  "http://127.0.0.1:18420/api/cats/$cat_id/photo" -o "$tmp/after.jpg"
cmp "$tmp/before.jpg" "$tmp/after.jpg"
echo "ARM64 image-only proxy/auth/photo/timezone/persistence smoke passed"
