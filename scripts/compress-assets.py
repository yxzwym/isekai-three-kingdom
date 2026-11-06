"""Publish high-quality WebP assets at source resolution and update runtime crops.

Requires Pillow with WebP support. Original source art remains in Git history and
the image generation records; only compressed images belong in the game package.
"""
import json
from pathlib import Path

from PIL import Image, features

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "assets/compression-report.json"


def scale_crop(crop, entry):
    result = dict(crop)
    for key, axis in [("x", 0), ("width", 0), ("y", 1), ("height", 1)]:
        if key in result:
            result[key] = round(result[key] * entry["size"][axis] / entry["originalSize"][axis], 3)
    return result


def update_manifest(value, converted):
    if isinstance(value, str):
        return converted[value]["src"] if value in converted else value
    if isinstance(value, list):
        return [update_manifest(item, converted) for item in value]
    if not isinstance(value, dict):
        return value
    entry = converted.get(value.get("src"))
    result = {key: update_manifest(item, converted) for key, item in value.items()}
    if entry:
        for axis, key in enumerate(["width", "height"]):
            if key in result:
                result[key] = entry["size"][axis]
        if isinstance(result.get("crop"), dict):
            result["crop"] = scale_crop(result["crop"], entry)
        if isinstance(result.get("dialogueCrop"), dict):
            result["dialogueCrop"] = scale_crop(result["dialogueCrop"], entry)
        if isinstance(result.get("portrait"), dict) and "src" not in result["portrait"]:
            result["portrait"] = scale_crop(result["portrait"], entry)
    return result


def main():
    if not features.check("webp"):
        raise RuntimeError("Pillow needs WebP support")
    sources = sorted(path for path in (ROOT / "assets").rglob("*")
                     if path.suffix.lower() in {".png", ".jpg", ".jpeg"})
    if not sources:
        print("No new PNG/JPEG sources; compressed images are already up to date.")
        return
    converted, runtime_converted = {}, {}
    for source in sources:
        quality = 90
        dest = source.with_suffix(".webp")
        previous_size = list(Image.open(dest).size) if dest.exists() else None
        with Image.open(source) as image:
            original_size = list(image.size)
            image.save(dest, "WEBP", quality=quality, alpha_quality=100, method=6)
            size = list(image.size)
            transparent = "A" in image.getbands()
        with Image.open(dest) as check:
            check.load()
            if list(check.size) != size or (transparent and "A" not in check.getbands()):
                raise RuntimeError(f"Invalid compressed image: {dest}")
        old = "./" + source.relative_to(ROOT).as_posix()
        converted[old] = {"src": "./" + dest.relative_to(ROOT).as_posix(),
                          "originalBytes": source.stat().st_size, "bytes": dest.stat().st_size,
                          "originalSize": original_size, "size": size,
                          "quality": quality, "transparent": transparent}
        runtime_converted[old] = converted[old]
        if previous_size:
            runtime_converted[converted[old]["src"]] = {**converted[old], "originalSize": previous_size}
    for relative in ["assets/game/manifest.json", "assets/characters/manifest.json"]:
        path = ROOT / relative
        data = update_manifest(json.loads(path.read_text()), runtime_converted)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    for path in (ROOT / "js").glob("*.js"):
        old = path.read_text()
        updated = old
        for src, entry in converted.items():
            updated = updated.replace(src, entry["src"])
        if updated != old:
            path.write_text(updated)
    previous = json.loads(REPORT.read_text()).get("images", {}) if REPORT.exists() else {}
    previous.update(converted)
    REPORT.write_text(json.dumps({"schemaVersion": 1, "format": "webp", "images": previous},
                                 ensure_ascii=False, indent=2) + "\n")
    # Remove the large sources only after all encodes and runtime references succeed.
    for source in sources:
        source.unlink()
    before = sum(entry["originalBytes"] for entry in converted.values())
    after = sum(entry["bytes"] for entry in converted.values())
    print(f"{len(converted)} images: {before:,} -> {after:,} bytes ({100 * (1-after/before):.1f}% smaller)")


if __name__ == "__main__":
    main()
