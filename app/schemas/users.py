from pydantic import BaseModel, field_validator
import base64


class UserPublic(BaseModel):
    id: int
    username: str
    sign_public_key: str
    dh_public_key: str
    
    @field_validator('sign_public_key', 'dh_public_key', mode='before')
    @classmethod
    def bytes_to_base64(cls, v: bytes | str) -> str:
        if isinstance(v, bytes):
            return base64.b64encode(v).decode()
        return v
    
    model_config = {"from_attributes": True}