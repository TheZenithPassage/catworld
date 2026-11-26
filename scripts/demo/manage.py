#!/usr/bin/env python3
"""Build and operate the isolated CatWorld demo on Windows Docker Desktop."""

import argparse
import base64
from contextlib import contextmanager, redirect_stderr, redirect_stdout
from datetime import UTC, date, datetime, timedelta
from getpass import getpass
import json
import os
from pathlib import Path
import re
import runpy
import secrets
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
from urllib.error import URLError
from urllib.request import build_opener, HTTPRedirectHandler, ProxyHandler, Request


ROOT = Path(__file__).resolve().parents[2]
PROJECT = "catworld-demo"
TASK = "CatWorldDemoHourlyReset"
BUSINESS_ZONE = "America/Argentina/Buenos_Aires"
SCHEDULE_ZONE = "Europe/Madrid"
DOCKER = ("docker", "--context", "desktop-linux")
APP_SERVICES = {"app", "frontend"}
SHA = re.compile(r"[0-9a-f]{40}")
MYSQL = 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --default-character-set=utf8mb4'
DUMP = 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --default-character-set=utf8mb4'
GENERATION = "X-CatWorld-Demo-Generation"
RESET_TABLES = ("demo_reset_state", "demo_reset_ip_usage")
REVISION_LABEL = "org.opencontainers.image.revision"
RECOVERY_MARKER = "recovery-revision"


