from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.route import Route


class RouteTranslation(Base, TimestampMixin):
    __tablename__ = "route_translations"

    route_id: Mapped[str] = mapped_column(
        ForeignKey("routes.id"),
        primary_key=True,
    )

    lang: Mapped[str] = mapped_column(String, primary_key=True)

    name: Mapped[str] = mapped_column(String)

    description: Mapped[str] = mapped_column(String)

    route: Mapped["Route"] = relationship(
        back_populates="translations",
    )
