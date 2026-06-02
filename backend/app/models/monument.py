from typing import TYPE_CHECKING

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.monument_field_config import MonumentFieldConfig
    from app.models.monument_translation import MonumentTranslation


class Monument(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "monuments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    city_id: Mapped[str] = mapped_column(String, index=True)

    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)

    image_url: Mapped[str] = mapped_column(String)

    sort_order: Mapped[int] = mapped_column(Integer)

    translations: Mapped[list["MonumentTranslation"]] = relationship(
        back_populates="monument",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    field_configs: Mapped[list["MonumentFieldConfig"]] = relationship(
        back_populates="monument",
        cascade="all, delete-orphan",
    )
