"""
Seed the database from JSON files in backend/data/.

Required files:
  monuments.json             – list of monument records
  monument_translations.json – list of translation records
  monument_field_configs.json – list of detail/visitor field layout records
  routes.json                – list of route records
  route_translations.json    – list of route translation records
  route_stops.json           – list of route stop records

Usage:
  python -m scripts.import_seed           # clear then import everything
  python -m scripts.import_seed --upsert  # insert/update without clearing
"""

import argparse
import asyncio
import json
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.database import AsyncSessionLocal
from app.models.monument import Monument
from app.models.monument_field_config import MonumentFieldConfig
from app.models.monument_translation import MonumentTranslation
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.route_translation import RouteTranslation

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str) -> list[dict]:
    path = DATA_DIR / filename
    if not path.exists():
        print(f"  [skip] {filename} not found")
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    print(f"  [load] {filename}: {len(data)} records")
    return data


async def clear_database(session: AsyncSession) -> None:
    print("Clearing existing data…")
    for model in (MonumentFieldConfig, MonumentTranslation, RouteStop, RouteTranslation, Route, Monument):
        await session.execute(delete(model))
    await session.commit()
    print("  done.\n")


async def import_monuments(session: AsyncSession) -> None:
    records = load_json("monuments.json")
    for item in records:
        session.add(Monument(
            id=item["id"],
            city_id=item["city_id"],
            lat=item["lat"],
            lon=item["lon"],
            image_url=item["image_url"],
            sort_order=item.get("sort_order", 0),
        ))
    await session.commit()
    print(f"  → {len(records)} monuments imported.\n")


async def import_monument_translations(session: AsyncSession) -> None:
    records = load_json("monument_translations.json")
    for item in records:
        session.add(MonumentTranslation(
            monument_id=item["monument_id"],
            lang=item["lang"],
            field_key=item["field_key"],
            field_value=item["field_value"],
        ))
    await session.commit()
    print(f"  → {len(records)} monument translations imported.\n")


async def import_monument_field_configs(session: AsyncSession) -> None:
    records = load_json("monument_field_configs.json")
    for item in records:
        session.add(MonumentFieldConfig(
            monument_id=item["monument_id"],
            section=item["section"],
            order_index=item["order_index"],
            label_key=item["label_key"],
            field_key=item.get("field_key") or "",
            static_value=item.get("static_value"),
        ))
    await session.commit()
    print(f"  → {len(records)} monument field configs imported.\n")


async def import_routes(session: AsyncSession) -> None:
    records = load_json("routes.json")
    for item in records:
        session.add(Route(
            id=item["id"],
            cover_monument_id=item.get("cover_monument_id", ""),
            sort_order=item.get("sort_order", 0),
        ))
    await session.commit()
    print(f"  → {len(records)} routes imported.\n")


async def import_route_translations(session: AsyncSession) -> None:
    records = load_json("route_translations.json")
    for item in records:
        session.add(RouteTranslation(
            route_id=item["route_id"],
            lang=item["lang"],
            name=item["name"],
            description=item["description"],
        ))
    await session.commit()
    print(f"  → {len(records)} route translations imported.\n")


async def import_route_stops(session: AsyncSession) -> None:
    records = load_json("route_stops.json")
    for item in records:
        session.add(RouteStop(
            route_id=item["route_id"],
            monument_id=item["monument_id"],
            order_index=item["order_index"],
        ))
    await session.commit()
    print(f"  → {len(records)} route stops imported.\n")


async def main(upsert: bool = False) -> None:
    async with AsyncSessionLocal() as session:
        if not upsert:
            await clear_database(session)

        print("Importing monuments…")
        await import_monuments(session)

        print("Importing monument translations…")
        await import_monument_translations(session)

        print("Importing monument field configs…")
        await import_monument_field_configs(session)

        print("Importing routes…")
        await import_routes(session)

        print("Importing route translations…")
        await import_route_translations(session)

        print("Importing route stops…")
        await import_route_stops(session)

    print("Seed complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Tuda database from JSON files.")
    parser.add_argument(
        "--upsert",
        action="store_true",
        help="Insert/update records without clearing the database first.",
    )
    args = parser.parse_args()
    asyncio.run(main(upsert=args.upsert))
