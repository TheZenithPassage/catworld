"""Regression checks for the demo's reset and recovery boundaries."""

from contextlib import nullcontext
from http.client import RemoteDisconnected
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, call, patch

import manage


class DemoReadinessTest(unittest.TestCase):
    def test_retries_when_the_gateway_closes_the_connection_during_startup(self):
        demo = manage.Demo(Path("unused"), "a" * 40)
        ready = Mock()
        ready.json.return_value = []
        with (
            patch.object(manage, "DemoApi", side_effect=[RemoteDisconnected(), ready]) as api,
            patch.object(manage.time, "sleep"),
        ):
            demo.wait_ready()

        self.assertEqual(api.call_count, 2)
        ready.json.assert_called_once_with("GET", "/owners")


class DemoResetTest(unittest.TestCase):
    def setUp(self):
        self.demo = Mock(spec=manage.Demo)
        self.demo.running.return_value = {"db", "app", "frontend", "tunnel"}
        self.demo.changed_since.return_value = False

    def test_hourly_reset_never_starts_an_inactive_stack(self):
        self.demo.running.return_value = {"db"}
        manage.reset(self.demo, "old", hourly=True)
        self.assertEqual(self.demo.mock_calls, [call.running()])

    def test_hourly_reset_skips_downtime_when_there_was_activity(self):
        self.demo.changed_since.return_value = True
        with patch.object(manage, "previous_hour_start", return_value="threshold"):
            manage.reset(self.demo, "old", hourly=True)
        self.assertEqual(self.demo.mock_calls, [call.running(), call.changed_since("threshold")])

    def test_mutation_during_shutdown_preserves_workspace(self):
        self.demo.changed_since.side_effect = [False, True]
        with patch.object(manage, "previous_hour_start", return_value="threshold"):
            manage.reset(self.demo, "old", hourly=True)
        self.assertEqual(self.demo.mock_calls, [
            call.running(), call.changed_since("threshold"), call.stop_ingress(), call.stop_app(),
            call.changed_since("threshold", include_uncertain=True), call.start_application(),
            call.wait_ready(), call.publish(),
        ])

    def test_reset_drains_and_backs_up_before_recreating_schema(self):
        with patch.object(manage, "previous_hour_start", return_value="threshold"):
            manage.reset(self.demo, "old", hourly=True)
        self.assertEqual(self.demo.mock_calls, [
            call.running(), call.changed_since("threshold"), call.stop_ingress(), call.stop_app(),
            call.changed_since("threshold", include_uncertain=True), call.backup(), call.clear_schema(),
            call.start_application(), call.seed(), call.clear_activity(), call.remember(), call.finish_recovery(),
            call.publish(),
        ])

    def test_manual_reset_replaces_workspace_despite_recent_activity(self):
        self.demo.changed_since.return_value = True
        manage.reset(self.demo, "old", hourly=False)
        self.demo.changed_since.assert_not_called()
        self.demo.clear_schema.assert_called_once()
        self.demo.seed.assert_called_once()

    def test_seed_failure_restores_old_data_before_reopening_the_tunnel(self):
        previous = Mock(spec=manage.Demo)
        self.demo.seed.side_effect = manage.DemoError("fixture creation failed")
        with self.assertRaisesRegex(manage.DemoError, "fixture creation failed"):
            manage.replace_workspace(self.demo, previous, self.demo.running.return_value, publish=True)
        self.assertEqual(self.demo.mock_calls, [
            call.stop_ingress(), call.stop_app(), call.clear_schema(), call.start_application(),
            call.seed(), call.stop_ingress(), call.stop_app(),
        ])
        self.assertEqual(previous.mock_calls, [
            call.backup(), call.restore(), call.remember(), call.start_application(), call.wait_ready(),
            call.finish_recovery(), call.publish(),
        ])


class DemoRecoveryTest(unittest.TestCase):
    revision = "a" * 40

    def setUp(self):
        temp = self.enterContext(TemporaryDirectory())
        self.directory = Path(temp)
        self.marker = self.directory / "recovery-revision"
        self.snapshot = self.directory / "recovery.sql"
        self.enterContext(patch.object(manage, "lock", return_value=nullcontext()))
        self.enterContext(patch.object(manage, "run", side_effect=AssertionError("External command in unit test")))

    def test_backup_records_the_revision_before_replacement(self):
        demo = manage.Demo(self.directory, self.revision)

        def dump(*args, stdout):
            stdout.write(b"original workspace")

        with patch.object(demo, "compose", side_effect=dump):
            demo.backup()

        self.assertEqual(self.marker.read_text().strip(), self.revision)
        self.assertEqual(self.snapshot.read_bytes(), b"original workspace")

    def test_pending_snapshot_blocks_a_retried_start(self):
        self.marker.write_text(self.revision)
        self.snapshot.write_bytes(b"original workspace")
        args = SimpleNamespace(command="start", revision="b" * 40, local_only=True)
        with patch.object(manage, "verify_image") as verify, self.assertRaisesRegex(manage.DemoError, "recover"):
            manage.operate(args, self.directory)
        verify.assert_not_called()
        self.assertEqual(self.snapshot.read_bytes(), b"original workspace")

    def test_failed_recovery_preserves_snapshot_for_a_successful_retry(self):
        self.marker.write_text(self.revision)
        self.snapshot.write_bytes(b"original workspace")
        demo = manage.Demo(self.directory, self.revision)
        self.enterContext(patch.object(manage, "verify_image"))
        self.enterContext(patch.object(demo, "stop_app"))
        self.enterContext(patch.object(demo, "wait_ready"))

        def compose(*args, stdin=None):
            if stdin is not None:
                self.assertEqual(stdin.read(), b"original workspace")
                if failing:
                    raise OSError("Import failed")

        failing = True
        with patch.object(demo, "compose", side_effect=compose):
            with self.assertRaisesRegex(OSError, "Import failed"):
                manage.recover(demo)
            self.assertEqual(self.marker.read_text(), self.revision)
            self.assertEqual(self.snapshot.read_bytes(), b"original workspace")

            failing = False
            manage.recover(demo)

        self.assertFalse(self.marker.exists())
        self.assertEqual((self.directory / "revision").read_text().strip(), self.revision)


if __name__ == "__main__":
    unittest.main()