class DemoError(Exception):
    pass


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


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
    def __init__(self, directory, revision, *, project=PROJECT, port=4210, working_tree_seed=False):
        self.directory = directory
        self.revision = revision
        self.project = project
        self.port = port
        self.working_tree_seed = working_tree_seed
        self.public = project == PROJECT
        self._proxy_port = None
        token_file = directory / "tunnel-token"
        self.token = token_file.read_text(encoding="utf-8").strip() if self.public and token_file.exists() else ""
        self.env = {key: value for key, value in os.environ.items()
                    if not key.upper().startswith(("COMPOSE_", "CATWORLD_DEMO_"))}
        self.env.update({
            "CATWORLD_DEMO_REVISION": revision or "pending",
            "CATWORLD_DEMO_TUNNEL_TOKEN": self.token,
            "CATWORLD_DEMO_PORT": str(port),
        })

    @property
    def proxy_port(self):
        if self._proxy_port is None:
            tag = image_tag("frontend", self.revision)
            if self.revision:
                ports = run(*DOCKER, "image", "inspect", "--format", "{{json .Config.ExposedPorts}}",
                            tag, capture=True)
                self._proxy_port = 8081 if "8081/tcp" in (json.loads(ports) or {}) else 80
            else:
                self._proxy_port = 8081
        return self._proxy_port

    @property
    def modern(self):
        return self.proxy_port == 8081

    @property
    def url(self):
        if self.port == 0:
            address = self.compose("port", "frontend", str(self.proxy_port), capture=True)
            host, _, port = address.rpartition(":")
            if host != "127.0.0.1" or not port.isdecimal() or port == "0":
                raise DemoError("The staging gateway was not published on a loopback port.")
            self.port = int(port)
        return f"http://127.0.0.1:{self.port}"

    def compose(self, *args, **kwargs):
        profile = ("--profile", "public") if self.public else ()
        # Only running the frontend requires the revision-specific published container port.
        if args[0] == "up" and "frontend" in args:
            self.env["CATWORLD_DEMO_PROXY_PORT"] = str(self.proxy_port)
        return run(*DOCKER, "compose", "--project-name", self.project, *profile,
                   "--env-file", str(self.directory / "demo.env"),
                   "-f", str(ROOT / "compose.demo.yml"), *args, env=self.env, **kwargs)

    def running(self):
        return set(self.compose("ps", "--status", "running", "--services", capture=True).split())

    def ensure_db(self):
        self.compose("up", "--detach", "--no-build", "--wait", "--wait-timeout", "120", "db")

    def stop_ingress(self):
        if self.public:
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
        return self.compose("exec", "-T", "db", "sh", "-c",
                            MYSQL + ' --database=catworld_demo --batch --skip-column-names -e "$1"',
                            "mysql", query, capture=capture)

    def activity(self):
        modern_columns = "baseline_date, photo_uploads >= 32" if self.modern else "NULL, 0"
        result = self.sql("SELECT last_changed_at, pending_writes, " + modern_columns +
                          " FROM catworld_demo.demo_activity WHERE id=1", capture=True)
        changed, pending, baseline, photos_exhausted = result.split("\t")
        return (None if changed == "NULL" else datetime.fromisoformat(changed).replace(tzinfo=UTC),
                int(pending), None if baseline == "NULL" else date.fromisoformat(baseline),
                photos_exhausted == "1")

    def local_time(self, now, zone):
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
        result = self.sql(f"SELECT CONVERT_TZ('{timestamp}', '+00:00', '{zone}')", capture=True)
        if result == "NULL":
            raise DemoError(f"MySQL time zone data for {zone} is unavailable.")
        return datetime.fromisoformat(result)

    def queue(self):
        return self.sql("SELECT COALESCE(DATE_FORMAT(queued_at, '%Y-%m-%d %H:%i:%s.%f'), '') "
                        "FROM catworld_demo.demo_reset_state WHERE id=1", capture=True) if self.modern else ""

    def clear_queue(self):
        if self.modern:
            self.sql("UPDATE catworld_demo.demo_reset_state SET queued_at=NULL WHERE id=1")

    def reset_quota(self):
        if not self.modern:
            raise DemoError("The running demo revision does not support public reset quotas.")
        self.sql("START TRANSACTION; UPDATE catworld_demo.demo_reset_state SET accepted_count=0 WHERE id=1; "
                 "DELETE FROM catworld_demo.demo_reset_ip_usage; COMMIT")

    def import_sql(self, source, *, select_database=False):
        command = MYSQL + " --database=catworld_demo" if select_database else MYSQL
        with source.open("rb") as sql:
            self.compose("exec", "-T", "db", "sh", "-c", command, stdin=sql)

    def dump_database(self, path):
        with path.open("wb") as dump:
            self.compose("exec", "-T", "db", "sh", "-c", DUMP + " --single-transaction "
                         "--hex-blob --routines --triggers --no-tablespaces --set-gtid-purged=OFF "
                         "--add-drop-database --databases catworld_demo", stdout=dump)
        if path.stat().st_size == 0:
            raise DemoError("The database dump is empty. The demo schema was preserved.")

    def domain_tables(self):
        names = self.sql("SELECT TABLE_NAME FROM information_schema.TABLES "
                         "WHERE TABLE_SCHEMA='catworld_demo' AND TABLE_TYPE='BASE TABLE' "
                         "AND TABLE_NAME <> 'flyway_schema_history' "
                         "AND LEFT(TABLE_NAME, 5) <> 'demo_' ORDER BY TABLE_NAME", capture=True).splitlines()
        if not names or not all(re.fullmatch(r"[a-z0-9_]+", name) for name in names):
            raise DemoError("The demo domain tables could not be identified.")
        return names

    def dump_rows(self, path, tables):
        with path.open("wb") as dump:
            self.compose("exec", "-T", "db", "sh", "-c", DUMP + " --single-transaction --compact "
                         "--no-create-info --skip-triggers --no-tablespaces --set-gtid-purged=OFF "
                         '--complete-insert --hex-blob catworld_demo "$@"', "mysqldump", *tables, stdout=dump)

    def replace_rows(self, path, tables, *, baseline_date=None):
        with tempfile.TemporaryFile() as transaction, path.open("rb") as data:
            transaction.write(b"USE catworld_demo;\nSET FOREIGN_KEY_CHECKS=0;\nSTART TRANSACTION;\n")
            for table in tables:
                transaction.write(f"DELETE FROM `{table}`;\n".encode("ascii"))
            shutil.copyfileobj(data, transaction)
            if baseline_date is not None:
                transaction.write(("\nUPDATE demo_activity SET generation=UUID(), pending_writes=0, "
                                   "last_changed_at=NULL, photo_uploads=0, "
                                   f"baseline_date='{baseline_date}' WHERE id=1;\n").encode("ascii"))
            transaction.write(b"\nCOMMIT;\nSET FOREIGN_KEY_CHECKS=1;\n")
            transaction.seek(0)
            self.compose("exec", "-T", "db", "sh", "-c", MYSQL, stdin=transaction)

    def baseline_path(self, baseline_date):
        return self.directory / f"baseline-{self.revision}-{baseline_date}.sql"

    def generation(self):
        return self.sql("SELECT generation FROM catworld_demo.demo_activity WHERE id=1", capture=True)

    def backup(self):
        marker = self.directory / RECOVERY_MARKER
        if marker.exists():
            raise DemoError("A demo recovery is pending. Run recover before replacing the workspace.")
        partial = self.directory / "recovery.partial"
        self.dump_database(partial)
        partial.replace(self.directory / "recovery.sql")
        atomic_write(marker, self.revision + "\n")

    def restore(self):
        self.import_sql(self.directory / "recovery.sql")

    def finish_recovery(self):
        (self.directory / RECOVERY_MARKER).unlink()

    def start_application(self):
        self.compose("up", "--detach", "--no-build", "--pull", "never", "app", "frontend")

    def wait_ready(self, generation=None):
        opener = build_opener(ProxyHandler({}), NoRedirects())
        request = Request(self.url + "/api/auth/login", method="POST", headers={"Authorization": "Demo"})
        deadline = time.monotonic() + 120
        while True:
            try:
                with opener.open(request, timeout=5) as response:
                    user = json.load(response)
                    ready_generation = response.headers.get(GENERATION)
                if (isinstance(user, dict) and user.get("username") == "demo" and user.get("role") == "ADMIN"
                        and ready_generation
                        and (generation is None or ready_generation == generation)):
                    return ready_generation
            except (URLError, ConnectionError, ValueError):
                pass
            if time.monotonic() >= deadline:
                raise DemoError(f"The demo API did not become ready at {self.url}.")
            time.sleep(2)

    def remember(self):
        atomic_write(self.directory / "revision", self.revision + "\n")

    def publish(self):
        if not self.token:
            raise DemoError("A demo tunnel token is required to publish. Run the token command first.")
        try:
            self.compose("up", "--detach", "--no-deps", "--no-build", "tunnel")
        except (OSError, subprocess.CalledProcessError) as error:
            raise DemoError("The local demo is ready. The tunnel did not start. Run publish to retry.") from error


