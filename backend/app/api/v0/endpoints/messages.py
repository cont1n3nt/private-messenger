from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.rate_limit import limiter
from app.api.security import decode_base64_field, parse_hex_field
from app.api.v0.ws_manager import manager
from app.db import crud
from app.db.models import User
from app.schemas import APIResponse
from app.schemas.messages import (
    DeleteMessageRequest,
    EditMessageRequest,
    MessageOut,
    SendMessageRequest,
)


router = APIRouter()

_MESSAGE_TTL = timedelta(hours=48)
_DEFAULT_MESSAGE_LIMIT = 100
_MAX_INCREMENTAL_LIMIT = 1000


@router.get(
    "",
    response_model=APIResponse[list[MessageOut]],
    summary="Get all messages",
)
async def get_messages(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: Optional[int] = Query(
        None,
        description="Maximum number of messages to return",
        ge=1,
        le=_MAX_INCREMENTAL_LIMIT,
    ),
    after_id: Optional[int] = Query(
        None,
        description="Get messages after this message ID",
        ge=1,
    ),
) -> APIResponse[list[MessageOut]]:
    del request

    if after_id is not None:
        messages = await crud.get_messages_after(
            db,
            message_id=after_id,
            limit=limit if limit is not None else _MAX_INCREMENTAL_LIMIT,
        )
    else:
        messages = await crud.get_latest_messages(
            db,
            limit=limit if limit is not None else _DEFAULT_MESSAGE_LIMIT,
        )

    return APIResponse.ok([MessageOut.model_validate(message) for message in messages])


@router.post(
    "",
    response_model=APIResponse[MessageOut],
    summary="Create a new message",
)
@limiter.limit("30/minute")
async def create_message(
    request: Request,
    message_data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    del request

    nonce_bytes = parse_hex_field(message_data.nonce, field_name="nonce")
    ciphertext_bytes = decode_base64_field(
        message_data.ciphertext,
        field_name="ciphertext",
    )

    if message_data.reply_to_message >= 0:
        replied_message = await crud.get_message_by_id(db, message_data.reply_to_message)
        if replied_message is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reply target message not found",
            )

    message = await crud.create_message(
        db,
        message_data={
            "sender_id": current_user.id,
            "ciphertext": ciphertext_bytes,
            "nonce": nonce_bytes,
            "reply_to_message": message_data.reply_to_message,
            "created_at": datetime.now(timezone.utc),
            "delete_at": datetime.now(timezone.utc) + _MESSAGE_TTL,
        },
    )
    await db.commit()
    await db.refresh(message)

    message_out = MessageOut.model_validate(message)
    await manager.broadcast(
        {
            "type": "new_message",
            "data": message_out.model_dump(mode="json"),
        }
    )

    return APIResponse.ok(message_out)


@router.get(
    "/me",
    response_model=APIResponse[list[MessageOut]],
    summary="Get all messages written by user",
)
async def get_user_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[list[MessageOut]]:
    user_messages = await crud.get_messages_by_sender(db, current_user.id)
    return APIResponse.ok([MessageOut.model_validate(message) for message in user_messages])


@router.post(
    "/edit",
    response_model=APIResponse[MessageOut],
    summary="Edit message content",
)
@limiter.limit("30/minute")
async def edit_message(
    request: Request,
    message_data: EditMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    del request

    message = await crud.get_message_by_id(db, message_data.message_id)
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages",
        )

    updated_message = await crud.update_user_message_content(
        db,
        message_id=message_data.message_id,
        sender_id=current_user.id,
        ciphertext=decode_base64_field(
            message_data.ciphertext,
            field_name="ciphertext",
        ),
        nonce=parse_hex_field(message_data.nonce, field_name="nonce"),
    )
    if updated_message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    message_out = MessageOut.model_validate(updated_message)
    await manager.broadcast(
        {
            "type": "edit_message",
            "data": message_out.model_dump(mode="json"),
        }
    )
    return APIResponse.ok(message_out)


@router.post(
    "/delete",
    response_model=APIResponse[MessageOut],
    summary="Delete message",
)
async def delete_message(
    request: Request,
    message_data: DeleteMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIResponse[MessageOut]:
    del request

    message = await crud.get_message_by_id(db, message_data.message_id)
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages",
        )

    message_out = MessageOut.model_validate(message)
    deleted = await crud.delete_user_message(
        db,
        message_id=message_data.message_id,
        sender_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    await manager.broadcast(
        {
            "type": "delete_message",
            "data": {"message_id": message_data.message_id},
        }
    )
    return APIResponse.ok(message_out)
