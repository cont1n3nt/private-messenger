from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import base64
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_user
from app.api.v0.ws_manager import manager
from app.db.models import User
from app.db import crud
from app.schemas import APIResponse
from app.schemas.messages import SendMessageRequest, MessageOut
from app.api.rate_limit import limiter



router = APIRouter()

_MESSAGE_TTL = timedelta(hours=48)

@router.get(
    "",
    response_model=APIResponse[list[MessageOut]],
    summary="Get all messages",
)
async def get_messages(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: Optional[int] = Query(None, description="Maximum number of messages to return", ge=1, le=1000),
    after_id: Optional[int] = Query(None, description="Get messages after this message ID", ge=1),
) -> APIResponse[list[MessageOut]]:
    """
    возвращает список всех сообщений
    требует авторизации (токен)
    
    Args:
        db: Сессия БД.
        _: Проверка авторизации (сам объект не используется).
        limit: Ограничить кол-во возвращаемых сообщений (последние N).
        after_id: Получить сообщения после указанного ID.

    Returns:
        APIResponse со списком MessageOut (id, sender_id, ciphertext, nonce, created_at).
    """
    if after_id is not None:
        messages = await crud.get_messages_after(
            db,
            after_id=after_id,
            limit=limit if limit is not None else 1000
        )
    elif limit is not None:
        messages = await crud.get_latest_messages(
            db,
            limit=limit
        )
    else:
        messages = await crud.get_latest_messages(db, limit=100)
    
    return APIResponse.ok([MessageOut.model_validate(m) for m in messages])


@router.post(
    "",
    response_model=APIResponse[MessageOut],
    summary="Create a new message"
)
@limiter.limit("30/minute")
async def create_message(
    request: Request,
    message_data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    """
    создает новое сообщение
    требует авторизации (токен)
    
    Args:
        message_data: Информация о сообщении.
        db: Сессия БД.
        current_user: Авторизованный пользователь из токена.

    Returns:
        APIResponse с MessageOut (id, sender_id, ciphertext, nonce, created_at).
    """

    nonce_bytes = bytes.fromhex(message_data.nonce)
    
    message_dict = {
        "sender_id": current_user.id,
        "ciphertext": base64.b64decode(message_data.ciphertext),
        "nonce": nonce_bytes,
        "created_at": datetime.now(timezone.utc),
        "delete_at": datetime.now(timezone.utc) + _MESSAGE_TTL
    }
    
    message = await crud.create_message(
        db,
        message_data=message_dict
    )

    await db.commit()
    await db.refresh(message)
    
    msg_out = MessageOut.model_validate(message)
    await manager.broadcast({
        "type": "new_message",
        "data": msg_out.model_dump(mode="json"),
    })
    
    return APIResponse.ok(msg_out)


@router.get(
    "/me",
    response_model=APIResponse[list[MessageOut]],
    summary="Get all messages written by user",
)
async def get_user_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[list[MessageOut]]:
    """
    возвращает все сообщения текущего пользователя
    требует авторизации (токен)

    Args:
        db: Сессия БД.
        current_user: Авторизованный пользователь из токена.

    Returns:
        APIResponse со списком MessageOut (id, sender_id, ciphertext, nonce, created_at).
    """

    user_messages = await crud.get_messages_by_sender(db, current_user.id)
    return APIResponse.ok([MessageOut.model_validate(m) for m in user_messages])