@contextmanager
def fixture_source(demo):
    source = Path("scripts/demo/seed.py")
    if demo.working_tree_seed:
        yield ROOT / source
        return
    with tempfile.TemporaryDirectory(prefix="catworld-demo-fixtures-") as temporary:
        root = Path(temporary)
        archive_path = root / "fixtures.tar"
        run("git", "archive", "--format=tar", "-o", str(archive_path), demo.revision, "--", source.parent.as_posix())
        with tarfile.open(archive_path) as archive:
            archive.extractall(root, filter="data")
        yield root / source


def prepare_baseline(demo, baseline_date=None, *, full_path=None):
    stage = Demo(demo.directory, demo.revision, project=f"{demo.project}-baseline", port=0)
    stage.compose("down", "--volumes", "--remove-orphans")
    try:
        stage.ensure_db()
        stage.start_application()
        stage.wait_ready()
        with fixture_source(demo) as source:
            if not demo.modern:
                run(sys.executable, str(source), "--url", stage.url)
                stage.stop_app()
                stage.sql("UPDATE catworld_demo.demo_activity "
                          "SET generation=UUID(), pending_writes=0, last_changed_at=NULL WHERE id=1")
            else:
                baseline_date = baseline_date or stage.local_time(datetime.now(UTC), BUSINESS_ZONE).date()
                with tempfile.TemporaryDirectory(dir=demo.directory) as temporary:
                    generated = Path(temporary) / "fixtures.sql"
                    run(sys.executable, str(source), "--date", str(baseline_date), "--output", str(generated))
                    stage.import_sql(generated, select_database=True)
                    sys.path.insert(0, str(source.parent))
                    try:
                        contract = runpy.run_path(str(source))
                    finally:
                        sys.path.pop(0)
                    query = contract["SEED_STATUS_QUERY"]
                    expected = "\t".join(map(str, contract["SEED_STATUS_COUNTS"]))
                    if stage.sql(query, capture=True) != expected:
                        raise DemoError("The staged fixtures did not match the expected demo data.")
                    path = demo.baseline_path(baseline_date)
                    partial = Path(temporary) / "baseline.sql"
                    domain = stage.domain_tables()
                    stage.dump_rows(partial, domain)
                    if partial.stat().st_size == 0:
                        raise DemoError("The staged baseline dump is empty.")
                    stage.replace_rows(partial, domain, baseline_date=baseline_date)
                    if stage.sql(query, capture=True) != expected:
                        raise DemoError("The staged baseline failed verification after restoration.")
                    stage.wait_ready(stage.generation())
                    if full_path is not None:
                        stage.dump_database(full_path)
                    partial.replace(path)
                print(f"Prepared demo baseline {baseline_date} for {demo.revision}.")
                return path
        stage.dump_database(full_path)
    finally:
        stage.compose("down", "--volumes", "--remove-orphans")


