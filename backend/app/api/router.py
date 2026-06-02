from fastapi import APIRouter

from app.api.routes import monuments, routes, sync

api_router = APIRouter()

api_router.include_router(monuments.router, prefix="/monuments", tags=["monuments"])
api_router.include_router(routes.router, prefix="/routes", tags=["routes"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
