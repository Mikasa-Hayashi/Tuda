import json
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monument import Monument
from app.schemas.ai_route import AiRouteRequest, AiRouteResponse
from app.services import gigachat_client

STOP_COUNT = {"couple": 3, "half": 5, "full": 8}
HOURS = {"couple": "2-3", "half": "4-5", "full": "7-8"}
AGE = {
    "kids": "a family with young children (short, engaging, easy to walk)",
    "adults": "adults",
    "family": "a family with children and adults of different ages",
}
LANG_NAME = {"ru": "Russian", "en": "English", "ar": "Arabic", "zh": "Chinese"}

SYSTEM = (
    "You are a local tour guide planning a walking route. "
    "Choose stops ONLY from the provided list and reply with a single JSON object, "
    'no markdown: {"ids": ["<id>", ...], "summary": "<1-2 sentences>"}. '
    "Order the stops so the walk is geographically sensible (lat/lon are given)."
)


async def _candidates(
    db: AsyncSession, city_id: str | None, lang: str
) -> list[dict[str, object]]:
    stmt = select(Monument).where(Monument.deleted.is_(False))
    if city_id:
        stmt = stmt.where(Monument.city_id == city_id)
    stmt = stmt.order_by(Monument.sort_order)
    monuments = (await db.execute(stmt)).scalars().all()

    items: list[dict[str, object]] = []
    for m in monuments:
        by_lang: dict[str, dict[str, str]] = {}
        for t in m.translations:
            by_lang.setdefault(t.lang, {})[t.field_key] = t.field_value
        tr = by_lang.get(lang) or by_lang.get("ru") or by_lang.get("en") or {}
        items.append(
            {
                "id": m.id,
                "name": tr.get("name", m.id),
                "lat": round(m.lat, 4),
                "lon": round(m.lon, 4),
                "about": (tr.get("short_description") or "")[:160],
            }
        )
    return items


def _parse(text: str) -> dict[str, object]:
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise ValueError("no json in model reply")
    return json.loads(match.group(0))


async def build_ai_route(db: AsyncSession, req: AiRouteRequest) -> AiRouteResponse:
    items = await _candidates(db, req.city_id, req.lang)
    if not items:
        return AiRouteResponse(monument_ids=[])

    count = min(STOP_COUNT[req.time], len(items))
    topics = ", ".join(req.topics) if req.topics else "any"
    user = (
        f"Plan a route of exactly {count} stops (about {HOURS[req.time]} hours "
        f"including walking) for {AGE[req.age]}. Interests: {topics}. "
        f"Write the summary in {LANG_NAME.get(req.lang, 'Russian')}.\n"
        f"Available places (JSON):\n{json.dumps(items, ensure_ascii=False)}"
    )

    reply = await gigachat_client.chat(SYSTEM, user)
    data = _parse(reply)

    valid = {str(i["id"]) for i in items}
    ids: list[str] = []
    for raw in data.get("ids", []):  # type: ignore[attr-defined]
        if raw in valid and raw not in ids:
            ids.append(raw)
    ids = ids[:count]
    if not ids:
        raise ValueError("model returned no valid ids")

    return AiRouteResponse(
        monument_ids=ids, summary=str(data.get("summary", ""))[:400]
    )
