from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.monument import Monument
from app.models.monument_translation import MonumentTranslation


async def get_monuments(db: AsyncSession) -> list[Monument]:
    stmt = (
        select(Monument)
        .where(Monument.deleted.is_(False))
        .order_by(Monument.sort_order)
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_monument_by_city(
    db: AsyncSession,
    city_id: str,
) -> list[Monument]:
    stmt = (
        select(Monument)
        .where(
            Monument.deleted.is_(False),
            Monument.city_id == city_id,
        )
        .order_by(Monument.sort_order)
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_monument_by_id(
    db: AsyncSession,
    monument_id: str,
) -> Monument | None:
    stmt = (
        select(Monument)
        .options(
            selectinload(Monument.translations),
        )
        .where(
            Monument.id == monument_id,
            Monument.deleted.is_(False),
        )
    )

    result = await db.execute(stmt)

    return result.scalar_one_or_none()


async def get_monuments_paginated(
    db: AsyncSession,
    limit: int,
    offset: int,
) -> list[Monument]:
    stmt = (
        select(Monument)
        .where(Monument.deleted.is_(False))
        .order_by(Monument.sort_order)
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def search_monuments(
    db: AsyncSession,
    query: str,
    lang: str,
    limit: int = 20,
):
    stmt = (
        select(
            Monument.id,
            Monument.lat,
            Monument.lon,
            Monument.image_url,
            MonumentTranslation.field_value.label("name"),
        )
        .join(MonumentTranslation)
        .where(
            Monument.deleted.is_(False),
            MonumentTranslation.field_key == "name",
            MonumentTranslation.lang == lang,
            MonumentTranslation.field_value.ilike(f"%{query}%"),
        )
        .limit(limit)
    )

    result = await db.execute(stmt)

    return result.all()
