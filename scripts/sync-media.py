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
from pathlib import Path

from PIL import Image, ImageOps


DEFAULT_SOURCE = Path(
    "/Users/minniepark/Library/Mobile Documents/com~apple~CloudDocs/2026 ART/MINNIE_SITE_MEDIA"
)
SITE_ROOT = Path(__file__).resolve().parents[1]
MEDIA_ROOT = SITE_ROOT / "media"
MANIFEST_PATH = SITE_ROOT / "site-media.js"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
VIDEO_EXTENSIONS = {".mov", ".mp4", ".m4v"}

PROJECT_SOURCES = [
    ("artist/live-performance", "live-performance", "live-performance", "Live Performance", "2023—2024"),
    ("artist/artist-workshops", "artist-workshops", "artist-workshops", "Artist Workshops", "2025—ongoing"),
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


def image_ratio(path: Path) -> float:
    try:
        with Image.open(path) as image:
            width, height = ImageOps.exif_transpose(image).size
            return width / max(height, 1)
    except Exception:
        return 0.0


def optimise_image(source: Path, output: Path, max_size: int = 2000) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if not needs_update(source, output):
        return
    with Image.open(source) as raw:
        image = ImageOps.exif_transpose(raw)
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.save(output, "WEBP", quality=84, method=6)


def optimise_video(source: Path, output: Path, poster: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if needs_update(source, output) or output.stat().st_size > 95 * 1024 * 1024:
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-i",
                str(source),
                "-vf",
                "scale=1920:1920:force_original_aspect_ratio=decrease:force_divisible_by=2",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "24",
                "-maxrate",
                "10M",
                "-bufsize",
                "20M",
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
    if not poster.exists() or poster.stat().st_mtime < output.stat().st_mtime:
        subprocess.run(
            [
                "/opt/homebrew/bin/ffmpeg",
                "-y",
                "-ss",
                "1",
                "-i",
                str(output),
                "-frames:v",
                "1",
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
    if project_key in {"touching-resonance", "science-gallery", "artist-workshops"}:
        return "Workshop documentation"
    if is_hero:
        return "Installation view"
    if name.startswith("screenshot") or name.startswith("main1") or "sub1" in name or "3d" in name:
        return "Real-time visual state"
    return "Installation documentation"


def process_file(source: Path, source_root: Path, destination_folder: Path) -> tuple[str, str | None, bool]:
    name = stable_name(source, source_root)
    is_video = source.suffix.casefold() in VIDEO_EXTENSIONS
    if is_video:
        output = destination_folder / f"{name}.mp4"
        poster = destination_folder / f"{name}-poster.jpg"
        optimise_video(source, output, poster)
        return output.relative_to(SITE_ROOT).as_posix(), poster.relative_to(SITE_ROOT).as_posix(), True
    output = destination_folder / f"{name}.webp"
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


def build_manifest(source_root: Path) -> dict[str, object]:
    manifest: dict[str, object] = {"profile": None, "projects": {}, "showreel": [], "visualIndex": []}
    identities: dict[str, dict[str, tuple[str, str, str, str]]] = {}

    profile_files = media_files(source_root / "artist/profile")
    if profile_files:
        source = profile_files[0]
        src, _, _ = process_file(source, source_root, MEDIA_ROOT / "profile")
        manifest["profile"] = {
            "src": src,
            "alt": "Minnie Park with Meta Rose: The Funeral",
        }

    for relative, project_key, destination_name, title, year in PROJECT_SOURCES:
        folder = source_root / relative
        files = media_files(folder)
        if not files:
            continue
        print(f"Processing {title}: {len(files)} media items", flush=True)

        hero_candidates = [path for path in files if "hero" in path.relative_to(folder).parts and path.suffix.casefold() in IMAGE_EXTENSIONS]
        hero_source = max(hero_candidates, key=image_ratio) if hero_candidates else None
        project_data = manifest["projects"].setdefault(project_key, {"hero": None, "gallery": []})
        destination = MEDIA_ROOT / destination_name

        for source in files:
            src, poster, is_video = process_file(source, source_root, destination)
            is_hero = source == hero_source
            context = context_for(source, is_video, is_hero, project_key)
            item = {
                "src": src,
                "alt": f"{title} — {context}",
            }
            if poster:
                item["poster"] = poster

            if is_hero and not is_video and project_data["hero"] is None:
                project_data["hero"] = item
            else:
                project_data["gallery"].append(item)

            index_item = {
                "src": src,
                "title": title,
                "year": year,
                "context": context,
                "project": project_key,
            }
            if poster:
                index_item["poster"] = poster
            manifest["visualIndex"].append(index_item)
            identities.setdefault(content_digest(source), {})[project_key] = (project_key, title, year, context)

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
            # Keep every selected visual without guessing its title or date.
            project, title, year, context = None, "", "", "Selected audio-visual work by Minnie Park"
            print(f"Included selected image without a project label: {source.name}", flush=True)
        src, poster, _ = process_file(source, source_root, MEDIA_ROOT / "showreel")
        item = {
            "src": src,
            "alt": f"{title} — {context}" if title else context,
            "title": title,
            "year": year,
            "project": project,
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

    manifest = build_manifest(args.source)
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
