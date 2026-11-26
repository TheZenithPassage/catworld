"""Regression checks for the demo's reset and recovery boundaries."""

from contextlib import nullcontext
from datetime import UTC, date, datetime
from http.client import RemoteDisconnected
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, call, patch
from urllib.response import addinfourl

import manage


class DemoScheduleTest(unittest.TestCase):
    def test_madrid_slot_is_prepared_before_becoming_due(self):
        active = date(2026, 11, 23)
        self.assertEqual(manage.scheduled_baseline(datetime(2026, 11, 26, 4, 59), active),
                         (date(2026, 11, 26), None))
        self.assertEqual(manage.scheduled_baseline(datetime(2026, 11, 26, 5), active),
                         (None, date(2026, 11, 26)))

    def test_missed_madrid_slot_is_due_until_a_compatible_baseline_is_installed(self):
        now = datetime(2026, 11, 27, 9)
        self.assertEqual(manage.scheduled_baseline(now, date(2026, 11, 23)),
                         (None, date(2026, 11, 26)))
        self.assertEqual(manage.scheduled_baseline(now, date(2026, 11, 26)), (None, None))


class DemoReadinessTest(unittest.TestCase):
    def test_retries_when_the_gateway_closes_the_connection_during_startup(self):
        demo = manage.Demo(Path("unused"), "a" * 40)
        ready = addinfourl(BytesIO(b'{"username":"demo","role":"ADMIN"}'),
                          {manage.GENERATION: "candidate-generation"}, demo.url)
        opener = Mock()
        opener.open.side_effect = [RemoteDisconnected(), ready]
        with (
            patch.object(manage, "build_opener", return_value=opener),
            patch.object(manage.time, "sleep"),
        ):
            generation = demo.wait_ready("candidate-generation")

        self.assertEqual(generation, "candidate-generation")
        self.assertEqual(opener.open.call_count, 2)
        self.assertEqual(opener.open.call_args.args[0].full_url, demo.url + "/api/auth/login")


