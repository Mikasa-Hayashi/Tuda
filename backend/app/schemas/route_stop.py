from pydantic import BaseModel


class RouteStopResponse(BaseModel):
    route_id: str
    monument_id: str
    order_index: int

    model_config = {
        "from_attributes": True,
    }
