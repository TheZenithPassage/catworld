#!/usr/bin/env python3
"""Build and operate the isolated CatWorld demo on Windows Docker Desktop."""

import argparse
import base64
from contextlib import contextmanager, redirect_stderr, redirect_stdout
from datetime import UTC, datetime, timedelta
from getpass import getpass
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tarfile
import tempfile
import time

from seed import DemoApi, HOUSEHOLDS, SeedError


ROOT = Path(__file__).resolve().parents[2]
PROJECT = "catworld-demo"
TASK = "CatWorldDemoHourlyReset"
URL = "http://127.0.0.1:4210"
DOCKER = ("docker", "--context", "desktop-linux")
APP_SERVICES = {"app", "frontend"}
SHA = re.compile(r"[0-9a-f]{40}")
MYSQL = 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot'
REVISION_LABEL = "org.opencontainers.image.revision"
RECOVERY_MARKER = "recovery-revision"


class DemoError(Exception):
    pass


def run(*args, capture=False, **kwargs):
    if sys.executable.lower().endswith("pythonw.exe"):
        kwargs.setdefault("creationflags", subprocess.CREATE_NO_WINDOW)
        if not capture:
            kwargs.setdefault("stdout", sys.stdout)
            kwargs.setdefault("stderr", sys.stderr)
    result = subprocess.run(args, cwd=ROOT, check=True, capture_output=capture, **kwargs)
    return result.stdout.decode("utf-8").strip() if capture else None


def atomic_write(path, value):
    partial = path.with_suffix(".partial")
    partial.write_text(value, encoding="utf-8")
    partial.replace(path)


@contextmanager
def lock(directory):
    import msvcrt

    with (directory / "operations.lock").open("a+b") as handle:
        handle.seek(0)
        try:
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError as error:
            raise DemoError("Another demo operation is running. Try again when it finishes.") from error
        yield


def initialize(directory):
    settings = directory / "demo.env"
    if not settings.exists():
        password = secrets.token_urlsafe()
        basic = base64.b64encode(f"demo:{password}".encode()).decode()
        atomic_write(settings, (
            f"CATWORLD_DEMO_DB_PASSWORD={secrets.token_urlsafe()}\n"
            f"CATWORLD_DEMO_DB_ROOT_PASSWORD={secrets.token_urlsafe()}\n"
            f"CATWORLD_DEMO_APP_PASSWORD={password}\n"
            f"CATWORLD_DEMO_BASIC={basic}\n"
        ))


def image_tag(service, revision):
    return f"{PROJECT}-{service}:{revision}"


def verify_image(service, revision):
    tag = image_tag(service, revision)
    try:
        label = run(*DOCKER, "image", "inspect", "--format",
                    f'{{{{ index .Config.Labels "{REVISION_LABEL}" }}}}', tag, capture=True)
    except subprocess.CalledProcessError as error:
        raise DemoError(f"Local image {tag} is unavailable. Build the selected pair first.") from error
    if label != revision:
        raise DemoError(f"Image {tag} has an unexpected source revision label.")


def require_main_revision(sha):
    try:
        run("git", "merge-base", "--is-ancestor", sha, "origin/main")
    except subprocess.CalledProcessError as error:
        raise DemoError("Select a validated revision on origin/main. Run git fetch origin first.") from error


def build(revision):
    sha = run("git", "rev-parse", "--verify", "--end-of-options", f"{revision}^{{commit}}", capture=True)
    if not SHA.fullmatch(sha):
        raise DemoError("Git did not resolve a full source revision.")
    require_main_revision(sha)

    with tempfile.TemporaryDirectory(prefix="catworld-demo-") as temporary:
        archive_path = Path(temporary) / "source.tar"
        archive_root = Path(temporary) / "checkout"
        run("git", "archive", "--format=tar", "-o", str(archive_path), sha)
        with tarfile.open(archive_path) as archive:
            archive.extractall(archive_root, filter="data")
        for service, source in (("backend", archive_root), ("frontend", archive_root / "frontend")):
            run(*DOCKER, "build", "--tag", image_tag(service, sha),
                "--build-arg", "SOURCE_REPOSITORY=TheZenithPassage/catworld",
                "--build-arg", f"SOURCE_SHA={sha}", "--build-arg", f"RELEASE_TAG={sha}", str(source))
            verify_image(service, sha)
    print(f"Built demo image pair {sha}.")


