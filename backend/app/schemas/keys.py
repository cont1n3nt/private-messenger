from pydantic import BaseModel

class KeysBase(BaseModel):
    sign_public_key: str
    dh_public_key: str


class KeysInitRequest(KeysBase):
    pass


class KeysData(KeysBase):
    pass