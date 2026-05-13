from pydantic import BaseModel, Field

_B64_PATTERN = r"^[A-Za-z0-9+/]+={0,2}$"

class KeysBase(BaseModel):
    sign_public_key: str = Field(..., pattern=_B64_PATTERN)
    dh_public_key: str = Field(..., pattern=_B64_PATTERN)


class KeysInitRequest(KeysBase):
    pass


class KeysData(KeysBase):
    pass