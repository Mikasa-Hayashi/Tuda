from pydantic import BaseModel

from app.schemas.monument_field_config import MonumentFieldConfigResponse


class MonumentTranslationResponse(BaseModel):
    monument_id: str
    lang: str
    field_key: str
    field_value: str

    model_config = {
        "from_attributes": True,
    }


class MonumentDetailResponse(BaseModel):
    id: str
    city_id: str
    lat: float
    lon: float
    image_url: str
    sort_order: int
    tags: list[str] = []
    popularity: int = 0

    translations: list[MonumentTranslationResponse]
    field_configs: list[MonumentFieldConfigResponse] = []

    model_config = {
        "from_attributes": True,
    }
