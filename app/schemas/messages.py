from pydantic import BaseModel
from datetime import datetime


class SendMessageRequest(BaseModel):
    ciphertext: str
    nonce: int
    

class MessageOut(BaseModel):
    id: int
    sender_id: int
    ciphertext: str
    nonce: int
    created_at: datetime
    
    model_config = {"from_attributes": True}