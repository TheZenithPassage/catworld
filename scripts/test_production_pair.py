import json
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from production_pair import parse_delivery, assert_compose, verify_pulled_image, prepare, ensure_database_image, REPO


SOURCE = "a" * 40
D1 = "sha256:" + "b" * 64
D2 = "sha256:" + "c" * 64


def sample():
    return {"schema": 1, "repository": REPO, "release_id": 10,
            "tag": "v1.2.0", "prerelease": False, "source_sha": SOURCE,
            "backend": "ghcr.io/thezenithpassage/catworld-backend@" + D1,
            "frontend": "ghcr.io/thezenithpassage/catworld-frontend@" + D2,
            "workflow_run": 15, "workflow_attempt": 1}


class ReleasePairConsumptionTest(unittest.TestCase):
    def test_exact_pair_accepted(self):
        self.assertEqual(parse_delivery(sample(), "v1.2.0", SOURCE), sample())

    def test_unusable_or_mismatched_pairs_fail_closed(self):
        for key, bad in [
            ("repository", "other/repo"),
            ("source_sha", "e" * 40),
            ("backend", "ghcr.io/other/catworld-backend@" + D1),
            ("frontend", "ghcr.io/thezenithpassage/catworld-frontend:latest"),
            ("prerelease", True),
            ("schema", 2),
            ("workflow_run", 0),
            ("release_id", -1),
        ]:
            with self.subTest(key=key):
                record = {**sample(), key: bad}
                with self.assertRaises(ValueError):
                    parse_delivery(record, "v1.2.0", SOURCE)
        with self.assertRaises(ValueError):
            parse_delivery(sample(), "v1.1.0", SOURCE)
        with self.assertRaises(ValueError):
            parse_delivery({**sample(), "unknown": "x"}, "v1.2.0", SOURCE)

    def test_compose_rejects_builds_and_unpinned_images(self):
        record = sample()
        services = {"db": {"image": "mysql:8.0", "volumes": [{"type": "volume"}]},
                    "app": {"image": record["backend"]},
                    "frontend": {"image": record["frontend"],
                                 "ports": [{"target": 80, "host_ip": "127.0.0.1"}]}}
        def runner(argv, **kwargs):
            self.assertEqual(kwargs["env"]["BACKEND_IMAGE"], record["backend"])
            return SimpleNamespace(stdout=json.dumps({"services": services}))
        assert_compose("compose.prod.yml", ".env.production", "test", record, run_command=runner)
        for service, change in (("app", {"build": "."}),
                                ("app", {"image": "catworld:latest"}),
                                ("db", {"ports": [{"target": 3306}]}),
                                ("frontend", {"ports": [{"target": 80, "host_ip": "0.0.0.0"}]})):
            with self.subTest(service=service, change=change):
                alt = {k: dict(v) for k, v in services.items()}
                alt[service].update(change)
                with self.assertRaises(ValueError):
                    assert_compose("compose.prod.yml", ".env.production", "test", record,
                                   run_command=lambda *a, **kw: SimpleNamespace(stdout=json.dumps({"services": alt})))

    def test_image_identity_and_architecture(self):
        record = sample()
        details = {"Architecture": "arm64", "RepoDigests": [record["backend"]],
                   "Config": {"Labels": {
                       "org.opencontainers.image.source": "https://github.com/" + REPO,
                       "org.opencontainers.image.revision": SOURCE,
                       "org.opencontainers.image.version": "v1.2.0"}}}
        def inspector(*args, **kwargs):
            return SimpleNamespace(stdout=json.dumps(details))
        verify_pulled_image(record["backend"], record, run_command=inspector)
        for change in ({"Architecture": "amd64"}, {"RepoDigests": []},
                       {"Config": {"Labels": {}}}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                verify_pulled_image(record["backend"], record,
                                    run_command=lambda *a, **kw: SimpleNamespace(
                                        stdout=json.dumps({**details, **change})))

    def test_database_image_is_reused_or_bootstrapped_only_when_missing(self):
        for existing_id in ("sha256:already-present\\n", ""):
            with self.subTest(existing=bool(existing_id)):
                calls = []

                def fake_run(command, **kwargs):
                    calls.append(command)
                    if command[:3] == ["docker", "image", "ls"]:
                        self.assertIn("reference=mysql:8.0", command)
                        self.assertTrue(kwargs.get("capture"))
                        return SimpleNamespace(stdout=existing_id)
                    if command == ["docker", "pull", "mysql:8.0"]:
                        return SimpleNamespace(stdout="")
                    self.fail(f"Unexpected Docker call: {command}")

                ensure_database_image(run_command=fake_run)
                mysql_pulls = [cmd for cmd in calls if cmd == ["docker", "pull", "mysql:8.0"]]
                self.assertEqual(len(mysql_pulls), 0 if existing_id else 1)

    def test_database_image_inspection_error_never_triggers_a_pull(self):
        calls = []

        def unavailable_daemon(command, **kwargs):
            calls.append(command)
            raise subprocess.CalledProcessError(
                1, command, stderr="Cannot connect to the Docker daemon")

        with self.assertRaises(subprocess.CalledProcessError):
            ensure_database_image(run_command=unavailable_daemon)
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][:3], ["docker", "image", "ls"])

    def test_linux_runbook_shell_examples_are_valid(self):
        documentation = (Path(__file__).resolve().parents[1] / "docs/OPERATIONS.md").read_text()
        bash_blocks = re.findall(r"```bash\\n(.*?)```", documentation, re.DOTALL)
        self.assertGreaterEqual(len(bash_blocks), 5)
        for index, block in enumerate(bash_blocks):
            with self.subTest(block=index):
                validation = subprocess.run(
                    ["bash", "-n"], input=block, text=True, capture_output=True)
                self.assertEqual(validation.returncode, 0, validation.stderr)
        self.assertNotIn("New-Item", documentation)
        self.assertNotIn("Get-Date", documentation)
        self.assertIn("catworld-delivery.json", bash_blocks[0])

    def test_failed_pull_prevents_compose_up(self):
        record = sample()
        with tempfile.TemporaryDirectory() as folder:
            place = Path(folder)
            (place / "delivery.json").write_text(json.dumps(record))
            (place / ".env.production").write_text("DB_NAME=test\n")
            args = SimpleNamespace(delivery=str(place / "delivery.json"),
                                   tag="v1.2.0", source=SOURCE,
                                   env_file=str(place / ".env.production"),
                                   compose="compose.prod.yml", project="test", deploy=True)
            calls = []
            def simulated(command, **kwargs):
                calls.append(command)
                if command[-1] == record["frontend"] and command[:2] == ["docker", "pull"]:
                    raise RuntimeError("second image unavailable")
                if command[-2:] == ["--format", "json"]:
                    services = {"db": {"volumes": [1]}, "app": {"image": record["backend"]},
                                "frontend": {"image": record["frontend"],
                                             "ports": [{"target": 80, "host_ip": "127.0.0.1"}]}}
                    return SimpleNamespace(stdout=json.dumps({"services": services}))
                if command[:3] == ["docker", "image", "inspect"]:
                    return SimpleNamespace(stdout=json.dumps({
                        "Architecture": "arm64", "RepoDigests": [record["backend"]],
                        "Config": {"Labels": {
                            "org.opencontainers.image.source": "https://github.com/" + REPO,
                            "org.opencontainers.image.revision": SOURCE,
                            "org.opencontainers.image.version": "v1.2.0"}}}))
                return SimpleNamespace(stdout="")
            with self.assertRaises(RuntimeError):
                prepare(args, run_command=simulated)
            self.assertFalse(any("up" in command for command in calls))


if __name__ == "__main__":
    unittest.main()
