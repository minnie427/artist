#!/usr/bin/env python3
"""Optimise Minnie Park's iCloud media library and build the site manifest.

Source files are read only. Web-ready copies are written to ./media and the
resulting browser manifest is written to ./site-media.js.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import unicodedata
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageOps


DEFAULT_SOURCE = Path(
    "/Users/minniepark/Library/Mobile Documents/com~apple~CloudDocs/2026 ART/MINNIE_SITE_MEDIA"
)
SITE_ROOT = Path(__file__).resolve().parents[1]
MEDIA_ROOT = SITE_ROOT / "media"
MANIFEST_PATH = SITE_ROOT / "site-media.js"
SOURCE_SELECTION_PATH = SITE_ROOT / "media-source-selection.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".heif"}
VIDEO_EXTENSIONS = {".mov", ".mp4", ".m4v"}

PROJECT_SOURCES = [
    ("artist/2023_body-morphosis", "body-morphosis", "body-morphosis", "Body Morphosis", "2023"),
    ("artist/2026_flower-your-face", "flower-your-face", "flower-your-face", "Flower your Face", "2026"),
    ("artist/live-performance", "live-performance", "live-performance", "Live Performance", "2023-2024"),
    ("artist/artist-workshops", "artist-workshops", "artist-workshops", "Artist Workshops", "2025 onwards"),
    ("artist/2026_reintervention", "reintervention", "reintervention", "RE:INTERVENTION", "2026"),
    ("artist/2026_respite-iii", "respite-iii", "respite-iii", "Respite III", "2026"),
    ("artist/2026_melbourne-fringe", "melbourne-fringe", "melbourne-fringe", "The Meta Rose: Shared Resonance / Melbourne Fringe", "2026"),
    ("artist/2026_funeral", "funeral", "funeral", "Meta Rose: The Funeral", "2026"),
    ("artist/2026_shared-resonance", "shared-resonance", "shared-resonance", "The Meta Rose: Shared Resonance", "2026"),
    ("artist/2026_touching-resonance", "touching-resonance", "touching-resonance", "Touching Resonance", "2026"),
    ("commercial/2026_album-listening-session", "album-listening-session", "album-listening-session", "Album Listening Session", "2026"),
    ("artist/2025_bugskin-chapter-2", "bugskin-chapter-2", "bugskin-chapter-2", "Bugskin Chapter 2", "2025"),
    ("artist/2025_meta-kibun", "meta-kibun", "meta-kibun", "The Meta Kibun Project", "2025"),
    ("artist/2025_mugonggan", "mugonggan", "mugonggan", "Meta Rose: Mugonggan", "2025"),
    ("artist/2025_science-gallery", "science-gallery", "science-gallery", "Artists, Machines and the Space Between", "2025"),
    ("commercial/2025_melbourne-fashion-festival", "melbourne-fashion-festival", "melbourne-fashion-festival", "Melbourne Fashion Festival", "2025"),
    ("artist/2024_origin", "origin", "origin", "Meta Rose: Origin", "2024"),
    ("artist/2024_median-2", "median-2", "median-2", "Median 2", "2024"),
    ("artist/2023_median", "median", "median", "Median", "2023"),
]

RESEARCH_SOURCES = {
    "meta-rose": ("Meta Rose", "메타 로즈"),
    "cultural-study": ("Cultural study", "문화적 연구"),
    "dried-roses": ("Dried roses", "말린 장미"),
    "touch-participation": ("Touch and participation", "접촉과 참여"),
    "making-process": ("Making process", "제작 과정"),
    "research-record": ("Research record", "연구 기록"),
}

# This workshop clip opens before the tracking effect appears.
POSTER_TIMES = {"flower-your-face": 12.0}

# These presentations were imported from an artist-supplied local folder before
# its iCloud counterpart was organised. An empty/missing source folder is not a
# request to delete this already verified documentation from the manifest.
PRESERVE_UNTIL_SOURCE_READY = {"melbourne-fringe", "respite-iii", "reintervention"}


def preserve_pending_sources(manifest: dict[str, object], previous: dict[str, object]) -> None:
    for key in PRESERVE_UNTIL_SOURCE_READY:
        if key in manifest["projects"] or key not in previous.get("projects", {}):
            continue
        manifest["projects"][key] = previous["projects"][key]
        manifest["visualIndex"].extend(
            item for item in previous.get("visualIndex", []) if item.get("project") == key
        )


def active_source_removals(
    source_root: Path | None = None,
    site_root: Path | None = None,
    selection_path: Path | None = None,
) -> list[dict[str, str]]:
    """Reconcile only artist-confirmed omissions from a manual import.

    Missing source folders never cause a general prune. A known omission stays
    excluded from preserved manifests until that source is selected again in
    either its original local folder or the organised library. Re-adding the
    filename, or renaming the same content, therefore permits the next import.
    """
    site_root = site_root or SITE_ROOT
    selection_path = selection_path or SOURCE_SELECTION_PATH
    if not selection_path.exists():
        return []
    selection = json.loads(selection_path.read_text(encoding="utf-8"))
    if selection.get("version") != 1 or not isinstance(selection.get("selections"), list):
        raise ValueError("Unsupported media source selection format")
    active: list[dict[str, str]] = []
    for group in selection["selections"]:
        project = group["project"]
        folders = [site_root / group["siteSourceFolder"]]
        if source_root is not None:
            folders.append(source_root / group["librarySourceFolder"])
        files = [item for folder in folders for item in media_files(folder)]
        names = {item.name.casefold() for item in files}
        missing = [row for row in group["missingSources"] if row["originalFilename"].casefold() not in names]
        hashes: set[str] = set()
        if missing:
            for item in files:
                try:
                    hashes.add(content_digest(item))
                except OSError:
                    # A not-yet-available cloud original cannot prove restoration.
                    continue
        active.extend(dict(row, project=project) for row in missing if row["sourceHash"] not in hashes)
    return active


def apply_source_removals(manifest: dict[str, object], removals: list[dict[str, str]]) -> None:
    """Remove stale public references, while retaining every original/derivative."""
    if not removals:
        return
    projects = {row["project"] for row in removals}

    def excluded(project: str, item: dict[str, object]) -> bool:
        return any(
            row["project"] == project
            and (
                item.get("src") == row["src"]
                or (row.get("poster") and item.get("src") == row["poster"])
                or item.get("sourceHash") == row["sourceHash"]
            )
            for row in removals
        )

    for key, project in manifest.get("projects", {}).items():
        if key not in projects:
            continue
        if project.get("hero") and excluded(key, project["hero"]):
            project["hero"] = None
        project["gallery"] = [item for item in project.get("gallery", []) if not excluded(key, item)]
    manifest["visualIndex"] = [
        item for item in manifest.get("visualIndex", []) if not excluded(item.get("project"), item)
    ]


def natural_key(path: Path) -> list[object]:
    return [int(part) if part.isdigit() else part.casefold() for part in re.split(r"(\d+)", path.name)]


def media_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        (
            path
            for path in folder.rglob("*")
            if path.is_file()
            and not any(part.startswith(".") for part in path.relative_to(folder).parts)
            and path.suffix.casefold() in IMAGE_EXTENSIONS | VIDEO_EXTENSIONS
        ),
        key=natural_key,
    )


def stable_name(source: Path, source_root: Path) -> str:
    stem = unicodedata.normalize("NFKD", source.stem).encode("ascii", "ignore").decode("ascii")
    stem = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower() or "media"
    stem = stem[:54].rstrip("-")
    digest = hashlib.sha1(str(source.relative_to(source_root)).encode("utf-8")).hexdigest()[:8]
    return f"{stem}-{digest}"


def needs_update(source: Path, output: Path) -> bool:
    return not output.exists() or output.stat().st_mtime < source.stat().st_mtime


@contextmanager
def open_source_image(source: Path):
    """Decode HEIC without changing or exporting beside the original."""
    if source.suffix.casefold() not in {".heic", ".heif"}:
        with Image.open(source) as image:
            yield image
        return
    with TemporaryDirectory(prefix="minnie-heic-") as temporary:
        decoded = Path(temporary) / "decoded.png"
        subprocess.run(
            ["/opt/homebrew/bin/ffmpeg", "-v", "error", "-i", str(source),
             "-frames:v", "1", "-map_metadata", "-1", str(decoded)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
        )
        with Image.open(decoded) as image:
            yield image


def image_ratio(path: Path) -> float:
    try:
        with open_source_image(path) as image:
            width, height = ImageOps.exif_transpose(image).size
            return width / max(height, 1)
    except Exception:
        return 0.0


def parse_media_date(value: object) -> str | None:
    if not value:
        return None
    text = str(value).strip().replace("\x00", "")
    # EXIF uses YYYY:MM:DD; video metadata normally uses ISO 8601.
    text = re.sub(r"^(\d{4}):(\d{2}):(\d{2})", r"\1-\2-\3", text)
    try:
        date = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if not 1900 <= date.year <= 2100:
            return None
        # A timezone-less camera date is kept consistent across import machines.
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        return date.isoformat()
    except ValueError:
        return None


def media_creation_date(source: Path) -> tuple[str, str]:
    if source.suffix.casefold() in IMAGE_EXTENSIONS:
        try:
            with open_source_image(source) as image:
                exif = image.getexif()
                camera = exif.get_ifd(0x8769) if 0x8769 in exif else {}
                for tag in (36867, 36868):  # Original / digitised, not edited date.
                    value = camera.get(tag) or exif.get(tag)
                    offset_tag = 36881 if tag == 36867 else 36882
                    offset = camera.get(offset_tag) or exif.get(offset_tag)
                    if value and offset and re.fullmatch(r"[+-]\d{2}:\d{2}", str(offset)):
                        value = f"{value}{offset}"
                    date = parse_media_date(value)
                    if date:
                        return date, "camera"
                for key in ("Creation Time", "CreationTime", "creation_time", "date:create"):
                    date = parse_media_date(image.info.get(key))
                    if date:
                        return date, "embedded"
        except (OSError, ValueError, TypeError, subprocess.CalledProcessError):
            pass
    else:
        result = subprocess.run(
            ["/opt/homebrew/bin/ffprobe", "-v", "error", "-show_entries",
             "format_tags=creation_time,com.apple.quicktime.creationdate:stream_tags=creation_time",
             "-of", "json", str(source)],
            capture_output=True, text=True, check=False,
        )
        if result.returncode == 0:
            metadata = json.loads(result.stdout)
            tags = metadata.get("format", {}).get("tags", {})
            candidates = [tags.get("com.apple.quicktime.creationdate"), tags.get("creation_time")]
            candidates.extend(stream.get("tags", {}).get("creation_time") for stream in metadata.get("streams", []))
            for value in candidates:
                date = parse_media_date(value)
                if date:
                    return date, "embedded"

    # macOS screenshots/recordings retain their creation date in the filename.
    name = unicodedata.normalize("NFKC", source.stem)
    match = re.search(r"(\d{4}-\d{2}-\d{2})(?: at (\d{1,2})\.(\d{2})\.(\d{2})\s*(AM|PM))?", name, re.I)
    if match:
        value = match.group(1)
        if match.group(2):
            hour = int(match.group(2)) % 12 + (12 if match.group(5).upper() == "PM" else 0)
            value += f"T{hour:02d}:{match.group(3)}:{match.group(4)}"
        date = parse_media_date(value)
        if date:
            return date, "filename"

    stat = source.stat()
    birth = getattr(stat, "st_birthtime", None)
    timestamp = birth if birth and birth > 0 else stat.st_mtime
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat(), "file-created" if birth and birth > 0 else "file-modified"


def optimise_image(source: Path, output: Path, max_size: int = 2000, force: bool = False) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if not force and not needs_update(source, output):
        with Image.open(output) as previous:
            if not previous.getexif() and not any(key in previous.info for key in ("exif", "xmp", "XML:com.adobe.xmp")):
                return
    with open_source_image(source) as raw:
        colour_profile = raw.info.get("icc_profile")
        image = ImageOps.exif_transpose(raw)
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.info.clear()
        colour_options = {"icc_profile": colour_profile} if colour_profile else {}
        # A few approved legacy URLs end in .jpg; retain their format and URL.
        if output.suffix.casefold() in {".jpg", ".jpeg"}:
            image.convert("RGB").save(output, "JPEG", quality=90, optimize=True, **colour_options)
        elif output.suffix.casefold() == ".png":
            image.save(output, "PNG", optimize=True, **colour_options)
        else:
            image.save(output, "WEBP", quality=84, method=6, **colour_options)


def video_probe(path: Path) -> dict[str, object]:
    result = subprocess.run(
        ["/opt/homebrew/bin/ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)


def video_needs_update(source: Path, output: Path) -> bool:
    if needs_update(source, output) or output.stat().st_size > 95 * 1024 * 1024:
        return True
    metadata = video_probe(output)
    for stream in metadata.get("streams", []):
        tags = stream.get("tags", {})
        if any(key.casefold() not in {"language", "handler_name", "vendor_id", "encoder"} for key in tags):
            return True
        if stream.get("codec_type") == "video":
            numerator, _, denominator = stream.get("avg_frame_rate", "0/1").partition("/")
            fps = float(numerator or 0) / max(float(denominator or 1), 1)
            if max(stream.get("width", 0), stream.get("height", 0)) > 1280 or fps > 30.01:
                return True
    return any(key.casefold() not in {"major_brand", "minor_version", "compatible_brands", "encoder"}
               for key in metadata.get("format", {}).get("tags", {}))


def optimise_video(source: Path, output: Path, poster: Path, poster_time: float = 1) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if video_needs_update(source, output):
        print(f"Optimising video: {source.name}", flush=True)
        duration = float(video_probe(source).get("format", {}).get("duration") or 0)
        # A long source remains below GitHub's per-file limit without truncation.
        maxrate = min(6_000_000, int(88 * 1024 * 1024 * 8 / duration - 128_000)) if duration else 6_000_000
        maxrate = max(100_000, maxrate)
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-i",
                str(source),
                "-vf",
                "scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30",
                "-map_metadata",
                "-1",
                "-map_chapters",
                "-1",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "25",
                "-maxrate",
                str(maxrate),
                "-bufsize",
                str(maxrate * 2),
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                str(output),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if output.stat().st_size > 95 * 1024 * 1024:
            raise ValueError(f"Web video exceeds 95 MiB: {output}")
    if poster_time != 1 or not poster.exists() or poster.stat().st_mtime < output.stat().st_mtime:
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-ss",
                str(poster_time),
                "-i",
                str(output),
                "-frames:v",
                "1",
                "-map_metadata",
                "-1",
                "-vf",
                "scale=1600:1600:force_original_aspect_ratio=decrease:force_divisible_by=2",
                "-q:v",
                "3",
                str(poster),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def context_for(source: Path, is_video: bool, is_hero: bool, project_key: str) -> str:
    name = source.stem.casefold()
    if is_video:
        return "Moving-image documentation"
    if project_key in {"median", "median-2", "live-performance"}:
        return "Performance documentation"
    if project_key in {"touching-resonance", "science-gallery", "artist-workshops", "flower-your-face"}:
        return "Workshop documentation"
    if is_hero:
        return "Installation view"
    if name.startswith("screenshot") or name.startswith("main1") or "sub1" in name or "3d" in name:
        return "Real-time visual state"
    return "Installation documentation"


def process_file(source: Path, source_root: Path, destination_folder: Path,
                 existing: dict[str, object] | None = None,
                 poster_time: float = 1) -> tuple[str, str | None, bool]:
    name = stable_name(source, source_root)
    is_video = source.suffix.casefold() in VIDEO_EXTENSIONS
    if is_video:
        output = SITE_ROOT / existing["src"] if existing else destination_folder / f"{name}.mp4"
        poster = SITE_ROOT / existing["poster"] if existing and existing.get("poster") else output.with_name(f"{output.stem}-poster.jpg")
        optimise_video(source, output, poster, poster_time)
        return output.relative_to(SITE_ROOT).as_posix(), poster.relative_to(SITE_ROOT).as_posix(), True
    output = SITE_ROOT / existing["src"] if existing else destination_folder / f"{name}.webp"
    optimise_image(source, output)
    return output.relative_to(SITE_ROOT).as_posix(), None, False


def showreel_identity(source: Path) -> tuple[str, str, str, str] | None:
    name = source.stem.casefold()
    # Retain confirmed legacy assignments; arbitrary screenshot/showreel names
    # do not identify a project. New selections are matched by content below.
    if name in {"fashionrunway", "showreel1", "showreel3", "showreel4", "showreel5", "showreel6"}:
        return "melbourne-fashion-festival", "Melbourne Fashion Festival", "2025", "Runway documentation"
    if name == "metakibun1":
        return "meta-kibun", "The Meta Kibun Project", "2025", "Installation view"
    if name in {"metarose1", "metarose2"}:
        return "origin", "Meta Rose: Origin", "2024", "Real-time visual state"
    if name == "tr2":
        return "shared-resonance", "The Meta Rose: Shared Resonance", "2026", "Real-time visual state"
    return None


def content_digest(source: Path) -> str:
    with source.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def source_role(source: Path, folder: Path) -> tuple[str, str | None]:
    parts = source.relative_to(folder).parts[:-1]
    for role in ("hero", "interaction", "selected"):
        if role in parts:
            return role, None
    if "parts" in parts:
        position = parts.index("parts")
        return "parts", parts[position + 1] if len(parts) > position + 1 else "unassigned"
    return "documentation", None


def previous_sources(previous: dict[str, object]) -> dict[str, dict[str, dict[str, object]]]:
    """Keep approved URLs when originals move between organised subfolders."""
    result: dict[str, dict[str, dict[str, object]]] = {}
    for item in previous.get("visualIndex", []):
        if item.get("sourceHash") and item.get("project"):
            result.setdefault(item["project"], {}).setdefault(item["sourceHash"], item)
    return result


def research_identity(source: Path, folder: Path, slug: str) -> tuple[str, str, str]:
    """Attribute a research photograph only from an explicit year/project folder."""
    known = {Path(relative).name: (key, title, year)
             for relative, key, destination, title, year in PROJECT_SOURCES}
    year = ""
    for part in source.relative_to(folder).parts[:-1]:
        if part in known:
            return known[part]
        if re.fullmatch(r"(?:19|20)\d{2}", part):
            year = part
    return f"research-{slug}", RESEARCH_SOURCES[slug][0], year


def build_manifest(source_root: Path, previous: dict[str, object] | None = None) -> dict[str, object]:
    manifest: dict[str, object] = {
        "profile": None, "projects": {}, "research": {}, "showreel": [], "visualIndex": []
    }
    identities: dict[str, dict[str, tuple[str, str, str, str]]] = {}
    existing_sources = previous_sources(previous or {})
    processed: dict[tuple[str, str], tuple[str, str | None, bool]] = {}

    def make_item(source: Path, folder: Path, project_key: str, title: str, year: str,
                  is_hero: bool = False) -> dict[str, object]:
        digest = content_digest(source)
        cache_key = (project_key, digest)
        if cache_key not in processed:
            existing = existing_sources.get(project_key, {}).get(digest)
            processed[cache_key] = process_file(
                source, source_root, MEDIA_ROOT / project_key, existing=existing,
                poster_time=POSTER_TIMES.get(project_key, 1),
            )
        src, poster, is_video = processed[cache_key]
        created_at, date_source = media_creation_date(source)
        role, part = source_role(source, folder)
        context = context_for(source, is_video, is_hero, project_key)
        if project_key.startswith("research-"):
            context = "Moving-image research documentation" if is_video else "Research documentation"
        item = {
            "src": src, "alt": f"{title}, {context}", "title": title,
            "year": year, "context": context, "project": project_key,
            "originalFilename": source.name, "sourceRelative": source.relative_to(source_root).as_posix(),
            "sourceHash": digest, "sourceRole": role,
            "createdAt": created_at, "dateSource": date_source,
        }
        if part:
            item["sourcePart"] = part
        if poster:
            item["poster"] = poster
            item["posterTime"] = POSTER_TIMES.get(project_key, 1)
        with Image.open(SITE_ROOT / (poster or src)) as image:
            item["width"], item["height"] = image.size
        return item

    profile_files = media_files(source_root / "artist/profile")
    if profile_files:
        source = next((item for item in profile_files if item.stem.casefold() == "artist2"), profile_files[0])
        src, _, _ = process_file(source, source_root, MEDIA_ROOT / "profile")
        manifest["profile"] = {"src": src, "alt": "Minnie Park within an interactive installation"}

    for relative, project_key, destination_name, title, year in PROJECT_SOURCES:
        folder = source_root / relative
        files = media_files(folder)
        if not files:
            continue
        print(f"Processing {title}: {len(files)} media items", flush=True)
        hero_candidates = [path for path in files if "hero" in path.relative_to(folder).parts
                           and path.suffix.casefold() in IMAGE_EXTENSIONS]
        hero_source = max(hero_candidates, key=image_ratio) if hero_candidates else None
        project_data = {"hero": None, "gallery": [], "selected": [], "interaction": [], "parts": {}}
        manifest["projects"][project_key] = project_data
        for source in files:
            is_hero = source == hero_source
            item = make_item(source, folder, project_key, title, year, is_hero)
            if is_hero:
                project_data["hero"] = item
            else:
                project_data["gallery"].append(item)
            if item["sourceRole"] in {"selected", "interaction"}:
                project_data[item["sourceRole"]].append(item)
            elif item["sourceRole"] == "parts":
                project_data["parts"].setdefault(item["sourcePart"], []).append(item)
            manifest["visualIndex"].append(item.copy())
            identities.setdefault(item["sourceHash"], {})[project_key] = (project_key, title, year, item["context"])

    for slug, (title, title_ko) in RESEARCH_SOURCES.items():
        folder = source_root / "research" / slug
        files = media_files(folder)
        items = []
        if files:
            print(f"Processing research / {slug}: {len(files)} media items", flush=True)
        for source in files:
            project_key, project_title, year = research_identity(source, folder, slug)
            item = make_item(source, folder, project_key, project_title, year)
            item["context"] = "Moving-image research documentation" if item.get("poster") else "Research documentation"
            item["alt"] = f"{title}, {item['context']}"
            item["collectionTitle"] = title
            item["collectionTitleKo"] = title_ko
            item["researchCollection"] = slug
            items.append(item)
            manifest["visualIndex"].append(item.copy())
        manifest["research"][slug] = items

    selected_files = media_files(source_root / "artist/selected") + media_files(source_root / "artist/showreel")
    selected_digests: set[str] = set()
    for source in selected_files:
        digest = content_digest(source)
        if digest in selected_digests:
            continue
        selected_digests.add(digest)
        matches = identities.get(digest, {})
        identity = next(iter(matches.values())) if len(matches) == 1 else showreel_identity(source) if not matches else None
        if identity:
            project, title, year, context = identity
        else:
            project, title, year, context = None, "", "", "Selected audio-visual work by Minnie Park"
            print(f"Included selected image without a project label: {source.name}", flush=True)
        src, poster, _ = process_file(source, source_root, MEDIA_ROOT / "showreel")
        item = {
            "src": src, "alt": f"{title}, {context}" if title else context,
            "title": title, "year": year, "project": project,
            "originalFilename": source.name, "sourceRelative": source.relative_to(source_root).as_posix(),
            "sourceHash": digest,
        }
        if poster:
            item["poster"] = poster
        manifest["showreel"].append(item)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    if not args.source.exists():
        raise SystemExit(f"Media source not found: {args.source}")

    previous = {}
    if MANIFEST_PATH.exists():
        source = MANIFEST_PATH.read_text(encoding="utf-8").strip()
        prefix = "window.MP_IMPORTED_MEDIA = "
        if source.startswith(prefix) and source.endswith(";"):
            previous = json.loads(source[len(prefix):-1])
    manifest = build_manifest(args.source, previous)
    preserve_pending_sources(manifest, previous)
    apply_source_removals(manifest, active_source_removals(args.source))
    MANIFEST_PATH.write_text(
        "window.MP_IMPORTED_MEDIA = "
        + json.dumps(manifest, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    project_count = len(manifest["projects"])
    visual_count = len(manifest["visualIndex"])
    showreel_count = len(manifest["showreel"])
    print(f"Synced {project_count} projects, {visual_count} indexed media items and {showreel_count} selected images.")


if __name__ == "__main__":
    main()