def scheduled_baseline(madrid, active_date):
    today = madrid.date()
    preparing = today if today.weekday() in {0, 3} and madrid.hour == 4 and active_date != today else None
    latest = today if madrid.hour >= 5 else today - timedelta(days=1)
    while latest.weekday() not in {0, 3}:
        latest -= timedelta(days=1)
    return preparing, latest if active_date is None or latest > active_date else None


def recent_activity(activity, threshold):
    changed, pending, _, _ = activity
    return pending > 0 or (changed is not None and changed >= threshold)


def dirty(activity):
    changed, pending, _, photos_exhausted = activity
    return changed is not None or pending > 0 or photos_exhausted


def replace_workspace(target, previous, running, *, publish, baseline_date=None, full_path=None, threshold=None):
    replacing_data = False
    try:
        target.stop_ingress()
        target.stop_app()
        if "db" not in running:
            target.ensure_db()
        if threshold is not None and recent_activity(target.activity(), threshold):
            target.start_application()
            target.wait_ready()
        else:
            if previous:
                previous.backup()
            if full_path is None:
                tables = target.domain_tables()
                replacing_data = True
                target.replace_rows(target.baseline_path(baseline_date), tables, baseline_date=baseline_date)
            else:
                with tempfile.TemporaryDirectory(dir=target.directory) as temporary:
                    reset_state = Path(temporary) / "reset-state.sql"
                    if previous and target.modern and previous.modern:
                        previous.dump_rows(reset_state, RESET_TABLES)
                    replacing_data = True
                    target.import_sql(full_path)
                    if reset_state.exists():
                        target.replace_rows(reset_state, RESET_TABLES)
            generation = target.generation()
            target.start_application()
            target.wait_ready(generation)
            target.clear_queue()
            target.remember()
            if previous:
                target.finish_recovery()
    except (OSError, subprocess.CalledProcessError, DemoError, KeyboardInterrupt) as error:
        try:
            target.stop_ingress()
            target.stop_app()
            if previous and replacing_data:
                previous.restore()
                previous.remember()
            if previous and APP_SERVICES <= running:
                previous.start_application()
                previous.wait_ready()
                print("Restored the previously running demo.", file=sys.stderr)
            if previous and (previous.directory / RECOVERY_MARKER).exists():
                previous.finish_recovery()
        except (OSError, subprocess.CalledProcessError, DemoError) as recovery_error:
            raise DemoError(f"Replacement failed ({error}). Recovery failed ({recovery_error}).") from recovery_error
        if previous and APP_SERVICES <= running and "tunnel" in running:
            previous.publish()
        raise
    if publish:
        target.publish()
    return replacing_data


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
    print(f"Recovered demo {demo.revision} at {demo.url}.")


