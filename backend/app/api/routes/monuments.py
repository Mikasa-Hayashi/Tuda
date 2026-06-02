from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.monument import MonumentResponse, MonumentSearchResponse
from app.schemas.monument_detail import MonumentDetailResponse
from app.services.monument_service import (
    get_monument_by_city,
    get_monument_by_id,
    get_monuments,
    get_monuments_paginated,
    search_monuments,
)

router = APIRouter()


@router.get(
    "/",
    response_model=list[MonumentResponse],
)
async def monument_list(
    city_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    if city_id is not None:
        return await get_monument_by_city(db, city_id)
    return await get_monuments(db)


@router.get(
    "/search",
    response_model=list[MonumentSearchResponse],
)
async def search(
    q: str,
    lang: str,
    city_id: str | None = Query(default=None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await search_monuments(db, q, lang, limit, city_id)


@router.get(
    "/{monument_id}",
    response_model=MonumentDetailResponse,
)
async def monument_detail(
    monument_id: str,
    db: AsyncSession = Depends(get_db),
):
    monument = await get_monument_by_id(
        db,
        monument_id,
    )

    if monument is None:
        raise HTTPException(
            status_code=404,
            detail="Monument not found",
        )

    return monument


@router.get(
    "",
    response_model=list[MonumentResponse],
)
async def monuments_list(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    city_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    return await get_monuments_paginated(db, limit, offset, city_id)
