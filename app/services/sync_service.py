from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monument import Monument
from app.models.monument_field_config import MonumentFieldConfig
from app.models.monument_translation import MonumentTranslation
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.route_translation import RouteTranslation


async def get_updated_monuments(
    db: AsyncSession,
    since: datetime,
) -> list[Monument]:
    stmt = select(Monument).where(Monument.updated_at > since)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_monument_translations(
    db: AsyncSession,
    since: datetime,
) -> list[MonumentTranslation]:
    stmt = select(MonumentTranslation).where(MonumentTranslation.updated_at > since)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_deleted_monument_ids(
    db: AsyncSession,
    since: datetime,
) -> list[str]:
    stmt = select(Monument.id).where(
        Monument.deleted.is_(True),
        Monument.updated_at > since,
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_field_configs(
    db: AsyncSession,
    since: datetime,
) -> list[MonumentFieldConfig]:
    stmt = select(MonumentFieldConfig).where(
        MonumentFieldConfig.updated_at > since,
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_routes(
    db: AsyncSession,
    since: datetime,
) -> list[Route]:
    stmt = select(Route).where(Route.updated_at > since)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_route_translations(
    db: AsyncSession,
    since: datetime,
) -> list[RouteTranslation]:
    stmt = select(RouteTranslation).where(RouteTranslation.updated_at > since)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_route_stops(
    db: AsyncSession,
    since: datetime,
) -> list[RouteStop]:
    stmt = select(RouteStop).where(RouteStop.updated_at > since)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_deleted_route_ids(
    db: AsyncSession,
    since: datetime,
) -> list[str]:
    stmt = select(Route.id).where(
        Route.deleted.is_(True),
        Route.updated_at > since,
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def sync_data(
    db: AsyncSession,
    since: datetime,
):
    monuments = await get_updated_monuments(
        db,
        since,
    )

    monument_translations = await get_updated_monument_translations(
        db,
        since,
    )

    routes = await get_updated_routes(
        db,
        since,
    )

    route_stops = await get_updated_route_stops(
        db,
        since,
    )

    route_translations = await get_updated_route_translations(
        db,
        since,
    )

    deleted_monuments = await get_deleted_monument_ids(
        db,
        since,
    )

    deleted_routes = await get_deleted_route_ids(
        db,
        since,
    )

    return {
        "monuments": monuments,
        "monument_translations": monument_translations,
        "routes": routes,
        "route_stops": route_stops,
        "route_translations": route_translations,
        "deleted_ids": {
            "monuments": deleted_monuments,
            "routes": deleted_routes,
        },
    }
