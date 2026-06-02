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
    city_id: str | None = None,
) -> list[Monument]:
    stmt = select(Monument).where(Monument.updated_at > since)
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_monument_translations(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[MonumentTranslation]:
    stmt = (
        select(MonumentTranslation)
        .join(Monument, Monument.id == MonumentTranslation.monument_id)
        .where(MonumentTranslation.updated_at > since)
    )
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_deleted_monument_ids(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[str]:
    stmt = select(Monument.id).where(
        Monument.deleted.is_(True),
        Monument.updated_at > since,
    )
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_field_configs(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[MonumentFieldConfig]:
    stmt = (
        select(MonumentFieldConfig)
        .join(Monument, Monument.id == MonumentFieldConfig.monument_id)
        .where(MonumentFieldConfig.updated_at > since)
    )
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_routes(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[Route]:
    stmt = select(Route).where(Route.updated_at > since)
    if city_id is not None:
        stmt = (
            stmt.join(RouteStop, RouteStop.route_id == Route.id)
            .join(Monument, Monument.id == RouteStop.monument_id)
            .where(Monument.city_id == city_id)
            .distinct()
        )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_route_translations(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[RouteTranslation]:
    stmt = (
        select(RouteTranslation)
        .join(Route, Route.id == RouteTranslation.route_id)
        .where(RouteTranslation.updated_at > since)
    )
    if city_id is not None:
        stmt = (
            stmt.join(RouteStop, RouteStop.route_id == Route.id)
            .join(Monument, Monument.id == RouteStop.monument_id)
            .where(Monument.city_id == city_id)
            .distinct()
        )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_updated_route_stops(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[RouteStop]:
    stmt = (
        select(RouteStop)
        .join(Monument, Monument.id == RouteStop.monument_id)
        .where(RouteStop.updated_at > since)
    )
    if city_id is not None:
        stmt = stmt.where(Monument.city_id == city_id)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_deleted_route_ids(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
) -> list[str]:
    stmt = select(Route.id).where(
        Route.deleted.is_(True),
        Route.updated_at > since,
    )
    if city_id is not None:
        stmt = (
            stmt.join(RouteStop, RouteStop.route_id == Route.id)
            .join(Monument, Monument.id == RouteStop.monument_id)
            .where(Monument.city_id == city_id)
            .distinct()
        )

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def sync_data(
    db: AsyncSession,
    since: datetime,
    city_id: str | None = None,
):
    monuments = await get_updated_monuments(
        db,
        since,
        city_id,
    )

    monument_translations = await get_updated_monument_translations(
        db,
        since,
        city_id,
    )

    field_configs = await get_updated_field_configs(
        db,
        since,
        city_id,
    )

    routes = await get_updated_routes(
        db,
        since,
        city_id,
    )

    route_stops = await get_updated_route_stops(
        db,
        since,
        city_id,
    )

    route_translations = await get_updated_route_translations(
        db,
        since,
        city_id,
    )

    deleted_monuments = await get_deleted_monument_ids(
        db,
        since,
        city_id,
    )

    deleted_routes = await get_deleted_route_ids(
        db,
        since,
        city_id,
    )

    return {
        "monuments": monuments,
        "monument_translations": monument_translations,
        "monument_field_configs": field_configs,
        "routes": routes,
        "route_stops": route_stops,
        "route_translations": route_translations,
        "deleted_ids": {
            "monuments": deleted_monuments,
            "routes": deleted_routes,
        },
    }
