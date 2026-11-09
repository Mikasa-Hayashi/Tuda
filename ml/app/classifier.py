"""Zero-shot monument recognition with SigLIP2.

Each monument is described by several visual text prompts (data/prompts.json).
The image embedding is compared to the mean prompt embedding of every class,
plus "negative" classes (faces, rooms, ...), and a softmax is taken over all
classes. Optional reference photos in refs/<monument_id>/ are blended into the
class prototype (few-shot, no training required).
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor

HERE = Path(__file__).resolve().parent.parent
BACKEND_DATA = HERE.parent / "backend" / "data"
MODEL_NAME = os.environ.get("TUDA_MODEL", "google/siglip2-base-patch16-224")
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def _tensor(x) -> torch.Tensor:
    """transformers versions return either a tensor or a ModelOutput."""
    if isinstance(x, torch.Tensor):
        return x
    pooled = getattr(x, "pooler_output", None)
    return pooled if pooled is not None else x[0]


class SigLIP:
    def __init__(self, model_name: str = MODEL_NAME) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = AutoModel.from_pretrained(model_name).to(self.device).eval()
        self.processor = AutoProcessor.from_pretrained(model_name)
        self.logit_scale = float(self.model.logit_scale.exp().item())

    @staticmethod
    def _norm(x: torch.Tensor) -> np.ndarray:
        x = x / x.norm(dim=-1, keepdim=True)
        return x.float().cpu().numpy()

    @torch.inference_mode()
    def encode_texts(self, texts: list[str]) -> np.ndarray:
        # SigLIP was trained with padding="max_length", max_length=64.
        inputs = self.processor(
            text=texts,
            padding="max_length",
            max_length=64,
            truncation=True,
            return_tensors="pt",
        ).to(self.device)
        return self._norm(_tensor(self.model.get_text_features(**inputs)))

    @torch.inference_mode()
    def encode_images(self, images: list[Image.Image]) -> np.ndarray:
        inputs = self.processor(images=images, return_tensors="pt").to(self.device)
        return self._norm(_tensor(self.model.get_image_features(**inputs)))


@dataclass
class Result:
    recognized: bool
    id: str | None
    name: str | None
    confidence: float
    margin: float
    top: list[dict] = field(default_factory=list)
    ms: float = 0.0


def _unit(v: np.ndarray) -> np.ndarray:
    return v / (np.linalg.norm(v) + 1e-9)


def _load_names() -> dict[str, dict[str, str]]:
    """monument_id -> {lang: name}, from the backend seed data."""
    path = BACKEND_DATA / "monument_translations.json"
    if not path.exists():
        return {}
    names: dict[str, dict[str, str]] = {}
    for row in json.loads(path.read_text(encoding="utf-8")):
        if row["field_key"] == "name":
            names.setdefault(row["monument_id"], {})[row["lang"]] = row["field_value"]
    return names


class Classifier:
    def __init__(
        self,
        backend: SigLIP | None = None,
        config_path: Path = HERE / "data" / "prompts.json",
        refs_dir: Path = HERE / "refs",
        threshold: float = 0.45,
        margin: float = 0.15,
        ref_weight: float = 0.5,
    ) -> None:
        self.backend = backend or SigLIP()
        self.threshold = threshold
        self.margin = margin
        self.ref_weight = ref_weight

        cfg = json.loads(Path(config_path).read_text(encoding="utf-8"))
        names = _load_names()
        self.classes: list[dict] = []
        protos: list[np.ndarray] = []

        for m in cfg["monuments"]:
            if not m.get("enabled", True):
                continue
            emb = self.backend.encode_texts(m["prompts"])
            protos.append(_unit(emb.mean(axis=0)))
            self.classes.append(
                {"id": m["id"], "names": names.get(m["id"], {}), "neg": False}
            )
        for text in cfg["negatives"]:
            protos.append(self.backend.encode_texts([text])[0])
            self.classes.append({"id": None, "names": {"en": text}, "neg": True})

        self.text_protos = np.stack(protos)
        self.protos = self.text_protos.copy()
        self.n_refs = self._load_refs(Path(refs_dir))

    def _load_refs(self, refs_dir: Path) -> int:
        if not refs_dir.exists():
            return 0
        total = 0
        for idx, c in enumerate(self.classes):
            if c["neg"]:
                continue
            folder = refs_dir / c["id"]
            if not folder.is_dir():
                continue
            files = [p for p in folder.iterdir() if p.suffix.lower() in IMG_EXT]
            if not files:
                continue
            imgs = [Image.open(p).convert("RGB") for p in files]
            emb = self.backend.encode_images(imgs).mean(axis=0)
            mixed = (1 - self.ref_weight) * self.text_protos[idx]
            mixed = mixed + self.ref_weight * _unit(emb)
            self.protos[idx] = _unit(mixed)
            total += len(files)
        return total

    def scores(self, image: Image.Image) -> np.ndarray:
        emb = self.backend.encode_images([image.convert("RGB")])[0]
        logits = self.backend.logit_scale * (self.protos @ emb)
        logits -= logits.max()
        p = np.exp(logits)
        return p / p.sum()

    def predict(self, image: Image.Image, lang: str = "ru") -> Result:
        t0 = time.perf_counter()
        p = self.scores(image)
        order = np.argsort(-p)

        def label(i: int) -> str | None:
            n = self.classes[i]["names"]
            return n.get(lang) or n.get("en") or self.classes[i]["id"]

        top = [
            {
                "id": self.classes[i]["id"],
                "name": label(i),
                "neg": self.classes[i]["neg"],
                "p": round(float(p[i]), 4),
            }
            for i in order[:4]
        ]
        best, second = order[0], order[1]
        conf = float(p[best])
        margin = float(p[best] - p[second])
        ok = (
            not self.classes[best]["neg"]
            and conf >= self.threshold
            and margin >= self.margin
        )
        return Result(
            recognized=ok,
            id=self.classes[best]["id"] if ok else None,
            name=label(best) if ok else None,
            confidence=round(conf, 4),
            margin=round(margin, 4),
            top=top,
            ms=round((time.perf_counter() - t0) * 1000, 1),
        )


def load_classifier() -> Classifier:
    return Classifier(
        threshold=float(os.environ.get("TUDA_THRESHOLD", 0.45)),
        margin=float(os.environ.get("TUDA_MARGIN", 0.15)),
    )
