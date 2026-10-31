"""Confirmed manual-source omissions must not reappear during preservation."""
import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE = Path(__file__).resolve().parents[1] / "scripts" / "sync-media.py"
spec = importlib.util.spec_from_file_location("media_selection_sync", MODULE)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SourceSelectionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.site = self.root / "site"
        self.library = self.root / "library"
        self.raw = self.site / "media/funeral-melb"
        self.canonical = self.library / "artist/2026_melbourne-fringe"
        self.raw.mkdir(parents=True)
        self.canonical.mkdir(parents=True)
        self.body = b"artist-selected-original"
        self.row = {
            "originalFilename": "removed.JPG",
            "sourceHash": hashlib.sha256(self.body).hexdigest(),
            "src": "media/melbourne-fringe/removed.webp",
        }
        self.selection = self.root / "selection.json"
        self.selection.write_text(json.dumps({
            "version": 1,
            "selections": [{
                "project": "melbourne-fringe",
                "siteSourceFolder": "media/funeral-melb",
                "librarySourceFolder": "artist/2026_melbourne-fringe",
                "missingSources": [self.row],
            }],
        }))

    def active(self):
        return sync.active_source_removals(self.library, self.site, self.selection)

    def test_preserved_stale_gallery_and_index_are_filtered_without_other_changes(self):
        removed = {"src": self.row["src"], "alt": "Removed selection"}
        retained = {"src": "media/melbourne-fringe/retained.webp", "alt": "Keep"}
        other = {"hero": {"src": "other.webp"}}
        previous = {
            "projects": {"melbourne-fringe": {"hero": retained, "gallery": [removed, retained]}},
            "visualIndex": [dict(self.row, project="melbourne-fringe"), dict(retained, project="melbourne-fringe")],
        }
        manifest = {
            "projects": {"origin": copy.deepcopy(other)},
            "visualIndex": [dict(self.row, project="origin")],
            "profile": {"src": "profile.webp"},
            "showreel": [{"src": "selected.webp"}],
        }
        sync.preserve_pending_sources(manifest, previous)
        profile, showreel = copy.deepcopy(manifest["profile"]), copy.deepcopy(manifest["showreel"])
        sync.apply_source_removals(manifest, self.active())
        self.assertEqual(manifest["projects"]["melbourne-fringe"]["gallery"], [retained])
        self.assertEqual(manifest["projects"]["origin"], other)
        self.assertEqual(manifest["projects"]["melbourne-fringe"]["hero"], retained)
        self.assertEqual([item["project"] for item in manifest["visualIndex"]], ["origin", "melbourne-fringe"])
        self.assertEqual((manifest["profile"], manifest["showreel"]), (profile, showreel))

    def test_restoring_original_in_local_source_permits_next_import(self):
        file = self.raw / self.row["originalFilename"]
        file.write_bytes(self.body)
        self.assertEqual(self.active(), [])
        self.assertEqual(file.read_bytes(), self.body)

    def test_restoring_same_filename_with_new_content_is_not_permanently_blocked(self):
        (self.canonical / self.row["originalFilename"]).write_bytes(b"a newly selected photograph")
        self.assertEqual(self.active(), [])

    def test_renamed_selected_original_is_recognised_by_content(self):
        (self.canonical / "new-name.JPG").write_bytes(self.body)
        self.assertEqual(self.active(), [])

    def test_empty_or_unavailable_folders_only_apply_confirmed_records(self):
        self.raw.rmdir()
        self.canonical.rmdir()
        active = self.active()
        self.assertEqual(len(active), 1)
        self.assertEqual(active[0]["src"], self.row["src"])
        self.assertEqual(active[0]["project"], "melbourne-fringe")

    def test_no_selection_file_is_a_noop(self):
        self.selection.unlink()
        manifest = {"projects": {"origin": {"hero": None}}, "visualIndex": []}
        before = copy.deepcopy(manifest)
        sync.apply_source_removals(manifest, self.active())
        self.assertEqual(manifest, before)


if __name__ == "__main__":
    unittest.main()
