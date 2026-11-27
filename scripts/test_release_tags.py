"""Check release-name parity against Git and the real producer/consumer paths."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from release_tags import valid_release_tag
from release_pair import event_identity, record, resolve_tag
from production_pair import parse_delivery, prepare, verify_pulled_image
from types import SimpleNamespace


ROOT = Path(__file__).resolve().parents[1]
REPO = 'TheZenithPassage/catworld'
SHA = 'a' * 40
VALID = ['v1.2.0', 'release/v1.2.3', 'v1.2.3+build', '-release', '@',
         'café/猫', 'v' * 200, 'part./tag', "v'\"$();&`<>#%+!{}=]tag"]
INVALID = ['', '/v1', 'v1/', 'v//1', '.hidden/v', 'v/.hidden', 'v.lock/tag',
           'v.lock', 'v..1', 'v1.', 'v@{1}', 'v 1', 'v\t1', 'v\n1',
           'v~1', 'v^1', 'v:1', 'v?1', 'v*1', 'v[1', 'v\\1', 'v\x7f1']


def event(tag):
    return {'repository': {'full_name': REPO, 'private': False},
            'release': {'id': 123, 'tag_name': tag, 'draft': False, 'prerelease': False}}


def delivery(tag):
    return record(event(tag)['release'], REPO, SHA,
                  f'ghcr.io/{REPO.lower()}-backend@sha256:' + 'b' * 64,
                  f'ghcr.io/{REPO.lower()}-frontend@sha256:' + 'c' * 64, 22, 1)


class ReleaseTagTests(unittest.TestCase):
    def test_git_reference_parity(self):
        cases = VALID + INVALID + ['v' + chr(c) + '1' for c in range(1, 128)]
        for tag in cases:
            with self.subTest(tag=tag):
                git_valid = subprocess.run(['git', 'check-ref-format', 'refs/tags/' + tag],
                                           capture_output=True).returncode == 0
                self.assertEqual(valid_release_tag(tag), git_valid)

    def test_producer_consumer_and_oci_labels_preserve_literal_names(self):
        for tag in VALID:
            with self.subTest(tag=tag):
                selected = event_identity(event(tag), 'release', 'published',
                                          'refs/tags/' + tag, REPO, 'public')
                self.assertEqual(selected['tag_name'], tag)
                data = delivery(tag)
                self.assertEqual(parse_delivery(data, tag, SHA)['tag'], tag)
                details = {'Architecture': 'arm64', 'RepoDigests': [data['backend']],
                           'Config': {'Labels': {'org.opencontainers.image.source': 'https://github.com/' + REPO,
                                               'org.opencontainers.image.revision': SHA,
                                               'org.opencontainers.image.version': tag}}}
                verify_pulled_image(data['backend'], data,
                                    run_command=lambda *a, **kw: SimpleNamespace(stdout=json.dumps(details)))
                with self.assertRaises(ValueError):
                    parse_delivery(data, 'different', SHA)

    def test_invalid_and_nonstring_names_stop_before_lookup(self):
        for tag in INVALID + [None, 3, True, [], {}, 'v\x001']:
            with self.subTest(tag=tag):
                self.assertFalse(valid_release_tag(tag))
                with self.assertRaises(SystemExit):
                    event_identity(event(tag), 'release', 'published', f'refs/tags/{tag}', REPO, 'public')
                with self.assertRaises(ValueError):
                    parse_delivery(delivery(tag), tag, SHA)
                with patch('release_pair.subprocess.run') as lookup, self.assertRaises(SystemExit):
                    resolve_tag(tag)
                lookup.assert_not_called()

    def test_ref_repository_and_published_gates_still_apply(self):
        selected = event('release/v1+build')
        ref = 'refs/tags/release/v1+build'
        for key, value in [('draft', True), ('prerelease', None), ('id', 0)]:
            altered = {**selected, 'release': {**selected['release'], key: value}}
            with self.subTest(key=key), self.assertRaises(SystemExit):
                event_identity(altered, 'release', 'published', ref, REPO, 'public')
        for name, action, actual_ref, repo, visibility in [
            ('push', 'published', ref, REPO, 'public'),
            ('release', 'edited', ref, REPO, 'public'),
            ('release', 'published', 'refs/heads/release/v1+build', REPO, 'public'),
            ('release', 'published', ref, 'other/repo', 'public'),
            ('release', 'published', ref, REPO, 'private')]:
            with self.subTest(ref=actual_ref, repo=repo), self.assertRaises(SystemExit):
                event_identity(selected, name, action, actual_ref, repo, visibility)
        with self.assertRaises(SystemExit):
            event_identity({**selected, 'repository': {'full_name': REPO, 'private': True}},
                           'release', 'published', ref, REPO, 'public')

    def test_offline_preflight_needs_no_executables_or_checkout(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'delivery.json'
            path.write_text(json.dumps(delivery('-release/v1+build')), encoding='utf-8')
            args = SimpleNamespace(delivery=path, tag='-release/v1+build', source=SHA, deploy=False)
            with patch('subprocess.run', side_effect=AssertionError('External command in offline preflight')):
                self.assertEqual(prepare(args)['tag'], args.tag)
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/production_pair.py'),
                                     '--delivery', str(path), '--tag=' + args.tag, '--source', SHA],
                                    cwd=folder, env={**os.environ, 'PATH': ''}, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_real_lightweight_annotated_and_moved_tags(self):
        with tempfile.TemporaryDirectory() as folder:
            def git(*args):
                return subprocess.run(['git', '-C', folder, *args], check=True,
                                      capture_output=True, text=True).stdout.strip()
            git('init', '--quiet')
            git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                'commit', '--allow-empty', '-m', 'first')
            first = git('rev-parse', 'HEAD')
            for tag, annotated in [('release/v1.2.3', True), ('v1.2.3+build', False), ('-release', False)]:
                if annotated:
                    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                        'tag', '-a', '-m', 'fixture', '--', tag)
                else:
                    git('update-ref', 'refs/tags/' + tag, first)
                fixture = Path(folder) / 'event.json'
                output = Path(folder) / 'identity.json'
                fixture.write_text(json.dumps(event(tag)), encoding='utf-8')
                command = [sys.executable, str(ROOT / 'scripts/release_pair.py'), 'identity',
                           '--event', str(fixture), '--name', 'release', '--action', 'published',
                           '--ref', 'refs/tags/' + tag, '--repository', REPO, '--visibility', 'public',
                           '--output', str(output), '--source', first]
                result = subprocess.run(command, cwd=folder, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(output.read_text())['source_sha'], first)
            git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                'commit', '--allow-empty', '-m', 'second')
            git('update-ref', 'refs/tags/-release', git('rev-parse', 'HEAD'))
            output.unlink()
            moved = subprocess.run(command, cwd=folder, capture_output=True, text=True)
            self.assertNotEqual(moved.returncode, 0)
            self.assertIn('Release tag moved', moved.stderr)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
