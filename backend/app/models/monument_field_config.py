from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin


class MonumentFieldConfig(Base, TimestampMixin):
    __tablename__ = "monument_field_configs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    monument_id: Mapped[str] = mapped_column(
        ForeignKey("monuments.id"),
    )

    section: Mapped[str] = mapped_column(String)

    order_index: Mapped[int] = mapped_column(Integer)

    label_key: Mapped[str] = mapped_column(String)

    field_key: Mapped[str] = mapped_column(String)

    static_value: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    monument = relationship(
        "Monument",
        back_populates="field_configs",
    )
