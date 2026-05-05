from pydantic import BaseModel, Field
from datetime import datetime

_HEX64 = Field(pattern=r"^[0-9a-f]{64}$")
_HEX128 = Field(pattern=r"^[0-9a-f]{128}$")

class ChallengeRequest(BaseModel):
    username: str

class ChallengeData(BaseModel):
    challenge: str

class VerifyRequest(BaseModel):
    username: str
    challenge: str = _HEX64
    signature: str = _HEX128

class TokenData(BaseModel):
    token: str
    expires_at: datetime

class MeData(BaseModel):
    id: int
    username: str