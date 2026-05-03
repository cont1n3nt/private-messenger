from pydantic import BaseModel

class KeysInitRequest(BaseModel):
    sign_public_key: str
    dh_public_key: str
    
class KeysData(BaseModel):
    sign_public_key: str
    dh_public_key: str