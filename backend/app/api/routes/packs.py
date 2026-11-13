"""Sizes of the downloadable content packs of a city (shown before downloading)."""

import json
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.monument import Monument
from app.models.route import Route

router = APIRouter()

STATIC_DIR = Path(__file__).resolve().parents[3] / "static"
AUDIO_LANGS = ("ru", "en", "ar", "zh")


class CountBytes(BaseModel):
    count: int
    bytes: int


class PacksResponse(BaseModel):
    places: CountBytes  # monuments (text is tiny) + their photos
    routes: CountBytes
    quizzes: CountBytes
    audio: dict[str, CountBytes]  # per language


def _size(path: Path) -> int:
    try:
        return path.stat().st_size
    except OSError:
        return 0


@router.get("/{city_id}", response_model=PacksResponse)
async def city_packs(city_id: str, db: AsyncSession = Depends(get_db)):
    monuments = (
        await db.execute(
            select(Monument.id, Monument.image_url).where(
                Monument.city_id == city_id, Monument.deleted.is_(False)
            )
        )
    ).all()
    ids = {m.id for m in monuments}

    photo_bytes = sum(
        _size(STATIC_DIR / "monuments" / Path(m.image_url).name) for m in monuments
    )

    route_count = 0
    for route in (
        await db.execute(select(Route).where(Route.deleted.is_(False)))
    ).scalars():
        if route.cover_monument_id in ids:
            route_count += 1

    quiz_file = STATIC_DIR / "quizzes" / f"{city_id}.json"
    quiz_count = 0
    if quiz_file.exists():
        quiz_count = len(json.loads(quiz_file.read_text("utf-8")))

    audio = {
        lang: CountBytes(
            count=sum(1 for i in ids if (STATIC_DIR / "audio" / f"{i}_{lang}.mp3").exists()),
            bytes=sum(_size(STATIC_DIR / "audio" / f"{i}_{lang}.mp3") for i in ids),
        )
        for lang in AUDIO_LANGS
    }

    return PacksResponse(
        places=CountBytes(count=len(monuments), bytes=photo_bytes),
        routes=CountBytes(count=route_count, bytes=0),
        quizzes=CountBytes(count=quiz_count, bytes=_size(quiz_file)),
        audio=audio,
    )
