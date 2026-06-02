from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.route_stop import RouteStop
    from app.models.route_translation import RouteTranslation


class Route(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String, primary_key=True)

    cover_monument_id: Mapped[str] = mapped_column(String)

    sort_order: Mapped[int] = mapped_column(Integer)

    translations: Mapped[list["RouteTranslation"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    stops: Mapped[list["RouteStop"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RouteStop.order_index",
        lazy="selectin",
    )
