"""
РўРµСЃС‚С‹ РґР»СЏ /api/v0/users/*

РџРѕРєСЂС‹РІР°РµС‚:
  - GET /users  вЂ” СЃРїРёСЃРѕРє РІСЃРµС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№
"""

import pytest
import pytest_asyncio

from app.db.crud import create_user


class TestGetUsers:

    @pytest.mark.asyncio
    async def test_returns_list(self, client, auth_headers):
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    @pytest.mark.asyncio
    async def test_includes_registered_user(self, client, auth_headers, registered_user):
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()["data"]]
        assert registered_user.username in usernames

    @pytest.mark.asyncio
    async def test_multiple_users_returned(self, client, auth_headers, db_session):
        """РџСЂРё РЅР°Р»РёС‡РёРё РЅРµСЃРєРѕР»СЊРєРёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РІСЃРµ РІРѕР·РІСЂР°С‰Р°СЋС‚СЃСЏ."""
        for i, name in enumerate(("bob", "carol"), start=3):
            await create_user(db_session, {
                "username": name,
                "sign_public_key": bytes([i]) * 32,
                "dh_public_key": bytes([i + 10]) * 32,
            })
        await db_session.commit()

        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()["data"]]
        assert "bob" in usernames
        assert "carol" in usernames

    @pytest.mark.asyncio
    async def test_requires_auth(self, client):
        resp = await client.get("/api/v0/users")
        assert resp.status_code in (401, 422)

    @pytest.mark.asyncio
    async def test_response_schema(self, client, auth_headers, registered_user):
        """РљР°Р¶РґС‹Р№ СЌР»РµРјРµРЅС‚ СЃРѕРґРµСЂР¶РёС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ."""
        resp = await client.get("/api/v0/users", headers=auth_headers)
        assert resp.status_code == 200
        for user in resp.json()["data"]:
            assert "id" in user
            assert "username" in user