def reset(demo, running, *, baseline_date=None, threshold=None):
    publish = "tunnel" in running
    if not demo.modern:
        with tempfile.TemporaryDirectory(dir=demo.directory) as temporary:
            full_path = Path(temporary) / "candidate.sql"
            prepare_baseline(demo, full_path=full_path)
            replaced = replace_workspace(demo, demo, running, publish=publish, full_path=full_path, threshold=threshold)
    else:
        baseline_date = baseline_date or demo.local_time(datetime.now(UTC), BUSINESS_ZONE).date()
        if not demo.baseline_path(baseline_date).exists():
            prepare_baseline(demo, baseline_date)
        replaced = replace_workspace(demo, demo, running, publish=publish, baseline_date=baseline_date,
                                     threshold=threshold)
    if replaced:
        print("Demo workspace restored from its baseline.")


def tick(demo, now):
    running = demo.running()
    if not demo.revision or not {"db", *APP_SERVICES} <= running:
        return
    hour = now.replace(minute=0, second=0, microsecond=0)
    queued = demo.queue()
    activity = demo.activity()
    active_date = activity[2]
    threshold = hour - timedelta(hours=1)
    stamp = f"{demo.revision} {hour.isoformat()}"
    if queued:
        attempted = demo.directory / "queued-attempt"
        attempt = f"{stamp} {queued}"
        if not attempted.exists() or attempted.read_text(encoding="utf-8").strip() != attempt:
            atomic_write(attempted, attempt + "\n")
            # The API already checked for a clean workspace before charging this request.
            reset(demo, running, baseline_date=active_date)
        return
    # Scheduler polls every minute for public requests. Scheduled work is checked once per UTC hour.
    checked = demo.directory / "maintenance-hour"
    if not checked.exists() or checked.read_text(encoding="utf-8").strip() != stamp:
        atomic_write(checked, stamp + "\n")
        due = None
        if demo.modern:
            preparing, due = scheduled_baseline(demo.local_time(now, SCHEDULE_ZONE), active_date)
            for baseline_date in dict.fromkeys((preparing, due)):
                if baseline_date is not None and not demo.baseline_path(baseline_date).exists():
                    prepare_baseline(demo, baseline_date)
        if (due or dirty(activity)) and not recent_activity(activity, threshold):
            reset(demo, running, baseline_date=due or active_date, threshold=threshold)


def start(target, previous, running, *, publish):
    if previous and target.revision == previous.revision and target.modern:
        if "db" not in running:
            previous.ensure_db()
            running = running | {"db"}
        baseline_date = previous.activity()[2]
        if baseline_date is not None and target.baseline_path(baseline_date).exists():
            replace_workspace(target, previous, running, publish=publish, baseline_date=baseline_date)
            return
    with tempfile.TemporaryDirectory(dir=target.directory) as temporary:
        full_path = Path(temporary) / "candidate.sql"
        prepare_baseline(target, full_path=full_path)
        replace_workspace(target, previous, running, publish=publish, full_path=full_path)


def install_task():
    pythonw = Path(sys.executable).with_name("pythonw.exe")
    if not pythonw.exists():
        raise DemoError("Install Python with pythonw.exe to schedule background resets.")
    action = subprocess.list2cmdline([str(pythonw), str(Path(__file__).resolve()), "tick"])
    run("schtasks", "/Create", "/TN", TASK, "/SC", "MINUTE", "/MO", "1", "/ST", "00:00",
        "/TR", action, "/IT", "/F")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", default=PROJECT, help="An alternate catworld-demo-* project for local testing")
    parser.add_argument("--state-dir", type=Path, help="Private operator state directory for an alternate project")
    parser.add_argument("--port", type=int, help="Loopback gateway port for an alternate project")
    parser.add_argument("--working-tree-seed", action="store_true",
                        help="Use the checkout fixtures for an alternate project built from local changes")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("build", help="Build the pair from a validated origin/main revision").add_argument("revision")
    start_command = commands.add_parser("start", help="Prepare the baseline and start a locally built image pair")
    start_command.add_argument("revision", help="Full source SHA of both local images")
    start_command.add_argument("--local-only", action="store_true", help="Keep the Cloudflare Tunnel stopped")
    commands.add_parser("token", help="Save the dedicated Cloudflare Tunnel token interactively")
    commands.add_parser("publish", help="Start the dedicated tunnel for the running demo")
    commands.add_parser("recover", help="Restore a pending snapshot and start the previous demo locally")
    commands.add_parser("stop", help="Stop the demo services and keep the volume")
    commands.add_parser("status", help="Show the selected source revision and services")
    commands.add_parser("reset", help="Restore the running demo baseline immediately")
    commands.add_parser("reset-quota", help="Clear the global and per-address public reset counters")
    commands.add_parser("tick", aliases=["hourly-reset"], help="Check public requests and scheduled resets")
    commands.add_parser("install-hourly", help="Install or update the Windows demo maintenance task")
    return parser.parse_args()


