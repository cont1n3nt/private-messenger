"""
Тесты для /api/v0/users/*
 
Покрывает:
  - GET /users  — список всех пользователей
"""
 
import pytest
import pytest_asyncio
 
from app.db.crud import create_user
 
 
# ---------------------------------------------------------------------------
# GET /users
# ---------------------------------------------------------------------------
 
class TestGetUsers:
 
    async def test_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
 
    async def test_includes_registered_user(self, client, auth_headers, registered_user):
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()["data"]]
        assert registered_user.username in usernames
 
    async def test_multiple_users_returned(self, client, auth_headers, db_session):
        """При наличии нескольких пользователей все возвращаются."""
        for i, name in enumerate(("bob", "carol"), start=3):
            await create_user(db_session, {
                "username": name,
                "sign_public_key": bytes([i]) * 32,
                "dh_public_key":   bytes([i + 10]) * 32,
            })
        await db_session.commit()
 
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()["data"]]
        assert "bob" in usernames
        assert "carol" in usernames
 
    async def test_requires_auth(self, client):
        resp = await client.get("/api/v0/users")
        assert resp.status_code in (401, 422)
 
    async def test_response_schema(self, client, auth_headers, registered_user):
        """Каждый элемент содержит обязательные поля."""
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        for user in resp.json()["data"]:
            assert "id" in user
            assert "username" in user