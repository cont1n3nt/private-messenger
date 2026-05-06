from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.db.session import AsyncSessionLocal
from app.db import crud
from app.api.v0.ws_manager import manager

router = APIRouter()

async def _authenticate_ws(token: str) -> int | None:
    """
    Проверяет токен и возвращает user_id если токен валидный.

    Создаёт отдельную сессию БД — WebSocket не может использовать
    стандартный Depends(get_db) как HTTP эндпоинты.

    Args:
        token: Bearer токен из query param.

    Returns:
        user_id если токен валидный, None если нет.
    """
    async with AsyncSessionLocal() as db:
        db_session = await crud.get_session_by_token(db, token)
        
        if db_session is None:
            return None
        
        if db_session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await crud.delete_session(db, token)
            return None
        
        user_id = db_session.user_id
        if isinstance(user_id, int): # добавил, чтобы MyPy не ругался
            return user_id
        return None
    
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Bearer токен авторизации"),
) -> None:
    """
    WebSocket соединение для получения realtime уведомлений.

    Аутентификация через query param ?token=<token>.
    При неверном токене соединение закрывается с кодом 4003.

    Формат входящих сообщений от клиента:
        {"type": "ping"}  →  сервер отвечает {"type": "pong"}

    Формат broadcast сообщений от сервера:
        {
            "type": "new_message",
            "data": {
                "id": 1,
                "sender_id": 2,
                "ciphertext": "...",
                "nonce": "...",
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    """
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
        manager.disconnect(user_id)
        
