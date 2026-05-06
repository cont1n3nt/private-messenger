"""
Тесты для /api/v0/keys/*

Покрывает:
  - POST /keys/init  — загрузка/обновление публичных ключей
  - GET  /keys       — получение ключей всех пользователей
"""

import base64
import pytest


VALID_SIGN_KEY = base64.b64encode(b"\xAA" * 32).decode()
VALID_DH_KEY   = base64.b64encode(b"\xBB" * 32).decode()


# ---------------------------------------------------------------------------
# POST /keys/init
# ---------------------------------------------------------------------------

class TestKeysInit:

    async def test_upload_valid_keys(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key":   VALID_DH_KEY,
        }, headers=auth_headers)

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["sign_public_key"] == VALID_SIGN_KEY
        assert body["data"]["dh_public_key"]   == VALID_DH_KEY

    async def test_update_keys_twice(self, client, auth_headers):
        """Повторный вызов должен обновить ключи без ошибок."""
        new_sign = base64.b64encode(b"\xCC" * 32).decode()
        new_dh   = base64.b64encode(b"\xDD" * 32).decode()

        await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key":   VALID_DH_KEY,
        }, headers=auth_headers)

        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": new_sign,
            "dh_public_key":   new_dh,
        }, headers=auth_headers)

        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["sign_public_key"] == new_sign
        assert body["data"]["dh_public_key"]   == new_dh

    async def test_invalid_base64_returns_400(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": "!!!not_base64!!!",
            "dh_public_key":   VALID_DH_KEY,
        }, headers=auth_headers)
        assert resp.status_code == 400

    async def test_wrong_key_length_returns_400(self, client, auth_headers):
        """Ключ правильный base64, но не 32 байта."""
        short_key = base64.b64encode(b"\x01" * 16).decode()  # 16 байт
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": short_key,
            "dh_public_key":   VALID_DH_KEY,
        }, headers=auth_headers)
        assert resp.status_code == 400

    async def test_requires_auth(self, client):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key":   VALID_DH_KEY,
        })
        assert resp.status_code in (401, 422)

    async def test_missing_field_returns_422(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            # dh_public_key отсутствует
        }, headers=auth_headers)
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /keys
# ---------------------------------------------------------------------------

class TestGetKeys:

    async def test_returns_list_of_users_with_keys(self, client, auth_headers, db_session):
        """После загрузки ключей пользователь должен появиться в списке."""
        await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key":   VALID_DH_KEY,
        }, headers=auth_headers)

        resp = await client.get("/api/v0/keys", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

        # Хотя бы один пользователь с ненулевыми ключами
        users_with_keys = [
            u for u in body["data"]
            if u.get("sign_public_key") and u.get("dh_public_key")
        ]
        assert len(users_with_keys) >= 1

    async def test_requires_auth(self, client):
        resp = await client.get("/api/v0/keys")
        assert resp.status_code in (401, 422)

    async def test_response_schema(self, client, auth_headers):
        """Каждый элемент списка содержит ожидаемые поля."""
        resp = await client.get("/api/v0/keys", headers=auth_headers)
        assert resp.status_code == 200
        for user in resp.json()["data"]:
            assert "id" in user
            assert "username" in user
