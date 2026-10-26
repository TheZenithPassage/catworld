"""Exercise the real release publisher with isolated fake tools.

No registry, GitHub release, secrets, or production services are contacted.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = "1" * 40
OTHER = "2" * 40
REPOSITORY = "TheZenithPassage/catworld"


def workflow_run(name):
    lines = (ROOT / ".github/workflows/release-pair.yml").read_text(encoding="utf-8").splitlines()
    for index, line in enumerate(lines):
        if line.strip() != "- name: " + name:
            continue
        for pos in range(index + 1, len(lines)):
            if lines[pos].strip() == "run: |":
                indent = len(lines[pos]) - len(lines[pos].lstrip(" "))
                body = []
                for body_line in lines[pos + 1:]:
                    if body_line.strip() and len(body_line) - len(body_line.lstrip(" ")) <= indent:
                        break
                    body.append(body_line)
                return textwrap.dedent("\n".join(body)) + "\n"
            if lines[pos].strip() and len(lines[pos]) - len(lines[pos].lstrip(" ")) <= 6:
                break
    raise AssertionError("Missing actual workflow step: " + name)


SHIM = r'''#!/usr/bin/env python3
import json
import os
import sys

name = os.path.basename(sys.argv[0])
args = sys.argv[1:]
failure = os.environ.get("FAILURE_CASE", "")
with open(os.environ["FAKE_TRACE"], "a", encoding="utf-8") as trace:
    trace.write(json.dumps([name, *args]) + "\n")

if name == "git":
    if args[:1] == ["rev-parse"]:
        print(os.environ["SOURCE_SHA"])
    elif args[:1] == ["ls-remote"]:
        source = "2" * 40 if failure == "moved_tag" else os.environ["SOURCE_SHA"]
        print(source + "\t" + args[-1])
    else:
        sys.exit(5)
elif name == "gh":
    if args[:1] == ["api"] and "/releases/" in args[1]:
        if failure == "already_selected":
            print("catworld-delivery.json")
    elif args[:1] == ["api"] and args[1].startswith("repos/"):
        print("public")
    elif args[:2] == ["release", "upload"]:
        if failure == "upload_failed":
            sys.exit(8)
    else:
        sys.exit(6)
elif name == "docker":
    operation = args[0]
    if operation == "push":
        if failure == "backend_push" and "backend:" in args[1]:
            sys.exit(7)
        if failure == "frontend_push" and "frontend:" in args[1]:
            sys.exit(7)
        character = "b" if "backend:" in args[1] else "c"
        print("digest: sha256:" + character * 64)
    elif operation == "pull":
        if failure == "anonymous_frontend_denied" and "frontend@" in args[-1]:
            sys.exit(9)
    elif operation not in ("login", "logout"):
        sys.exit(11)
else:
    sys.exit(12)
'''


@unittest.skipUnless(os.name == "posix", "Exercises bash shell only in Linux CI")
class RealPublicationBoundaryTest(unittest.TestCase):
    def execute(self, failure_case="", tag="v1.2.0", ref=None):
        with tempfile.TemporaryDirectory() as folder:
            tmp = Path(folder)
            (tmp / "scripts").mkdir()
            shutil.copy2(ROOT / "scripts/release_pair.py",
                         tmp / "scripts/release_pair.py")
            shutil.copy2(ROOT / "scripts/release_tags.py",
                         tmp / "scripts/release_tags.py")
            event = {
                "repository": {"full_name": REPOSITORY, "private": False},
                "release": {"id": 100, "tag_name": tag,
                            "draft": False, "prerelease": False},
            }
            (tmp / "event.json").write_text(json.dumps(event), encoding="utf-8")
            binary = tmp / "bin"
            binary.mkdir()
            for name in ("git", "gh", "docker"):
                path = binary / name
                path.write_text(SHIM, encoding="utf-8")
                path.chmod(0o755)
            trace = tmp / "trace.jsonl"
            environment = {**os.environ,
                           "PATH": str(binary) + os.pathsep + os.environ["PATH"],
                           "SOURCE_SHA": SHA,
                           "FAKE_TRACE": str(trace),
                           "FAILURE_CASE": failure_case,
                           "GITHUB_EVENT_PATH": str(tmp / "event.json"),
                           "EVENT_NAME": "release", "EVENT_ACTION": "published",
                           "EVENT_REF": ref if ref is not None else "refs/tags/" + tag,
                           "REPOSITORY": REPOSITORY,
                           "REPOSITORY_VISIBILITY": "public",
                           "RELEASE_TAG": tag, "RELEASE_ID": "100",
                           "BACKEND_IMAGE": "ghcr.io/thezenithpassage/catworld-backend",
                           "FRONTEND_IMAGE": "ghcr.io/thezenithpassage/catworld-frontend",
                           "GITHUB_RUN_ID": "28", "GITHUB_RUN_ATTEMPT": "1",
                           "GITHUB_ACTOR": "fixture-publisher",
                           "GH_TOKEN": "disposable-fixture-token"}
            result = subprocess.run(["bash", "-e", "-c", workflow_run(
                "Publish and select validated pair")], cwd=tmp, env=environment,
                text=True, capture_output=True)
            entries = [json.loads(line) for line in trace.read_text(encoding="utf-8").splitlines()] if trace.exists() else []
            selected = [e for e in entries if e[:3] == ["gh", "release", "upload"]]
            record = tmp / "catworld-delivery.json"
            self.assertFalse((tmp / "INJECTED").exists())
            return result, entries, selected, json.loads(record.read_text()) if record.exists() else None

    def test_literal_tag_argv_and_option_termination(self):
        for tag in ('release/v1.2.3', 'v1.2.3+build', '-release',
                    "v'\";$(>INJECTED)`>INJECTED`+build"):
            with self.subTest(tag=tag):
                result, entries, selected, record = self.execute(tag=tag)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(record['tag'], tag)
                self.assertEqual(selected, [['gh', 'release', 'upload', '--repo', REPOSITORY,
                                             '--', tag, 'catworld-delivery.json']])
                lookups = [e for e in entries if e[:2] == ['git', 'rev-parse']]
                self.assertTrue(lookups)
                self.assertTrue(all(e[-1] == 'refs/tags/' + tag + '^{commit}' for e in lookups))

    def test_invalid_identity_or_moved_punctuated_tag_never_uploads(self):
        for tag, ref, failure in [('v..1', None, ''), ('$(touch INJECTED)', None, ''),
                                  ('release/v1+build', 'refs/heads/main', ''),
                                  ('release/v1+build', None, 'moved_tag')]:
            with self.subTest(tag=tag, failure=failure):
                result, entries, selected, record = self.execute(failure, tag, ref)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(selected)
                self.assertIsNone(record)
                if failure != 'moved_tag':
                    self.assertEqual(entries, [])

    def test_operator_download_encodes_one_literal_tag_segment(self):
        from urllib.parse import quote
        documentation = (ROOT / 'docs/OPERATIONS.md').read_text(encoding='utf-8')
        lines = documentation.splitlines()
        assignment = next(line for line in lines if line.startswith('ENCODED_TAG='))
        download = next(line for line in lines if line.startswith('curl ') and '/releases/download/' in line)
        for tag in ('release/v1.2.3', 'v1.2.3+build', '-release', "v'\";$()+#%é"):
            with self.subTest(tag=tag):
                result = subprocess.run(['bash', '-e', '-c',
                                         'curl() { printf "%s\\n" "$@"; };\n' + assignment + '\n' + download],
                                        env={**os.environ, 'RELEASE_TAG': tag}, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout.splitlines(), ['-fL',
                    'https://github.com/TheZenithPassage/catworld/releases/download/' +
                    quote(tag, safe='') + '/catworld-delivery.json', '-o', 'catworld-delivery.json'])

    def test_release_requires_all_producers_before_publishing(self):
        steps = (ROOT / ".github/workflows/release-pair.yml").read_text(encoding="utf-8")
        self.assertLess(steps.index("name: Verify backend"),
                        steps.index("name: Publish and select validated pair"))
        self.assertLess(steps.index("name: Verify frontend"),
                        steps.index("name: Publish and select validated pair"))
        self.assertLess(steps.index("name: Build and exercise ARM64 images"),
                        steps.index("name: Publish and select validated pair"))
        self.assertIn("set -euo pipefail", workflow_run("Publish and select validated pair"))

    def test_success_requires_both_pushed_and_anonymously_pulled(self):
        result, entries, selected, record = self.execute()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(selected), 1)
        self.assertEqual(record["source_sha"], SHA)
        self.assertTrue(record["backend"].endswith("b" * 64))
        self.assertTrue(record["frontend"].endswith("c" * 64))
        upload_index = entries.index(selected[0])
        pushes = [i for i, e in enumerate(entries) if e[:2] == ["docker", "push"]]
        pulls = [i for i, e in enumerate(entries) if e[:2] == ["docker", "pull"]]
        self.assertEqual(len(pushes), 2)
        self.assertEqual(len(pulls), 2)
        self.assertTrue(max(pushes + pulls) < upload_index)

    def test_partial_upload_and_access_failures_never_select_a_pair(self):
        for case in ("moved_tag", "backend_push", "frontend_push",
                     "anonymous_frontend_denied"):
            with self.subTest(case=case):
                result, entries, selected, record = self.execute(case)
                self.assertNotEqual(result.returncode, 0, case)
                self.assertEqual(selected, [], case)
                self.assertIsNone(record, case)

    def test_existing_delivery_asset_is_rejected_before_the_publish_step(self):
        identity = workflow_run("Validate release identity and existing selection")
        workflow = (ROOT / ".github/workflows/release-pair.yml").read_text(encoding="utf-8")
        self.assertIn("catworld-delivery.json", identity)
        self.assertIn('releases/$RELEASE_ID/assets', identity)
        self.assertIn("exit 1", identity)
        self.assertLess(workflow.index("name: Validate release identity and existing selection"),
                        workflow.index("name: Publish and select validated pair"))

    def test_second_push_interruption_retains_no_selected_record(self):
        result, entries, selected, record = self.execute("frontend_push")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual([e[1] for e in entries if e[:2] == ["docker", "push"]],
                         ["push", "push"])
        self.assertFalse(selected)
        self.assertIsNone(record)


if __name__ == "__main__":
    unittest.main()
