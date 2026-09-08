import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

spec = importlib.util.spec_from_file_location("sync_media", Path(__file__).resolve().parents[1] / "scripts/sync-media.py")
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


class MediaDatesTest(unittest.TestCase):
    def source(self, name="IMG_0001.jpg", **stat):
        source = MagicMock(spec=Path)
        source.suffix = Path(name).suffix
        source.stem = Path(name).stem
        source.stat.return_value = SimpleNamespace(st_mtime=1735689600, **stat)
        return source

    def test_exif_and_iso_dates(self):
        self.assertEqual(media.parse_media_date("2026:04:15 17:40:00"), "2026-04-15T17:40:00+00:00")
        self.assertEqual(media.parse_media_date("2026-04-15T17:40:00+10:00"), "2026-04-15T17:40:00+10:00")
        for value in (None, "", "0000:00:00 00:00:00", "invalid"):
            self.assertIsNone(media.parse_media_date(value))

    def test_camera_date_has_priority_and_keeps_offset(self):
        image = MagicMock()
        image.getexif.return_value = {36867: "2026:04:15 17:40:00", 36881: "+10:00"}
        with patch.object(media.Image, "open") as opened:
            opened.return_value.__enter__.return_value = image
            self.assertEqual(media.media_creation_date(self.source()), ("2026-04-15T17:40:00+10:00", "camera"))

    def test_screenshot_name_before_copy_date(self):
        with patch.object(media.Image, "open", side_effect=OSError):
            date, basis = media.media_creation_date(self.source("Screenshot 2026-04-15 at 5.40.00\u202fPM.png", st_birthtime=1780000000))
        self.assertEqual((date, basis), ("2026-04-15T17:40:00+00:00", "filename"))

    def test_creation_time_fallback_and_portability(self):
        with patch.object(media.Image, "open", side_effect=OSError):
            self.assertEqual(media.media_creation_date(self.source(st_birthtime=1740000000))[1], "file-created")
            self.assertEqual(media.media_creation_date(self.source())[1], "file-modified")

    def test_video_creation_metadata(self):
        result = SimpleNamespace(returncode=0, stdout='{"format":{"tags":{"creation_time":"2025-07-05T12:00:00Z"}}}')
        with patch.object(media.subprocess, "run", return_value=result):
            self.assertEqual(media.media_creation_date(self.source("clip.mov")), ("2025-07-05T12:00:00+00:00", "embedded"))


if __name__ == "__main__":
    unittest.main()
