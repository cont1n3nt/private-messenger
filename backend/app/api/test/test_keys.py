"""
РўРµСЃС‚С‹ РґР»СЏ /api/v0/keys/*

РџРѕРєСЂС‹РІР°РµС‚:
  - POST /keys/init  вЂ” Р·Р°РіСЂСѓР·РєР°/РѕР±РЅРѕРІР»РµРЅРёРµ РїСѓР±Р»РёС‡РЅС‹С… РєР»СЋС‡РµР№
  - GET  /keys       вЂ” РїРѕР»СѓС‡РµРЅРёРµ РєР»СЋС‡РµР№ РІСЃРµС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№
"""

import base64
import pytest


VALID_SIGN_KEY = base64.b64encode(b"\xAA" * 32).decode()
VALID_DH_KEY = base64.b64encode(b"\xBB" * 32).decode()


class TestKeysInit:

    @pytest.mark.asyncio
    async def test_upload_valid_keys(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["sign_public_key"] == VALID_SIGN_KEY
        assert body["data"]["dh_public_key"] == VALID_DH_KEY

    @pytest.mark.asyncio
    async def test_update_keys_twice(self, client, auth_headers):
        """РџРѕРІС‚РѕСЂРЅР°СЏ Р·Р°РіСЂСѓР·РєР° С‚РµС… Р¶Рµ РєР»СЋС‡РµР№ вЂ” OK. Р”СЂСѓРіРёС… РєР»СЋС‡РµР№ вЂ” 409."""
        await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)

        resp_same = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)
        assert resp_same.status_code == 200

        new_sign = base64.b64encode(b"\xCC" * 32).decode()
        new_dh = base64.b64encode(b"\xDD" * 32).decode()
        resp_diff = await client.post("/api/v0/keys/init", json={
            "sign_public_key": new_sign,
            "dh_public_key": new_dh,
        }, headers=auth_headers)
        assert resp_diff.status_code == 409

    @pytest.mark.asyncio
    async def test_invalid_base64_returns_422(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": "!!!not_base64!!!",
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_wrong_key_length_returns_400(self, client, auth_headers):
        """РљР»СЋС‡ РїСЂР°РІРёР»СЊРЅС‹Р№ base64, РЅРѕ РЅРµ 32 Р±Р°Р№С‚Р°."""
        short_key = base64.b64encode(b"\x01" * 16).decode()
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": short_key,
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_requires_auth(self, client):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key": VALID_DH_KEY,
        })
        assert resp.status_code in (401, 422)

    @pytest.mark.asyncio
    async def test_missing_field_returns_422(self, client, auth_headers):
        resp = await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
        }, headers=auth_headers)
        assert resp.status_code == 422


class TestGetKeys:

    @pytest.mark.asyncio
    async def test_returns_list_of_users_with_keys(self, client, auth_headers, db_session):
        """РџРѕСЃР»Рµ Р·Р°РіСЂСѓР·РєРё РєР»СЋС‡РµР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РґРѕР»Р¶РµРЅ РїРѕСЏРІРёС‚СЊСЃСЏ РІ СЃРїРёСЃРєРµ."""
        await client.post("/api/v0/keys/init", json={
            "sign_public_key": VALID_SIGN_KEY,
            "dh_public_key": VALID_DH_KEY,
        }, headers=auth_headers)

        resp = await client.get("/api/v0/keys", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

        users_with_keys = [
            u for u in body["data"]
            if u.get("sign_public_key") and u.get("dh_public_key")
        ]
        assert len(users_with_keys) >= 1

    @pytest.mark.asyncio
    async def test_requires_auth(self, client):
        resp = await client.get("/api/v0/keys")
        assert resp.status_code in (401, 422)

    @pytest.mark.asyncio
    async def test_response_schema(self, client, auth_headers):
        """РљР°Р¶РґС‹Р№ СЌР»РµРјРµРЅС‚ СЃРїРёСЃРєР° СЃРѕРґРµСЂР¶РёС‚ РѕР¶РёРґР°РµРјС‹Рµ РїРѕР»СЏ."""
        resp = await client.get("/api/v0/keys", headers=auth_headers)
        assert resp.status_code == 200
        for user in resp.json()["data"]:
            assert "id" in user
            assert "username" in user
