"""Tuda ML service: POST /recognize (multipart image) -> monument id."""

import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

from app.classifier import Classifier, load_classifier

_clf: Classifier | None = None


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
async def recognize(image: UploadFile = File(...), lang: str = Form(default="ru")):
    data = await image.read()
    try:
        img = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, "Unreadable image") from exc
    img.thumbnail((640, 640))
    return get_classifier().predict(img, lang).__dict__
