from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.sync import SyncResponse
from app.services.sync_service import sync_data

router = APIRouter()


@router.get(
    "/",
    response_model=SyncResponse,
)
async def sync(
    since: datetime,
    city_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    # Client sends a zoned ISO time ("...Z"); the columns are naive UTC.
    if since.tzinfo is not None:
        since = since.astimezone(UTC).replace(tzinfo=None)
    return await sync_data(
        db,
        since,
        city_id,
    )
