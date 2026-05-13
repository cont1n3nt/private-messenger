from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import base64
import binascii

_HEX48 = Field(pattern=r"^[0-9a-f]{48}$")

_B64_PATTERN = r"^[A-Za-z0-9+/]+={0,2}$"

class SendMessageRequest(BaseModel):
    ciphertext: str = Field(..., max_length=65536, pattern=_B64_PATTERN)
    nonce: str = _HEX48
    reply_to_message: int = Field(default=-1, ge=-1)

    @field_validator("ciphertext")
    @classmethod
    def validate_ciphertext(cls, value: str) -> str:
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("ciphertext must be valid base64") from exc
        if len(decoded) < 16:
            raise ValueError("ciphertext is too short")
        return value

class EditMessageRequest(BaseModel):
    message_id: int = Field(..., gt=0)
    ciphertext: str = Field(..., max_length=65536, pattern=_B64_PATTERN)
    nonce: str = _HEX48

    @field_validator("ciphertext")
    @classmethod
    def validate_ciphertext(cls, value: str) -> str:
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("ciphertext must be valid base64") from exc
        if len(decoded) < 16:
            raise ValueError("ciphertext is too short")   
        return value

class DeleteMessageRequest(BaseModel):
    message_id: int = Field(..., gt=0)

class MessageOut(BaseModel):
    id: int
    sender_id: int
    ciphertext: str
    nonce: str
    created_at: datetime
    edited_content: bool
    reply_to_message: int

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
