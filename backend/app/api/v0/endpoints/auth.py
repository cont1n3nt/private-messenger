import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Header

from sqlalchemy.ext.asyncio import AsyncSession

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.exceptions import InvalidSignature

from app.api.deps import get_db, get_current_user
from app.db.models import User
from app.db import crud
from app.schemas import (
    APIResponse,
    ChallengeRequest,
    ChallengeData,
    VerifyRequest,
    TokenData,
    MeData,
)

router = APIRouter()

_CHALLENGE_TTL = timedelta(minutes=5)
_SESSION_TTL = timedelta(hours=24)

_AUTH_FAILED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authentication failed",
)


@router.post(
    "/challenge",
    response_model=APIResponse[ChallengeData],
    summary="Request a challenge for authentication",
)
async def request_challenge(
    body: ChallengeRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[ChallengeData]:
    """
    Всегда возвращает 200 + challenge — одинаковый ответ независимо от того,
    существует ли пользователь. Это предотвращает перебор имён пользователей.
    Challenge сохраняется в БД только если пользователь существует;
    при несуществующем юзере verify всегда вернёт 401.
    """
    challenge_hex: str = secrets.token_hex(32)

    user: User | None = await crud.get_user_by_username(db, body.username)
    if user is not None:
        await crud.create_challenge(db, {
            "user_id": user.id,
            "challenge": challenge_hex,
            "expires_at": datetime.now(timezone.utc) + _CHALLENGE_TTL,
            "used": 0,
        })
        await db.commit()

    return APIResponse.ok(ChallengeData(challenge=challenge_hex))


@router.post(
    "/verify",
    response_model=APIResponse[TokenData],
    summary="Verify a signed challenge and receive an access token",
)
async def verify_signature(
    body: VerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> APIResponse[TokenData]:
    """
    Все ошибки авторизации возвращают одинаковый 401 "Authentication failed"
    — предотвращает утечку информации о существовании пользователей.

    Challenge помечается как used атомарным UPDATE (use_challenge),
    что устраняет TOCTOU race condition при параллельных запросах.
    """
    user: User | None = await crud.get_user_by_username(db, body.username)
    if user is None:
        raise _AUTH_FAILED

    if not _verify_ed25519(
        public_key_bytes=user.sign_public_key,
        signature_hex=body.signature,
        message_hex=body.challenge,
    ):
        raise _AUTH_FAILED

    used: bool = await crud.use_challenge(db, body.challenge, user.id)
    if not used:
        raise _AUTH_FAILED

    token: str = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + _SESSION_TTL

    await crud.create_session(db, {
        "user_id": user.id,
        "token": token,
        "expires_at": expires_at,
    })
    await db.commit()

    return APIResponse.ok(TokenData(token=token, expires_at=expires_at))

@router.post(
    "/logout",
    response_model=APIResponse[None],
    summary="Logout and invalidate the current access token",
)
async def logout(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> APIResponse[None]:
    
    token: str = authorization.removeprefix("Bearer ").strip()
    await crud.delete_session(db, token)
    
    return APIResponse.ok(None)

@router.get(
    "/me",
    response_model=APIResponse[MeData],
    summary="Get information about the currently authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> APIResponse[MeData]:
    
    return APIResponse.ok(MeData(id=current_user.id, username=current_user.username))

def _verify_ed25519(
    public_key_bytes: bytes,
    signature_hex: str,
    message_hex: str,
) -> bool:
    """
    Проверяет Ed25519 подпись. Возвращает True если подпись валидна, False иначе.
    Не бросает исключений — вызывающий код решает как обработать ошибку.
    """
    try:
        public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
        public_key.verify(
            bytes.fromhex(signature_hex),
            bytes.fromhex(message_hex),
        )
        return True
    except (InvalidSignature, ValueError):
        return False