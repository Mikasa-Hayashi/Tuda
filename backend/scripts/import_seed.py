import asyncio
import json
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.monument import Monument
from app.models.monument_translation import MonumentTranslation
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.route_translation import RouteTranslation

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str):
    with open(DATA_DIR / filename, encoding="utf-8") as file:
        return json.load(file)


async def clear_database(session: AsyncSession):
    await session.execute(delete(MonumentTranslation))
    await session.execute(delete(Monument))
    await session.execute(delete(RouteTranslation))
    await session.execute(delete(RouteStop))
    await session.execute(delete(Route))
    await session.commit()


async def import_monuments(session: AsyncSession):
    monuments = load_json("monuments.json")

    for item in monuments:
        session.add(
            Monument(
                id=item["id"],
                city_id=item["city_id"],
                lat=item["lat"],
                lon=item["lon"],
                image_url=item["image_url"],
                sort_order=item["sort_order"],
            )
        )

    await session.commit()


async def import_monument_translations(session: AsyncSession):
    monument_translations = load_json("monument_translations.json")

    for item in monument_translations:
        session.add(
            MonumentTranslation(
                monument_id=item["monument_id"],
                lang=item["lang"],
                field_key=item["field_key"],
                field_value=item["field_value"],
            )
        )

    await session.commit()


async def import_routes(session: AsyncSession):
    routes = load_json("routes.json")

    for item in routes:
        session.add(
            Route(
                id=item["id"],
                cover_monument_id=item["cover_monument_id"],
                sort_order=item["sort_order"],
            )
        )

    await session.commit()


async def import_route_translations(session: AsyncSession):
    route_translations = load_json("route_translations.json")

    for item in route_translations:
        session.add(
            RouteTranslation(
                route_id=item["route_id"],
                lang=item["lang"],
                name=item["name"],
                description=item["description"],
            )
        )

    await session.commit()


async def import_route_stops(session: AsyncSession):
    route_stops = load_json("route_stops.json")

    for item in route_stops:
        session.add(
            RouteStop(
                route_id=item["route_id"],
                monument_id=item["monument_id"],
                order_index=item["order_index"],
            )
        )

    await session.commit()


async def main():
    async with AsyncSessionLocal() as session:
        await clear_database(session)
        await import_monuments(session)
        await import_monument_translations(session)
        await import_routes(session)
        await import_route_translations(session)
        await import_route_stops(session)


if __name__ == "__main__":
    asyncio.run(main())
