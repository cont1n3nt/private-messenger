from pydantic import BaseModel, Field
from datetime import datetime

_HEX64 = Field(pattern=r"^[0-9a-f]{64}$")
_HEX128 = Field(pattern=r"^[0-9a-f]{128}$")

class ChallengeRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")

class ChallengeData(BaseModel):
    challenge: str

class VerifyRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")
    challenge: str = _HEX64
    signature: str = _HEX128

class TokenData(BaseModel):
    token: str
    expires_at: datetime

class MeData(BaseModel):
    id: int
    username: str