from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import base64

_HEX48 = Field(pattern=r"^[0-9a-f]{48}$")

class SendMessageRequest(BaseModel):
    ciphertext: str
    nonce: str = _HEX48


class MessageOut(BaseModel):
    id: int
    sender_id: int
    ciphertext: str
    nonce: str
    created_at: datetime

    @field_validator("ciphertext", mode="before")
    @classmethod
    def bytes_to_base64(cls, v: bytes | str) -> str:
        if isinstance(v, bytes):
            return base64.b64encode(v).decode()
        return v

    @field_validator("nonce", mode="before")
    @classmethod
    def bytes_to_hex(cls, v: bytes | str) -> str:
        if isinstance(v, bytes):
            return v.hex()
        return v
    model_config = {"from_attributes": True}