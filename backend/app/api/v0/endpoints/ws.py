import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.db import crud
from app.api.v0.ws_manager import manager
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_ALLOWED_WS_ORIGINS = set(settings.ALLOWED_ORIGINS)

async def _authenticate_ws(token: str) -> int | None:
    async with AsyncSessionLocal() as db:
        db_session = await crud.get_session_by_token(db, token)

        if db_session is None:
            return None

        expires_at = db_session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            await crud.delete_session(db, token)
            await db.commit()
            return None

        user_id = db_session.user_id
        if isinstance(user_id, int):
            return user_id
        return None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    origin = websocket.headers.get("origin", "")
    if not origin or origin not in _ALLOWED_WS_ORIGINS:
        await websocket.close(code=4003)
        return

    await websocket.accept()

    try:
        auth_msg = await websocket.receive_json()
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close(code=4003)
        return

    if not isinstance(auth_msg, dict) or auth_msg.get("type") != "auth":
        await websocket.close(code=4003)
        return

    token = auth_msg.get("token")
    if not token:
        await websocket.close(code=4003)
        return

    user_id = await _authenticate_ws(token)

    if user_id is None:
        await websocket.close(code=4003)
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception:
        logger.warning("WS error for user %s, disconnecting", user_id)
        await manager.disconnect(user_id)
