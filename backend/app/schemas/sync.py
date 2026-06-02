from pydantic import BaseModel

from app.schemas.monument import MonumentResponse
from app.schemas.monument_detail import MonumentTranslationResponse
from app.schemas.monument_field_config import MonumentFieldConfigResponse
from app.schemas.route import RouteResponse
from app.schemas.route_stop import RouteStopResponse
from app.schemas.route_translation import RouteTranslationResponse


class DeletedIdsResponse(BaseModel):
    monuments: list[str]
    routes: list[str]


class SyncResponse(BaseModel):
    monuments: list[MonumentResponse]
    monument_translations: list[MonumentTranslationResponse]
    monument_field_configs: list[MonumentFieldConfigResponse]

    routes: list[RouteResponse]
    route_stops: list[RouteStopResponse]
    route_translations: list[RouteTranslationResponse]

    deleted_ids: DeletedIdsResponse
