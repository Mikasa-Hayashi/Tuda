from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.route import Route
from app.models.route_stop import RouteStop


async def get_routes(db: AsyncSession) -> list[Route]:
    stmt = select(Route).where(Route.deleted.is_(False)).order_by(Route.sort_order)

    result = await db.execute(stmt)

    return list(result.scalars().all())


async def get_route_by_id(
    db: AsyncSession,
    route_id: str,
) -> Route | None:
    stmt = (
        select(Route)
        .where(
            Route.id == route_id,
            Route.deleted.is_(False),
        )
        .options(
            selectinload(Route.translations),
            selectinload(Route.stops).selectinload(RouteStop.monument),
        )
    )

    result = await db.execute(stmt)

    return result.scalar_one_or_none()
