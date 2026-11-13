from fastapi import APIRouter

from app.api.routes import ai_route, auth, monuments, routes, sync

api_router = APIRouter()

api_router.include_router(monuments.router, prefix="/monuments", tags=["monuments"])
api_router.include_router(routes.router, prefix="/routes", tags=["routes"])
api_router.include_router(sync.router, prefix="/sync", tags=["sync"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai_route.router, prefix="/ai-route", tags=["ai-route"])
