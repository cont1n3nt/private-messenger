import base64
import binascii

from fastapi import Header, HTTPException, status


_AUTH_FAILED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication failed",
)


def decode_base64_field(value: str, *, field_name: str) -> bytes:
    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 encoding for {field_name}",
        ) from exc


def parse_hex_field(value: str, *, field_name: str) -> bytes:
    try:
        return bytes.fromhex(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid hex encoding for {field_name}",
        ) from exc


def extract_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if authorization is None or not authorization.startswith("Bearer "):
        raise _AUTH_FAILED

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise _AUTH_FAILED

    return token
