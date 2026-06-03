from pydantic import BaseModel


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

    translations: list[MonumentTranslationResponse]

    model_config = {
        "from_attributes": True,
    }
