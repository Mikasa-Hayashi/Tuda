import asyncio
import json
from pathlib import Path

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.monument import Monument

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str):
    with open(DATA_DIR / filename, encoding="utf-8") as file:
        return json.load(file)


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

    await session.execute(delete(Monument))
    await session.commit()


async def main():
    async with AsyncSessionLocal() as session:
        await import_monuments(session)


if __name__ == "__main__":
    asyncio.run(main())
