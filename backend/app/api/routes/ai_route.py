import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.ai_route import AiRouteRequest, AiRouteResponse
from app.services.ai_route_service import build_ai_route
from app.services.gigachat_client import GigaChatError

router = APIRouter()
log = logging.getLogger(__name__)


@router.post("", response_model=AiRouteResponse)
async def ai_route(req: AiRouteRequest, db: AsyncSession = Depends(get_db)):
    if not settings.GIGACHAT_AUTH_KEY:
        raise HTTPException(status_code=503, detail="AI is not configured")
    try:
        return await build_ai_route(db, req)
    except (GigaChatError, ValueError, KeyError) as exc:
        log.warning("ai-route failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI route failed") from exc
