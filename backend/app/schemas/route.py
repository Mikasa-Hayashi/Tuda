from pydantic import BaseModel


class RouteResponse(BaseModel):
    id: str
    cover_monument_id: str
    sort_order: int

    model_config = {
        "from_attributes": True,
    }
