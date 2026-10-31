"""Source-role mapping, stable URLs and privacy in the real import path."""
import contextlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image, ImageCms

spec = importlib.util.spec_from_file_location("media_import", Path(__file__).resolve().parents[1] / "scripts/sync-media.py")
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


class MediaImportTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "library"
        self.site = self.root / "site"
        self.site.mkdir()

    def image(self, relative, colour="pink"):
        file = self.source / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (32, 24), colour).save(file)
        return file

    def test_full_project_and_research_ingest_uses_roles_without_profile_or_documents_in_index(self):
        self.image("artist/2026_flower-your-face/hero/face.jpg")
        self.image("artist/2026_flower-your-face/selected/a.jpg", "blue")
        self.image("artist/2026_flower-your-face/interaction/b.jpg", "red")
        self.image("artist/2026_flower-your-face/parts/record/c.jpg", "green")
        self.image("research/dried-roses/selected/dried.jpg", "yellow")
        self.image("artist/profile/artist2.jpg")
        self.image("documents/cv/private.jpg")
        self.image("unsorted/private.jpg")
        with patch.object(media, "SITE_ROOT", self.site), patch.object(media, "MEDIA_ROOT", self.site / "media"), contextlib.redirect_stdout(io.StringIO()):
            manifest = media.build_manifest(self.source)
        flower = manifest["projects"]["flower-your-face"]
        self.assertEqual(flower["hero"]["sourceRole"], "hero")
        self.assertEqual(len(flower["selected"]), 1)
        self.assertEqual(len(flower["interaction"]), 1)
        self.assertEqual(len(flower["parts"]["record"]), 1)
        self.assertEqual(len(flower["gallery"]), 3)
        self.assertEqual(len(manifest["visualIndex"]), 5)
        self.assertEqual(len(manifest["research"]["dried-roses"]), 1)
        self.assertEqual(set(manifest["research"]), set(media.RESEARCH_SOURCES))
        for item in manifest["visualIndex"]:
            self.assertEqual((item["width"], item["height"]), (32, 24))
            self.assertEqual(item["sourceHash"], media.content_digest(self.source / item["sourceRelative"]))
            self.assertNotIn("private", item["sourceRelative"])
        self.assertIsNotNone(manifest["profile"])

    def test_unchanged_content_moved_to_nested_folder_keeps_approved_url(self):
        source = self.image("artist/2026_flower-your-face/hero/renamed.jpg")
        old_src = "media/flower-your-face/approved-old.webp"
        previous = {"visualIndex": [{"project": "flower-your-face", "sourceHash": media.content_digest(source), "src": old_src}]}
        with patch.object(media, "SITE_ROOT", self.site), patch.object(media, "MEDIA_ROOT", self.site / "media"), contextlib.redirect_stdout(io.StringIO()):
            manifest = media.build_manifest(self.source, previous)
        self.assertEqual(manifest["projects"]["flower-your-face"]["hero"]["src"], old_src)
        self.assertTrue((self.site / old_src).exists())

    def test_heic_is_included_as_an_image_not_silently_skipped(self):
        folder = self.source / "artist/2026_flower-your-face"
        folder.mkdir(parents=True)
        (folder / "portrait.HEIC").write_bytes(b"placeholder")
        (folder / "notes.txt").write_text("private")
        self.assertEqual([p.name for p in media.media_files(folder)], ["portrait.HEIC"])

    def test_plain_parts_folder_is_preserved_without_guessing_an_artwork(self):
        folder = self.source / "artist/2026_reintervention"
        self.assertEqual(media.source_role(folder / "parts/photo.jpg", folder), ("parts", "unassigned"))

    def test_research_project_is_assigned_from_explicit_folder_not_camera_date(self):
        folder = self.source / "research/dried-roses"
        self.assertEqual(media.research_identity(folder / "2024_origin/rose.jpg", folder, "dried-roses"),
                         ("origin", "Meta Rose: Origin", "2024"))
        self.assertEqual(media.research_identity(folder / "rose.jpg", folder, "dried-roses"),
                         ("research-dried-roses", "Dried roses", ""))

    def test_web_image_does_not_keep_private_exif(self):
        source = self.source / "camera.jpg"
        source.parent.mkdir(parents=True)
        exif = Image.Exif()
        exif[270] = "private camera description"
        Image.new("RGB", (32, 24)).save(source, exif=exif)
        output = self.site / "web.webp"
        media.optimise_image(source, output)
        with Image.open(output) as image:
            self.assertFalse(image.getexif())
            self.assertNotIn("exif", image.info)
        with Image.open(source) as image:
            self.assertEqual(image.getexif()[270], "private camera description")

    def test_video_conversion_strips_metadata_and_caps_output_geometry(self):
        output = self.site / "clip.mp4"
        poster = self.site / "clip-poster.jpg"
        calls = []
        def run(command, **kwargs):
            calls.append(command)
            Path(command[-1]).write_bytes(b"web derivative")
        with patch.object(media, "video_needs_update", return_value=True), patch.object(media, "video_probe", return_value={"format": {"duration": "60"}}), patch.object(media.subprocess, "run", side_effect=run), contextlib.redirect_stdout(io.StringIO()):
            media.optimise_video(self.source / "private.mov", output, poster)
        encode = calls[0]
        self.assertIn("scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30", encode)
        self.assertEqual(encode[encode.index("-map_metadata") + 1], "-1")
        self.assertEqual(encode[encode.index("-map_chapters") + 1], "-1")
        self.assertEqual(calls[1][calls[1].index("-map_metadata") + 1], "-1")

    def test_legacy_jpeg_url_is_retained_but_embedded_metadata_is_removed(self):
        source = self.image("source.jpg")
        output = self.site / "approved.jpg"
        exif = Image.Exif()
        exif[270] = "private legacy metadata"
        Image.new("RGB", (32, 24)).save(output, exif=exif)
        media.optimise_image(source, output)
        with Image.open(output) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertFalse(image.getexif())

    def test_colour_profile_survives_while_private_exif_is_removed(self):
        source = self.source / "colour.jpg"
        source.parent.mkdir(parents=True)
        profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
        exif = Image.Exif()
        exif[270] = "private description"
        Image.new("RGB", (32, 24), "pink").save(source, exif=exif, icc_profile=profile)
        output = self.site / "colour.webp"
        media.optimise_image(source, output)
        with Image.open(output) as image:
            self.assertEqual(image.info["icc_profile"], profile)
            self.assertFalse(image.getexif())


if __name__ == "__main__":
    unittest.main()
