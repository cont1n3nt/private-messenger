from pydantic import BaseModel
from typing import TypeVar, Generic

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    

class APIResponse(BaseModel, Generic[T]):
    # Универсальная модель для всех ответов API
    success: bool
    data: T | None = None
    error: ErrorDetail | None = None

    @classmethod
    def ok(cls, data: T) -> "APIResponse[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def failure(cls, code: str, message: str) -> "APIResponse[None]":
        return cls(
            success=False,
            data=None,
            error=ErrorDetail(code=code, message=message),
        )