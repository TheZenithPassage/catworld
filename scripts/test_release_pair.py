import unittest

from release_pair import event_identity, record


REPO = "TheZenithPassage/catworld"
SHA = "a" * 40
DIGEST = "sha256:" + "b" * 64


class ReleasePairTest(unittest.TestCase):
    def setUp(self):
        self.event = {"repository": {"full_name": REPO, "private": False},
                      "release": {"id": 123, "tag_name": "v1.0.0", "draft": False,
                                  "prerelease": True}}

    def identity(self, event=None, name="release", action="published",
                 ref="refs/tags/v1.0.0", visibility="public"):
        return event_identity(event or self.event, name, action, ref, REPO, visibility)

    def test_only_published_tagged_public_release(self):
        self.assertTrue(self.identity()["prerelease"])
        for name, action, ref in [("push", "", "refs/heads/main"),
                                  ("pull_request", "opened", "refs/pull/1/merge"),
                                  ("push", "", "refs/tags/v1.0.0"),
                                  ("workflow_dispatch", "", "refs/heads/main"),
                                  ("release", "edited", "refs/tags/v1.0.0")]:
            with self.subTest(name=name, action=action), self.assertRaises(SystemExit):
                self.identity(name=name, action=action, ref=ref)
        for key, value in [("draft", True), ("tag_name", "$(touch /tmp/bad)"),
                           ("id", None)]:
            event = {"repository": self.event["repository"],
                     "release": {**self.event["release"], key: value}}
            with self.subTest(key=key), self.assertRaises(SystemExit):
                self.identity(event=event)
        for visibility in ("private", "internal", ""):
            with self.subTest(visibility=visibility), self.assertRaises(SystemExit):
                self.identity(visibility=visibility)

    def test_pair_requires_both_distinct_digests(self):
        backend = f"ghcr.io/{REPO.lower()}-backend@{DIGEST}"
        frontend = f"ghcr.io/{REPO.lower()}-frontend@{DIGEST}"
        result = record(self.event["release"], REPO, SHA, backend, frontend, 22, 3)
        self.assertEqual((result["source_sha"], result["prerelease"], result["workflow_attempt"]),
                         (SHA, True, 3))
        for second in (None, "", backend, "ghcr.io/elsewhere/frontend@" + DIGEST):
            with self.subTest(second=second), self.assertRaises(SystemExit):
                record(self.event["release"], REPO, SHA, backend, second, 22, 3)


if __name__ == "__main__":
    unittest.main()
