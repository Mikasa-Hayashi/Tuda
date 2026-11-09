from pydantic import BaseModel

from app.schemas.monument_detail import MonumentTranslationResponse


class MonumentResponse(BaseModel):
    id: str
    city_id: str
    lat: float
    lon: float
    image_url: str
    sort_order: int

    model_config = {
        "from_attributes": True,
    }


class MonumentListItemResponse(MonumentResponse):
    translations: list[MonumentTranslationResponse] = []


class MonumentSearchResponse(BaseModel):
    id: str
    name: str
    image_url: str
    lat: float
    lon: float

    model_config = {
        "from_attributes": True,
    }
