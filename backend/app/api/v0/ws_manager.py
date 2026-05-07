from fastapi import WebSocket

class ConnectionManager:
    """
    Управляет активными WebSocket соединениями.

    Attributes:
        _connections: Словарь user_id → WebSocket.
                      Один пользователь = одно активное соединение.
                      Если юзер заходит с нового вкладки — старое вытесняется.
    """
    
    def __init__(self):
        self._connections: dict[int, WebSocket] = {}
        
    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        if user_id in self._connections:
            old = self._connections[user_id]
            try:
                await old.close(code=4001)
            except Exception:
                pass

        self._connections[user_id] = websocket
        
    async def disconnect(self, user_id: int) -> None:
        """
        Удаляет соединение пользователя.

        Args:
            user_id: ID пользователя.
        """
        self._connections.pop(user_id, None)
        
    async def broadcast(self, payload: dict) -> None:
        """
        Отправляет JSON payload всем подключённым клиентам.

        Если отправка упала для конкретного клиента — удаляет его из активных
        и продолжает рассылку остальным.

        Args:
            payload: Словарь который будет сериализован в JSON и отправлен.
        """
        
        dead: list[int] = []
        
        for user_id, ws in list(self._connections.items()):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(user_id)
        
        for user_id in dead:
            await self.disconnect(user_id)
        
    @property
    def active_count(self) -> int:
        """Количество активных соединений."""
        return len(self._connections)
        
manager = ConnectionManager()