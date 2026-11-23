"""Tuda ML service: POST /recognize (multipart image) -> monument id."""

import io
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

from app.classifier import Classifier, load_classifier

_clf: Classifier | None = None

# The model squashes any frame to 224x224, so a 3:4 (or 16:9) photo would be distorted.
# Crop the centre square (side = the shorter side: the width of a portrait shot) instead.
# TUDA_CROP=0 turns it off.
CROP_SQUARE = os.environ.get("TUDA_CROP", "1") != "0"


def _center_square(img: Image.Image, frac: float = 1.0) -> Image.Image:
    """Centre square of side `frac` * the shorter side. The app sends `frac` = scan-frame width /
    preview width, so the crop is exactly what is inside the on-screen frame."""
    if not CROP_SQUARE:
        return img
    w, h = img.size
    side = max(1, int(min(w, h) * min(max(frac, 0.3), 1.0)))
    left, top = (w - side) // 2, (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def get_classifier() -> Classifier:
    global _clf
    if _clf is None:
        _clf = load_classifier()
    return _clf


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.environ.get("TUDA_LAZY") != "1":
        clf = get_classifier()
        clf.predict(Image.new("RGB", (224, 224), (128, 128, 128)))  # warm-up
        print(f"[tuda-ml] ready: {len(clf.classes)} classes, {clf.n_refs} ref photos")
    yield


app = FastAPI(title="Tuda ML", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.get("/health")
def health():
    clf = get_classifier()
    return {
        "ok": True,
        "monuments": sum(not c["neg"] for c in clf.classes),
        "refs": clf.n_refs,
        "threshold": clf.threshold,
        "margin": clf.margin,
    }


@app.post("/recognize")
async def recognize(
    image: UploadFile = File(...),
    lang: str = Form(default="ru"),
    crop: float = Form(default=1.0),
):
    data = await image.read()
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, "Unreadable image") from exc
    raw = img.copy()
    img = _center_square(img, crop)
    img.thumbnail((640, 640))
    result =get_classifier().predict(img, lang)
    top = ", ".join(f"{t['id'] or 'neg'}={t['p']:.2f}" for t in result.top[:3])
    print(f"[tuda-ml] {'OK ' if result.recognized else 'NO '} {top} margin={result.margin:.2f}")
    # Keep the frames the phone sends, so weak cards can be tuned against real data.
    try:
        debug = Path(__file__).resolve().parent.parent / "debug"
        debug.mkdir(exist_ok=True)
        stem = f"{time.strftime('%H%M%S')}_{result.top[0]['id'] or 'neg'}_{result.top[0]['p']:.2f}"
        img.save(debug / f"{stem}.jpg", quality=85)
        # The frame as the phone sent it (orientation fixed), before the square crop.
        raw.save(debug / f"{stem}_raw.jpg", quality=85)
    except Exception:
        pass
    return result.__dict__
