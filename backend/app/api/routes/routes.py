from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.route_service import get_route_by_id, get_routes

router = APIRouter()


@router.get("")
async def routes_list(db: AsyncSession = Depends(get_db)):
    return await get_routes(db)


@router.get("/{route_id}")
async def route_detail(
    route_id: str,
    db: AsyncSession = Depends(get_db),
):
    route = await get_route_by_id(db, route_id)

    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    return route