def state_directory(args):
    live = Path(os.environ["LOCALAPPDATA"]) / "CatWorldDemo"
    isolated = args.project != PROJECT
    if not isolated:
        if args.state_dir is not None or args.port is not None or args.working_tree_seed:
            raise DemoError("The state, port and working-tree fixture overrides require an alternate project.")
        args.port = 4210
        return live
    if not re.fullmatch(r"catworld-demo-[a-z0-9][a-z0-9-]{0,30}", args.project) or args.project.endswith("-baseline"):
        raise DemoError("Choose an alternate project name beginning with catworld-demo-.")
    if args.command in {"token", "publish", "install-hourly"}:
        raise DemoError("Tunnel and task commands are only available for the default public demo project.")
    if args.command == "start" and not args.local_only:
        raise DemoError("Start an alternate project with --local-only.")
    if args.port is None or not 1 <= args.port <= 65535 or args.port == 4210:
        raise DemoError("Choose a dedicated alternate --port other than the public demo port 4210.")
    directory = args.state_dir or live.parent / args.project
    if directory.resolve() == live.resolve():
        raise DemoError("Choose a private state directory for the alternate project.")
    return directory


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
        scheduled = args.command in {"tick", "hourly-reset"}
        if scheduled and (not revision or recovery_revision is not None):
            return
        if recovery_revision is not None and args.command in {"start", "reset", "reset-quota", "publish"}:
            raise DemoError("A demo recovery is pending. Run recover before replacing or publishing the workspace.")
        initialize(directory)
        settings = {"project": args.project, "port": args.port, "working_tree_seed": args.working_tree_seed}
        demo = Demo(directory, revision, **settings)
        if args.command == "start":
            if not SHA.fullmatch(args.revision):
                raise DemoError("Select the full SHA of a locally built application pair.")
            target = Demo(directory, args.revision, **settings)
            if not args.local_only:
                if not target.token:
                    raise DemoError("Save the dedicated tunnel token, or start with --local-only.")
                require_main_revision(args.revision)
            verify_image("backend", args.revision)
            verify_image("frontend", args.revision)
            start(target, demo if revision else None, demo.running(), publish=not args.local_only)
            print(f"Started demo {args.revision} at {target.url}.")
        elif args.command == "recover":
            if recovery_revision is None:
                raise DemoError("There is no pending demo recovery.")
            if not SHA.fullmatch(recovery_revision):
                raise DemoError("The pending recovery revision is invalid. Preserve the recovery files.")
            recover(Demo(directory, recovery_revision, **settings))
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
        elif scheduled:
            tick(demo, datetime.now(UTC))
        elif args.command == "reset-quota":
            if not revision or "db" not in demo.running():
                raise DemoError("The demo database must be running before resetting the quota.")
            demo.reset_quota()
            print("Cleared the public reset counters.")
        elif args.command == "reset":
            running = demo.running()
            if not revision or not {"db", *APP_SERVICES} <= running:
                raise DemoError("The demo must be running before it can be reset.")
            reset(demo, running, baseline_date=demo.activity()[2])


def main():
    args = parse_args()
    try:
        directory = state_directory(args)
        directory.mkdir(parents=True, exist_ok=True)
        operate(args, directory)
    except (DemoError, OSError, subprocess.CalledProcessError, KeyboardInterrupt) as error:
        print(f"Demo operation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    if sys.executable.lower().endswith("pythonw.exe"):
        log_path = Path(os.environ["LOCALAPPDATA"]) / "CatWorldDemo" / "hourly-reset.log"
        log_path.parent.mkdir(exist_ok=True)
        with log_path.open("a", encoding="utf-8") as log, redirect_stdout(log), redirect_stderr(log):
            sys.exit(main())
    sys.exit(main())
