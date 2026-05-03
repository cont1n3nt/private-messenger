from pydantic import BaseModel
from datetime import datetime


class ChallengeRequest(BaseModel):
    username: str
    
class ChallengeData(BaseModel):
    challenge: str
    
class VerifyRequest(BaseModel):
    username: str
    challenge: str
    signature: str

class TokenData(BaseModel):
    token: str
    expires_at: datetime
    
class MeData(BaseModel):
    id: int
    username: str