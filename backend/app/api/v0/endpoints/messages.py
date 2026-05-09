from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import base64
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_user
from app.api.v0.ws_manager import manager
from app.db.models import User, Message
from app.db import crud
from app.schemas import APIResponse
from app.schemas.messages import SendMessageRequest, MessageOut, EditMessageRequest, DeleteMessageRequest
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


@router.post(
    "/edit",
    response_model=APIResponse[MessageOut],
    summary="Edit message content"
)
@limiter.limit("30/minute")
async def edit_message(
    request: Request,
    message_data: EditMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    """
    изменяет текст сообщения
    требует авторизации (токен)
    
    Args:
        message_data: Информация о сообщении (должен содержать message_id, ciphertext, nonce).
        db: Сессия БД.
        current_user: Авторизованный пользователь из токена.

    Returns:
        APIResponse с MessageOut (id, sender_id, ciphertext, nonce, created_at).
    """
    
    message = await db.get(Message, message_data.message_id)

    if message is None:
        return APIResponse.error(
            status_code=404,
            message="Message not found"
        )
    
    if message.sender_id != current_user.id: # проверка, что человек редактирует свое сообщение
        return APIResponse.error(
            status_code=403,
            message="You can only edit your own messages"
        )
    
    ciphertext_bytes = base64.b64decode(message_data.ciphertext)
    updated_message = await crud.update_message_content(
        db,
        message_id=message_data.message_id,
        ciphertext=ciphertext_bytes
    )
    
    msg_out = MessageOut.model_validate(updated_message)
    
    await manager.broadcast({
        "type": "edit_message",
        "data": msg_out.model_dump(mode="json"),
    })
    
    return APIResponse.ok(msg_out)

@router.post(
    "/delete",
    response_model=APIResponse[MessageOut],
    summary="Delete message"
)
async def delete_message(
    request: Request,
    message_data: DeleteMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    """
    удаляет сообщение по ID
    требует авторизации (токен)
    
    Args:
        message_data: Информация о сообщении (должен содержать message_id).
        db: Сессия БД.
        current_user: Авторизованный пользователь из токена.

    Returns:
        APIResponse с MessageOut (id, sender_id, ciphertext, nonce, created_at, edited_content) в случае успешного удаления, либо сообщение об ошибке.

    Note:
        - Только автор сообщения может его удалить.
        - После удаления отправляется WebSocket broadcast всем подключенным клиентам.
        - Функция возвращает данные удаленного сообщения для подтверждения операции.
    """

    message = await db.get(Message, message_data.message_id)
    
    if message is None:
        return APIResponse.error(
            status_code=404,
            message="Message not found"
        )

    if message.sender_id != current_user.id:  # проверка, что человек удаляет свое сообщение
        return APIResponse.error(
            status_code=403,
            message="You can only delete your own messages"
        )
    
    msg_out = MessageOut.model_validate(message)

    deleted = await crud.delete_message(
        db,
        message_id=message_data.message_id
    )
    
    if not deleted:
        return APIResponse.error(
            status_code=500,
            message="Failed to delete message"
        )

    await manager.broadcast({
        "type": "delete_message",
        "data": {
            "message_id": message_data.message_id
        }
    })
    
    return APIResponse.ok(msg_out)