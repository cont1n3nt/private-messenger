import base64

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models import User
from app.db import crud
from app.schemas import APIResponse, KeysInitRequest, KeysData, UserPublic


router = APIRouter()

@router.post(
    "/init",
    response_model=APIResponse[KeysData],
    summary="Upload or update public keys",
)
async def keys_init(
    body: KeysInitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> APIResponse[KeysData]:
    """
    загружает или обновляет публичные ключи авторизованного пользователя
    принимает Ed25519 и X25519 ключи в формате base64
    !! вызывается фронтом при первом входе после генерации ключей,
    или при смене ключей

    Args:
        body: KeysInitRequest с полями sign_public_key и dh_public_key (base64).
        db: Сессия БД.
        current_user: Авторизованный пользователь из токена.

    Returns:
        APIResponse с обновлёнными публичными ключами.

    Raises:
        HTTPException 400: Если ключи в неверном формате или неверной длины.
        HTTPException 404: Если пользователь не найден.
    """
    try:
        sign_bytes = base64.b64decode(body.sign_public_key)
        dh_bytes = base64.b64decode(body.dh_public_key)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 encoding for keys",
        )
    
    if len(sign_bytes) != 32 or len(dh_bytes) != 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid key length, expected 32 bytes for both keys",
        )

    user = await crud.update_user_keys(
        db,
        user_id=current_user.id,
        sign_public_key=sign_bytes,
        dh_public_key=dh_bytes,
    )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    return APIResponse.ok(KeysData(
        sign_public_key=body.sign_public_key,
        dh_public_key=body.dh_public_key,
    ))
    

@router.get(
    "",
    response_model=APIResponse[list[UserPublic]],
    summary="Get public keys of all users",
)
async def get_keys(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> APIResponse[list[UserPublic]]:
    """
    возвращает публичные ключи всех пользователей

    вызывается фронтендом и использует ключи для ECDH — вычисления общего группового ключа.
    ключи возвращаются в base64

    Args:
        db: Сессия БД.
        _: Проверка авторизации (сам объект не используется).

    Returns:
        APIResponse со списком UserPublic (id, username, sign_public_key, dh_public_key).
    """
    users: list[User] = await crud.get_all_users(db)
    return APIResponse.ok([UserPublic.model_validate(u) for u in users])