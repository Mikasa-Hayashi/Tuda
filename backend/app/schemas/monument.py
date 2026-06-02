from pydantic import BaseModel


class MonumentResponse(BaseModel):
    id: str
    lat: float
    lon: float
    image_url: str
    sort_order: int

    model_config = {
        "from_attributes": True,
    }


class MonumentSearchResponse(BaseModel):
    id: str
    name: str
    image_url: str
    lat: float
    lon: float

    model_config = {
        "from_attributes": True,
    }
