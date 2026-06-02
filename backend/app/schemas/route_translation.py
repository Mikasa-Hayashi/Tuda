from pydantic import BaseModel


class RouteTranslationResponse(BaseModel):
    route_id: str
    lang: str
    name: str
    description: str

    model_config = {
        "from_attributes": True,
    }
