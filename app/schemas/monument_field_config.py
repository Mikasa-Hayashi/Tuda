from pydantic import BaseModel


class MonumentFieldConfigResponse(BaseModel):
    id: int
    monument_id: str

    section: str
    order_index: int

    label_key: str
    field_key: str

    static_value: str | None

    model_config = {
        "from_attributes": True,
    }
