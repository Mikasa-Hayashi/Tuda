from pydantic import BaseModel

from app.schemas.monument import MonumentResponse
from app.schemas.route_translation import RouteTranslationResponse


class RouteStopDetailResponse(BaseModel):
    order_index: int
    monument: MonumentResponse

    model_config = {
        "from_attributes": True,
    }


class RouteDetailResponse(BaseModel):
    id: str
    cover_monument_id: str
    sort_order: int

    translations: list[RouteTranslationResponse]
    stops: list[RouteStopDetailResponse]

    model_config = {
        "from_attributes": True,
    }
