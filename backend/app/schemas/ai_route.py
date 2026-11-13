from typing import Literal

from pydantic import BaseModel, Field


class AiRouteRequest(BaseModel):
    city_id: str | None = None
    lang: str = "ru"
    time: Literal["couple", "half", "full"] = "half"
    age: Literal["kids", "adults", "family"] = "adults"
    topics: list[str] = Field(default_factory=list)


class AiRouteResponse(BaseModel):
    monument_ids: list[str]
    summary: str = ""
