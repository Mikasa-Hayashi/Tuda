from sqlalchemy import func, select
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
    city_id: str | None = None,
) -> list[Monument]:
    stmt = select(Monument).where(Monument.deleted.is_(False))
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)
    stmt = stmt.order_by(Monument.sort_order).limit(limit).offset(offset)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def search_monuments(
    db: AsyncSession,
    query: str,
    lang: str,
    limit: int = 20,
    city_id: str | None = None,
):
    filters = [
        Monument.deleted.is_(False),
        MonumentTranslation.field_key == "name",
        MonumentTranslation.lang == lang,
        MonumentTranslation.field_value.ilike(f"%{query}%"),
    ]
    if city_id is not None:
        filters.append(Monument.city_id == city_id)

    stmt = (
        select(
            Monument.id,
            Monument.lat,
            Monument.lon,
            Monument.image_url,
            MonumentTranslation.field_value.label("name"),
        )
        .join(MonumentTranslation)
        .where(*filters)
        .limit(limit)
    )

    result = await db.execute(stmt)

    return result.all()


async def get_monument_counts_by_city(db: AsyncSession) -> dict[str, int]:
    stmt = (
        select(Monument.city_id, func.count())
        .where(Monument.deleted.is_(False))
        .group_by(Monument.city_id)
    )

    result = await db.execute(stmt)

    return {city_id: count for city_id, count in result.all()}