class Demo:
    def __init__(self, directory, revision):
        self.directory = directory
        self.revision = revision
        token_file = directory / "tunnel-token"
        self.token = token_file.read_text(encoding="utf-8").strip() if token_file.exists() else ""
        self.env = {key: value for key, value in os.environ.items()
                    if not key.upper().startswith(("COMPOSE_", "CATWORLD_DEMO_"))}
        self.env.update({
            "CATWORLD_DEMO_REVISION": revision or "pending",
            "CATWORLD_DEMO_TUNNEL_TOKEN": self.token,
        })

    def compose(self, *args, **kwargs):
        return run(*DOCKER, "compose", "--project-name", PROJECT, "--profile", "public",
                   "--env-file", str(self.directory / "demo.env"),
                   "-f", str(ROOT / "compose.demo.yml"), *args, env=self.env, **kwargs)

    def running(self):
        return set(self.compose("ps", "--status", "running", "--services", capture=True).split())

    def ensure_db(self):
        self.compose("up", "--detach", "--no-build", "--wait", "--wait-timeout", "120", "db")

    def stop_ingress(self):
        self.compose("stop", "tunnel")
        self.compose("stop", "frontend")

    def stop_app(self):
        container = self.compose("ps", "--status", "running", "-q", "app", capture=True)
        if container:
            self.compose("stop", "app")
            exit_code = run(*DOCKER, "inspect", "--format", "{{.State.ExitCode}}", container, capture=True)
            if exit_code == "137":
                raise DemoError("The API did not stop gracefully. The demo schema was preserved.")

    def sql(self, query, *, capture=False):
        return self.compose("exec", "-T", "db", "sh", "-c", MYSQL + ' --batch --skip-column-names -e "$1"',
                            "mysql", query, capture=capture)

    def changed_since(self, threshold, *, include_uncertain=False):
        activity = f"last_changed_at >= TIMESTAMP('{threshold}')"
        if include_uncertain:
            activity += " OR pending_writes > 0"
        result = self.sql("SELECT COUNT(*) FROM catworld_demo.demo_activity "
                          f"WHERE id = 1 AND ({activity})", capture=True)
        return result == "1"

    def clear_activity(self):
        self.sql("UPDATE catworld_demo.demo_activity SET last_changed_at = NULL WHERE id = 1")

    def clear_schema(self):
        self.sql("DROP DATABASE IF EXISTS catworld_demo; "
                 "CREATE DATABASE catworld_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")

    def backup(self):
        marker = self.directory / RECOVERY_MARKER
        if marker.exists():
            raise DemoError("A demo recovery is pending. Run recover before replacing the workspace.")
        partial = self.directory / "recovery.partial"
        with partial.open("wb") as dump:
            self.compose("exec", "-T", "db", "sh", "-c",
                         'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction '
                         "--hex-blob --routines --triggers --no-tablespaces --add-drop-database --databases catworld_demo",
                         stdout=dump)
        if partial.stat().st_size == 0:
            raise DemoError("The database dump is empty. The demo schema was preserved.")
        partial.replace(self.directory / "recovery.sql")
        atomic_write(marker, self.revision + "\n")

    def restore(self):
        with (self.directory / "recovery.sql").open("rb") as dump:
            self.compose("exec", "-T", "db", "sh", "-c", MYSQL, stdin=dump)

    def finish_recovery(self):
        (self.directory / RECOVERY_MARKER).unlink()

    def start_application(self):
        self.compose("up", "--detach", "--no-build", "--pull", "never", "app", "frontend")

    def wait_ready(self):
        deadline = time.monotonic() + 120
        while True:
            try:
                if isinstance(DemoApi(URL).json("GET", "/owners"), list):
                    return
            except (SeedError, ValueError):
                pass
            if time.monotonic() >= deadline:
                raise DemoError(f"The demo API did not become ready at {URL}.")
            time.sleep(2)

    def seed(self):
        self.wait_ready()
        run(sys.executable, str(ROOT / "scripts" / "demo" / "seed.py"), "--url", URL, env=self.env)
        try:
            owners = DemoApi(URL).json("GET", "/owners")
            if not isinstance(owners, list) or len(owners) != len(HOUSEHOLDS):
                raise DemoError("The demo owner fixtures could not be verified.")
        except (SeedError, ValueError) as error:
            raise DemoError("The seeded demo could not be verified.") from error

    def remember(self):
        atomic_write(self.directory / "revision", self.revision + "\n")

    def publish(self):
        if not self.token:
            raise DemoError("A demo tunnel token is required to publish. Run the token command first.")
        try:
            self.compose("up", "--detach", "--no-deps", "--no-build", "tunnel")
        except (OSError, subprocess.CalledProcessError) as error:
            raise DemoError("The local demo is ready. The tunnel did not start. Run publish to retry.") from error


