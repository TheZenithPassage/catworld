"""Validate a published release and write a digest-only delivery record."""

import argparse
import json
import re
import subprocess
from pathlib import Path

SHA = re.compile(r"[0-9a-f]{40}\Z")
DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
TAG = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}\Z")


def fail(message):
    raise SystemExit(message)


def event_identity(event, name, action, ref, repository, visibility):
    release = event.get("release") or {}
    tag = release.get("tag_name")
    if (name != "release" or action != "published" or
            not isinstance(tag, str) or not TAG.fullmatch(tag) or
            ref != f"refs/tags/{tag}" or release.get("draft") is not False or
            not isinstance(release.get("prerelease"), bool) or
            not isinstance(release.get("id"), int) or release["id"] <= 0 or
            event.get("repository", {}).get("full_name") != repository or
            visibility != "public" or event["repository"].get("private") is not False):
        fail("Published tagged release in a public repository required")
    return release


def resolve_tag(tag):
    # Git peels annotated tags and returns the commit for lightweight tags.
    result = subprocess.run(["git", "rev-parse", "--verify", f"refs/tags/{tag}^{{commit}}"],
                            check=True, capture_output=True, text=True).stdout.strip()
    if not SHA.fullmatch(result):
        fail("Tag did not resolve to a full commit SHA")
    return result


def record(release, repository, source, backend, frontend, run, attempt):
    if not SHA.fullmatch(source):
        fail("Invalid source commit")
    for image in (backend, frontend):
        if not isinstance(image, str):
            fail("Both immutable GHCR image references are required")
        prefix, sep, digest = image.partition("@")
        if sep != "@" or not DIGEST.fullmatch(digest) or not prefix.startswith(f"ghcr.io/{repository.lower()}-"):
            fail("Both immutable GHCR image references are required")
    if backend == frontend or not backend.startswith(f"ghcr.io/{repository.lower()}-backend@") or not frontend.startswith(f"ghcr.io/{repository.lower()}-frontend@"):
        fail("Distinct backend and frontend images required")
    return {"schema": 1, "repository": repository, "release_id": release["id"],
            "tag": release["tag_name"], "prerelease": release["prerelease"],
            "source_sha": source, "backend": backend, "frontend": frontend,
            "workflow_run": int(run), "workflow_attempt": int(attempt)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["identity", "record"])
    parser.add_argument("--event", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument("--ref", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--visibility", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--source")
    parser.add_argument("--backend")
    parser.add_argument("--frontend")
    parser.add_argument("--run")
    parser.add_argument("--attempt")
    args = parser.parse_args()
    release = event_identity(json.loads(Path(args.event).read_text()), args.name, args.action,
                             args.ref, args.repository, args.visibility)
    source = resolve_tag(release["tag_name"])
    if args.source and source != args.source:
        fail("Release tag moved during build")
    result = (record(release, args.repository, source, args.backend, args.frontend,
                     args.run, args.attempt) if args.mode == "record" else
              {"tag": release["tag_name"], "release_id": release["id"],
               "prerelease": release["prerelease"], "source_sha": source})
    Path(args.output).write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")


if __name__ == "__main__":
    main()
