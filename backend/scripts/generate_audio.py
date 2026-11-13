"""
Generate audio-guide mp3 files with edge-tts (neural voices).

Text per monument/language = "<name>. <short_description>":
  ru/en come from data/monument_translations.json,
  ar/zh come from data/audio_scripts_extra.json (written translations).

Output: static/audio/<monument_id>_<lang>.mp3  (served at /static/audio/...)
Also writes static/audio/manifest.json with file sizes (bytes).

Usage:
  python -m scripts.generate_audio            # only missing files
  python -m scripts.generate_audio --force    # regenerate everything
"""

import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "static" / "audio"

VOICES = {
    "ru": "ru-RU-SvetlanaNeural",
    "en": "en-GB-SoniaNeural",
    "ar": "ar-SA-ZariyahNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
}


def load_texts() -> dict[str, dict[str, str]]:
    texts: dict[str, dict[str, str]] = {}
    rows = json.loads((DATA_DIR / "monument_translations.json").read_text("utf-8"))
    fields: dict[tuple[str, str], dict[str, str]] = {}
    for r in rows:
        fields.setdefault((r["monument_id"], r["lang"]), {})[r["field_key"]] = r[
            "field_value"
        ]
    for (mid, lang), f in fields.items():
        if lang in VOICES and "name" in f and "short_description" in f:
            texts.setdefault(mid, {})[lang] = f"{f['name']}. {f['short_description']}"

    extra_path = DATA_DIR / "audio_scripts_extra.json"
    if extra_path.exists():
        extra = json.loads(extra_path.read_text("utf-8"))
        for mid, by_lang in extra.items():
            texts.setdefault(mid, {}).update(by_lang)
    return texts


async def main(force: bool) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    texts = load_texts()
    jobs = [(m, lang, t) for m, by in sorted(texts.items()) for lang, t in by.items()]
    print(f"{len(jobs)} files")

    for monument_id, lang, text in jobs:
        path = OUT_DIR / f"{monument_id}_{lang}.mp3"
        if path.exists() and not force:
            continue
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, VOICES[lang]).save(str(path))
                print(f"  ok {path.name}")
                break
            except Exception as exc:  # network hiccups
                print(f"  retry {path.name}: {exc}")
                await asyncio.sleep(2)
        else:
            print(f"  FAILED {path.name}")

    manifest = {p.stem: p.stat().st_size for p in sorted(OUT_DIR.glob("*.mp3"))}
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=1), "utf-8")
    print(f"manifest: {len(manifest)} files")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    asyncio.run(main(parser.parse_args().force))
