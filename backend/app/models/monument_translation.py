from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.monument import Monument


class MonumentTranslation(Base, TimestampMixin):
    __tablename__ = "monument_translations"

    monument_id: Mapped[str] = mapped_column(
        ForeignKey("monuments.id"),
        primary_key=True,
    )

    lang: Mapped[str] = mapped_column(String, primary_key=True)

    field_key: Mapped[str] = mapped_column(String, primary_key=True)

    field_value: Mapped[str] = mapped_column(String)

    monument: Mapped["Monument"] = relationship(
        back_populates="translations",
    )