def previous_hour_start():
    now = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
    return (now - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")


def replace_workspace(target, previous, running, *, publish, threshold=None):
    replacing_schema = False
    try:
        target.stop_ingress()
        target.stop_app()
        if "db" not in running:
            target.ensure_db()
        if threshold is not None and target.changed_since(threshold, include_uncertain=True):
            target.start_application()
            target.wait_ready()
        else:
            if previous:
                previous.backup()
            replacing_schema = True
            target.clear_schema()
            target.start_application()
            target.seed()
            target.clear_activity()
            target.remember()
            if previous:
                target.finish_recovery()
    except (OSError, subprocess.CalledProcessError, DemoError, KeyboardInterrupt) as error:
        try:
            target.stop_ingress()
            target.stop_app()
            if previous and replacing_schema:
                previous.restore()
                previous.remember()
            if previous and APP_SERVICES <= running:
                previous.start_application()
                previous.wait_ready()
                print("Restored the previously running demo.", file=sys.stderr)
            if previous and replacing_schema:
                previous.finish_recovery()
        except (OSError, subprocess.CalledProcessError, DemoError) as recovery_error:
            raise DemoError(f"Replacement failed ({error}). Recovery failed ({recovery_error}).") from recovery_error
        if previous and APP_SERVICES <= running and "tunnel" in running:
            previous.publish()
        raise
    if publish:
        target.publish()
    return replacing_schema


def recover(demo):
    verify_image("backend", demo.revision)
    verify_image("frontend", demo.revision)
    demo.stop_ingress()
    demo.stop_app()
    demo.ensure_db()
    demo.restore()
    demo.start_application()
    demo.wait_ready()
    demo.remember()
    demo.finish_recovery()
    print(f"Recovered demo {demo.revision} at {URL}.")


def reset(demo, revision, *, hourly):
    running = demo.running()
    if not revision or not {"db", *APP_SERVICES} <= running:
        if hourly:
            return
        raise DemoError("The demo must be running before it can be reset.")
    threshold = previous_hour_start() if hourly else None
    if threshold is not None and demo.changed_since(threshold):
        return
    if replace_workspace(demo, demo, running, publish="tunnel" in running, threshold=threshold):
        print("Demo workspace seeded.")


def install_task():
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    if not pythonw.exists():
        raise DemoError("Install Python with pythonw.exe to schedule background resets.")
    action = subprocess.list2cmdline([str(pythonw), str(Path(__file__).resolve()), "hourly-reset"])
    run("schtasks", "/Create", "/TN", TASK, "/SC", "HOURLY", "/MO", "1", "/ST", "00:00",
        "/TR", action, "/IT", "/F")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("build", help="Build the pair from a validated origin/main revision").add_argument("revision")
    start = commands.add_parser("start", help="Seed and start a locally built image pair")
    start.add_argument("revision", help="Full source SHA of both local images")
    start.add_argument("--local-only", action="store_true", help="Keep the Cloudflare Tunnel stopped")
    commands.add_parser("token", help="Save the dedicated Cloudflare Tunnel token interactively")
    commands.add_parser("publish", help="Start the dedicated tunnel for the running demo")
    commands.add_parser("recover", help="Restore a pending snapshot and start the previous demo locally")
    commands.add_parser("stop", help="Stop the demo services and keep the volume")
    commands.add_parser("status", help="Show the selected source revision and services")
    commands.add_parser("reset", help="Reset the running demo immediately")
    commands.add_parser("hourly-reset", help="Reset a running demo after an hour with no successful changes")
    commands.add_parser("install-hourly", help="Install the Windows hourly reset task")
    return parser.parse_args()


def operate(args, directory):
    if args.command == "build":
        build(args.revision)
        return
    if args.command == "install-hourly":
        install_task()
        return
    with lock(directory):
        if args.command == "token":
            token = getpass("Dedicated demo tunnel token: ").strip()
            if not re.fullmatch(r"[A-Za-z0-9_+/=-]+", token):
                raise DemoError("Enter a Cloudflare Tunnel token without spaces.")
            atomic_write(directory / "tunnel-token", token + "\n")
            print("Stored the demo tunnel token locally.")
            return
        revision_file = directory / "revision"
        revision = revision_file.read_text(encoding="utf-8").strip() if revision_file.exists() else None
        marker = directory / RECOVERY_MARKER
        recovery_revision = marker.read_text(encoding="utf-8").strip() if marker.exists() else None
        if recovery_revision is not None and args.command in {"start", "reset", "hourly-reset", "publish"}:
            raise DemoError("A demo recovery is pending. Run recover before replacing or publishing the workspace.")
        if args.command == "hourly-reset" and not revision:
            return
        initialize(directory)
        demo = Demo(directory, revision)
        if args.command == "start":
            if not SHA.fullmatch(args.revision):
                raise DemoError("Select the full SHA of a locally built application pair.")
            target = Demo(directory, args.revision)
            if not args.local_only:
                if not target.token:
                    raise DemoError("Save the dedicated tunnel token, or start with --local-only.")
                require_main_revision(args.revision)
            verify_image("backend", args.revision)
            verify_image("frontend", args.revision)
            replace_workspace(target, demo if revision else None, demo.running(), publish=not args.local_only)
            print(f"Seeded demo {args.revision} at {URL}.")
        elif args.command == "recover":
            if recovery_revision is None:
                raise DemoError("There is no pending demo recovery.")
            if not SHA.fullmatch(recovery_revision):
                raise DemoError("The pending recovery revision is invalid. Preserve the recovery files.")
            recover(Demo(directory, recovery_revision))
        elif args.command == "publish":
            if not revision or not {"db", *APP_SERVICES} <= demo.running():
                raise DemoError("Start and seed the demo locally before publishing.")
            require_main_revision(revision)
            demo.wait_ready()
            demo.publish()
        elif args.command == "stop":
            demo.stop_ingress()
            demo.stop_app()
            demo.compose("stop", "db")
        elif args.command == "status":
            print(f"Selected revision: {revision or 'none'}", flush=True)
            if recovery_revision is not None:
                print("A demo recovery is pending. Run recover to restore the previous snapshot.", flush=True)
            demo.compose("ps", "--all")
        else:
            reset(demo, revision, hourly=args.command == "hourly-reset")


def main():
    args = parse_args()
    directory = Path(os.environ["LOCALAPPDATA"]) / "CatWorldDemo"
    directory.mkdir(exist_ok=True)
    try:
        operate(args, directory)
    except (DemoError, OSError, subprocess.CalledProcessError, KeyboardInterrupt) as error:
        print(f"Demo operation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    if sys.executable.lower().endswith("pythonw.exe"):
        log_path = Path(os.environ["LOCALAPPDATA"]) / "CatWorldDemo" / "hourly-reset.log"
        log_path.parent.mkdir(exist_ok=True)
        with log_path.open("w", encoding="utf-8") as log, redirect_stdout(log), redirect_stderr(log):
            sys.exit(main())
    sys.exit(main())