class DemoResetTest(unittest.TestCase):
    now = datetime(2026, 11, 25, 10, tzinfo=UTC)
    baseline = date(2026, 11, 23)

    def setUp(self):
        self.demo = Mock(spec=manage.Demo)
        self.demo.directory = Path(self.enterContext(TemporaryDirectory()))
        self.demo.modern = True
        self.demo.revision = "a" * 40
        self.demo.running.return_value = {"db", "app", "frontend", "tunnel"}
        self.demo.queue.return_value = ""
        self.demo.local_time.return_value = datetime(2026, 11, 25, 11)
        self.demo.activity.return_value = (None, 0, self.baseline, False)
        path = self.demo.directory / "fixture.sql"
        path.touch()
        self.demo.baseline_path.return_value = path
        self.demo.generation.return_value = "candidate-generation"
        self.demo.domain_tables.return_value = ["cats", "owners"]

    def test_hourly_reset_never_starts_an_inactive_stack(self):
        self.demo.running.return_value = {"db"}
        manage.tick(self.demo, self.now)
        self.assertEqual(self.demo.mock_calls, [call.running()])

    def test_hourly_reset_skips_downtime_after_a_write_in_the_previous_hour(self):
        self.demo.activity.return_value = (datetime(2026, 11, 25, 9, tzinfo=UTC), 0, self.baseline, False)
        manage.tick(self.demo, self.now)
        self.demo.stop_ingress.assert_not_called()

    def test_a_due_baseline_is_installed_even_when_the_workspace_is_clean(self):
        self.demo.local_time.return_value = datetime(2026, 11, 26, 5)
        now = datetime(2026, 11, 26, 4, tzinfo=UTC)
        manage.tick(self.demo, now)
        self.demo.replace_rows.assert_called_once_with(
            self.demo.baseline_path.return_value, ["cats", "owners"], baseline_date=date(2026, 11, 26))

    def test_hourly_reset_restores_exhausted_photo_capacity(self):
        self.demo.activity.return_value = (None, 0, self.baseline, True)
        manage.tick(self.demo, self.now)
        self.demo.replace_rows.assert_called_once()

    def test_automatic_restore_preserves_a_mutation_with_uncertain_outcome_after_drain(self):
        changed = datetime(2026, 11, 25, 8, 40, tzinfo=UTC)
        self.demo.activity.side_effect = [(changed, 0, self.baseline, False), (changed, 1, self.baseline, False)]
        manage.tick(self.demo, self.now)
        self.demo.assert_has_calls([call.stop_ingress(), call.stop_app(), call.activity(),
                                    call.start_application(), call.wait_ready(), call.publish()])
        self.demo.replace_rows.assert_not_called()
        self.demo.clear_queue.assert_not_called()

    def test_public_reset_drains_even_with_an_uncertain_outcome_and_takes_priority_over_preparation(self):
        self.demo.queue.return_value = "2026-11-25 09:59:20.000000"
        self.demo.activity.return_value = (None, 1, self.baseline, False)
        manage.tick(self.demo, self.now)
        self.demo.assert_has_calls([call.stop_ingress(), call.stop_app(), call.backup()])
        self.demo.replace_rows.assert_called_once()
        self.demo.local_time.assert_not_called()

    def test_accepted_public_reset_is_applied_if_the_in_flight_write_failed(self):
        self.demo.queue.return_value = "2026-11-25 09:59:20.000000"
        self.demo.activity.return_value = (None, 0, self.baseline, False)
        manage.tick(self.demo, self.now)
        self.demo.replace_rows.assert_called_once()
        self.demo.assert_has_calls([call.wait_ready("candidate-generation"), call.clear_queue()])

    def test_reset_drains_and_backs_up_then_verifies_before_clearing_queue(self):
        manage.reset(self.demo, self.demo.running.return_value, baseline_date=self.baseline)
        self.demo.assert_has_calls([
            call.stop_ingress(), call.stop_app(), call.backup(), call.domain_tables(), call.baseline_path(self.baseline),
            call.replace_rows(self.demo.baseline_path.return_value, ["cats", "owners"], baseline_date=self.baseline),
            call.generation(), call.start_application(), call.wait_ready("candidate-generation"),
            call.clear_queue(), call.remember(), call.finish_recovery(),
            call.publish(),
        ])

    def test_failed_verification_restores_old_data_before_reopening_the_tunnel(self):
        previous = Mock(spec=manage.Demo)
        previous.directory = self.demo.directory
        marker = previous.directory / manage.RECOVERY_MARKER
        previous.backup.side_effect = marker.touch
        self.demo.wait_ready.side_effect = manage.DemoError("login failed")
        with self.assertRaisesRegex(manage.DemoError, "login failed"):
            manage.replace_workspace(self.demo, previous, self.demo.running.return_value, publish=True,
                                     baseline_date=self.baseline)
        self.demo.clear_queue.assert_not_called()
        previous.assert_has_calls([
            call.backup(), call.restore(), call.remember(), call.start_application(), call.wait_ready(),
            call.finish_recovery(), call.publish(),
        ])

    def test_staging_failure_leaves_live_ingress_running(self):
        with (
            patch.object(manage, "prepare_baseline", side_effect=manage.DemoError("staging failed")),
            self.assertRaisesRegex(manage.DemoError, "staging failed"),
        ):
            manage.start(self.demo, None, self.demo.running.return_value, publish=True)
        self.demo.stop_ingress.assert_not_called()

    def test_baseline_install_updates_activity_with_domain_rows_in_one_transaction(self):
        demo = manage.Demo(self.demo.directory, self.demo.revision)
        path = demo.baseline_path(self.baseline)
        path.write_bytes(b"INSERT INTO `cats` VALUES (1);\n")
        transaction = []
        with patch.object(demo, "compose", side_effect=lambda *args, stdin: transaction.append(stdin.read().decode())):
            demo.replace_rows(path, ["cats", "owners"], baseline_date=self.baseline)
        sql = transaction[0]
        self.assertLess(sql.index("START TRANSACTION;"), sql.index("DELETE FROM `cats`;"))
        self.assertLess(sql.index("INSERT INTO `cats`"), sql.index("generation=UUID()"))
        self.assertLess(sql.index("baseline_date='2026-11-23'"), sql.index("COMMIT;"))
        self.assertIn("photo_uploads=0", sql)
        self.assertNotIn("demo_reset_", sql)


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
