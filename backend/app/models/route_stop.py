from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.monument import Monument
    from app.models.route import Route


class RouteStop(Base, TimestampMixin):
    __tablename__ = "route_stops"

    route_id: Mapped[str] = mapped_column(
        ForeignKey("routes.id"),
        primary_key=True,
    )

    monument_id: Mapped[str] = mapped_column(
        ForeignKey("monuments.id"),
        primary_key=True,
    )

    order_index: Mapped[int] = mapped_column(Integer)

    route: Mapped["Route"] = relationship(
        back_populates="stops",
    )

    monument: Mapped["Monument"] = relationship()
