#!/usr/bin/env python3
"""Validate one immutable CatWorld release pair before running production Compose.

The default validation does not contact Docker or alter the host. Deployment
requires explicit --deploy and completes all verification before Compose up.
"""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

REPO = "TheZenithPassage/catworld"
SOURCE = re.compile(r"[0-9a-f]{40}\Z")
DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
TAG = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}\Z")
FIELDS = frozenset({"schema", "repository", "release_id", "tag", "prerelease",
                    "source_sha", "backend", "frontend", "workflow_run", "workflow_attempt"})


def fail(message):
    raise ValueError(message)


def parse_delivery(data, expected_tag, expected_sha, repository=REPO):
    if not isinstance(data, dict) or set(data) != FIELDS:
        fail("Release delivery record has missing or unexpected fields")
    if type(data["schema"]) is not int or data["schema"] != 1:
        fail("Unsupported release record schema")
    if data["repository"] != repository:
        fail("Release record belongs to a different repository")
    if not isinstance(data["tag"], str) or not TAG.fullmatch(data["tag"]):
        fail("Invalid release tag")
    if data["tag"] != expected_tag:
        fail("Release tag differs from the explicitly selected tag")
    if not isinstance(data["source_sha"], str) or not SOURCE.fullmatch(data["source_sha"]):
        fail("Invalid release source SHA")
    if data["source_sha"] != expected_sha:
        fail("Release source differs from the explicitly selected commit")
    if type(data["prerelease"]) is not bool:
        fail("Invalid prerelease status")
    if data["prerelease"]:
        fail("Prerelease is not eligible for the normal production path")
    for key in ("release_id", "workflow_run", "workflow_attempt"):
        if type(data[key]) is not int or data[key] <= 0:
            fail("Invalid " + key)
    prefix = "ghcr.io/" + repository.lower()
    for kind in ("backend", "frontend"):
        image = data[kind]
        if not isinstance(image, str) or not image.startswith(prefix + "-" + kind + "@"):
            fail("Unexpected " + kind + " image repository")
        full_digest = image[len(prefix + "-" + kind + "@"):]
        if not DIGEST.fullmatch(full_digest):
            fail("Image must be identified by an immutable sha256 digest")
    if data["backend"] == data["frontend"]:
        fail("The two application images must differ")
    return data


def run(command, *, env=None, capture=False):
    return subprocess.run(command, env=env, check=True, text=True,
                          capture_output=capture)


def assert_compose(compose, envfile, project, images, *, run_command=run):
    variables = {**os.environ, "BACKEND_IMAGE": images["backend"],
                 "FRONTEND_IMAGE": images["frontend"]}
    prefix = ["docker", "compose", "--project-name", project,
              "--env-file", str(envfile), "-f", str(compose)]
    raw = run_command(prefix + ["config", "--format", "json"],
                      env=variables, capture=True).stdout
    config = json.loads(raw)
    services = config.get("services", {})
    if set(services) != {"db", "app", "frontend"}:
        fail("Unexpected services in production Compose")
    for service in services.values():
        if "build" in service:
            fail("Production Compose must never build images")
    for key, service in (("backend", "app"), ("frontend", "frontend")):
        if services[service].get("image") != images[key]:
            fail("Compose image differs from selected release record")
    for service in ("db", "app"):
        if services[service].get("ports"):
            fail("Database and API must not publish host ports")
    published = services["frontend"].get("ports", [])
    if len(published) != 1 or published[0].get("target") != 80 or (
            published[0].get("host_ip") != "127.0.0.1"):
        fail("Frontend must expose only port 80 on host loopback")
    if not services["db"].get("volumes"):
        fail("Production database needs its persistent volume")
    return prefix, variables


def verify_pulled_image(image, record, *, run_command=run):
    raw = run_command(["docker", "image", "inspect", image, "--format", "{{json .}}"],
                      capture=True).stdout
    details = json.loads(raw)
    labels = details.get("Config", {}).get("Labels") or {}
    if details.get("Architecture") != "arm64":
        fail("Selected image is not ARM64")
    if image not in (details.get("RepoDigests") or []):
        fail("Pulled image has no matching immutable repository digest")
    expected = {
        "org.opencontainers.image.source": "https://github.com/" + record["repository"],
        "org.opencontainers.image.revision": record["source_sha"],
        "org.opencontainers.image.version": record["tag"],
    }
    for key, value in expected.items():
        if labels.get(key) != value:
            fail("OCI label disagrees with the selected release: " + key)


def ensure_database_image(*, run_command=run):
    """Fetch the MySQL image only on first setup; never refresh it implicitly."""
    image = "mysql:8.0"
    result = run_command(
        ["docker", "image", "ls", "--quiet", "--no-trunc",
         "--filter", f"reference={image}"], capture=True)
    if not result.stdout.strip():
        run_command(["docker", "pull", image])


def prepare(args, *, run_command=run):
    data = json.loads(Path(args.delivery).read_text(encoding="utf-8"))
    record = parse_delivery(data, args.tag, args.source)
    if not args.deploy:
        return record
    if not Path(args.env_file).is_file():
        fail("Private production environment file is missing")
    prefix, variables = assert_compose(args.compose, args.env_file, args.project,
                                       record, run_command=run_command)
    # Fail before changing any running services, even if one of the pulls fails.
    for image in (record["backend"], record["frontend"]):
        run_command(["docker", "pull", "--platform", "linux/arm64", image])
        verify_pulled_image(image, record, run_command=run_command)
    ensure_database_image(run_command=run_command)
    run_command(prefix + ["up", "--no-build", "--pull", "never", "-d", "--wait"],
                env=variables)
    return record


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--delivery", required=True)
    parser.add_argument("--tag", required=True, help="Explicit approved release tag")
    parser.add_argument("--source", required=True, help="Exact full source commit SHA")
    parser.add_argument("--env-file", default=".env.production")
    parser.add_argument("--compose", default="compose.prod.yml")
    parser.add_argument("--project", default="catworld-prod")
    parser.add_argument("--deploy", action="store_true",
                        help="Pull images and start Compose only after verification")
    args = parser.parse_args()
    try:
        record = prepare(args)
    except (ValueError, OSError, json.JSONDecodeError, subprocess.CalledProcessError) as exc:
        parser.exit(1, "Release preflight refused: " + str(exc) + "\n")
    print("Verified release:", record["tag"], record["source_sha"])
    if args.deploy:
        print("Production Compose was started with the selected image pair.")


if __name__ == "__main__":
    main()
