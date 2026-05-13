"""
РўРµСЃС‚С‹ РґР»СЏ /api/v0/auth/*

РџРѕРєСЂС‹РІР°РµС‚:
  - POST /challenge  вЂ” Р·Р°РїСЂРѕСЃ challenge
  - POST /verify     вЂ” РІРµСЂРёС„РёРєР°С†РёСЏ РїРѕРґРїРёСЃРё Рё РїРѕР»СѓС‡РµРЅРёРµ С‚РѕРєРµРЅР°
  - POST /logout     вЂ” РёРЅРІР°Р»РёРґР°С†РёСЏ С‚РѕРєРµРЅР°
  - GET  /me         вЂ” РёРЅС„РѕСЂРјР°С†РёСЏ Рѕ С‚РµРєСѓС‰РµРј РїРѕР»СЊР·РѕРІР°С‚РµР»Рµ
"""

import secrets
import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from app.db.crud import create_user, create_challenge, create_session


@pytest_asyncio.fixture
async def ed_user(db_session):
    """
    РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ РЅР°СЃС‚РѕСЏС‰РёРј Ed25519 РєР»СЋС‡РѕРј.
    Р’РѕР·РІСЂР°С‰Р°РµС‚ (user, private_key).
    """
    private_key = Ed25519PrivateKey.generate()
    public_key_bytes = private_key.public_key().public_bytes_raw()

    user = await create_user(db_session, {
        "username": "ed_alice",
        "sign_public_key": public_key_bytes,
        "dh_public_key": b"\x02" * 32,
    })
    await db_session.commit()
    await db_session.refresh(user)
    return user, private_key


@pytest_asyncio.fixture
async def challenge_for_ed_user(db_session, ed_user):
    """РЎРѕР·РґР°С‘С‚ Р°РєС‚РёРІРЅС‹Р№ challenge РґР»СЏ ed_user."""
    user, _ = ed_user
    challenge_hex = secrets.token_hex(32)
    ch = await create_challenge(db_session, {
        "user_id": user.id,
        "challenge": challenge_hex,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        "used": 0,
    })
    await db_session.commit()
    await db_session.refresh(ch)
    return ch


class TestRequestChallenge:
    @pytest.mark.asyncio
    async def test_returns_challenge_for_existing_user(self, client, registered_user):
        resp = await client.post("/api/v0/auth/challenge", json={"username": "alice"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "challenge" in body["data"]
        assert len(body["data"]["challenge"]) == 64

    @pytest.mark.asyncio
    async def test_returns_200_for_unknown_user(self, client):
        """Challenge РІСЃРµРіРґР° РІРѕР·РІСЂР°С‰Р°РµС‚ 200 вЂ” РїСЂРµРґРѕС‚РІСЂР°С‰Р°РµС‚ РїРµСЂРµР±РѕСЂ РёРјС‘РЅ."""
        resp = await client.post("/api/v0/auth/challenge", json={"username": "ghost"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "challenge" in body["data"]
        assert len(body["data"]["challenge"]) == 64

    @pytest.mark.asyncio
    async def test_missing_username_field(self, client):
        resp = await client.post("/api/v0/auth/challenge", json={})
        assert resp.status_code == 422


class TestVerifySignature:

    @pytest.mark.asyncio
    async def test_valid_signature_returns_token(
        self, client, db_session, ed_user, challenge_for_ed_user
    ):
        user, private_key = ed_user
        challenge_hex = challenge_for_ed_user.challenge

        sig_bytes = private_key.sign(bytes.fromhex(challenge_hex))
        sig_hex = sig_bytes.hex()

        resp = await client.post("/api/v0/auth/verify", json={
            "username": "ed_alice",
            "challenge": challenge_hex,
            "signature": sig_hex,
        })
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "token" in body["data"]
        assert "expires_at" in body["data"]

    @pytest.mark.asyncio
    async def test_wrong_signature_returns_401(
        self, client, db_session, ed_user, challenge_for_ed_user
    ):
        user, _ = ed_user
        challenge_hex = challenge_for_ed_user.challenge
        bad_sig = "ab" * 64

        resp = await client.post("/api/v0/auth/verify", json={
            "username": "ed_alice",
            "challenge": challenge_hex,
            "signature": bad_sig,
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_wrong_challenge_returns_401(self, client, ed_user, challenge_for_ed_user):
        user, private_key = ed_user
        wrong_challenge = secrets.token_hex(32)
        sig_hex = private_key.sign(bytes.fromhex(wrong_challenge)).hex()

        resp = await client.post("/api/v0/auth/verify", json={
            "username": "ed_alice",
            "challenge": wrong_challenge,
            "signature": sig_hex,
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_unknown_user_returns_401(self, client):
        """Verify РЅРµ СЂР°СЃРєСЂС‹РІР°РµС‚ СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ вЂ” РІСЃРµРіРґР° 401."""
        resp = await client.post("/api/v0/auth/verify", json={
            "username": "nobody",
            "challenge": "ab" * 32,
            "signature": "cd" * 64,
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_challenge_field_must_be_hex64(self, client, ed_user):
        resp = await client.post("/api/v0/auth/verify", json={
            "username": "ed_alice",
            "challenge": "tooshort",
            "signature": "ab" * 64,
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_signature_field_must_be_hex128(self, client, ed_user, challenge_for_ed_user):
        resp = await client.post("/api/v0/auth/verify", json={
            "username": "ed_alice",
            "challenge": challenge_for_ed_user.challenge,
            "signature": "tooshort",
        })
        assert resp.status_code == 422


class TestLogout:

    @pytest.mark.asyncio
    async def test_logout_invalidates_token(self, client, auth_headers, db_session, auth_token):
        me = await client.get("/api/v0/auth/me", headers=auth_headers)
        assert me.status_code == 200

        resp = await client.post("/api/v0/auth/logout", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        me_after = await client.get("/api/v0/auth/me", headers=auth_headers)
        assert me_after.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_without_token_returns_422_or_401(self, client):
        resp = await client.post("/api/v0/auth/logout")
        assert resp.status_code in (401, 422)


class TestGetMe:

    @pytest.mark.asyncio
    async def test_returns_current_user_info(self, client, auth_headers, registered_user):
        resp = await client.get("/api/v0/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["username"] == registered_user.username
        assert body["data"]["id"] == registered_user.id

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(self, client, db_session, registered_user):
        token = secrets.token_hex(32)
        await create_session(db_session, {
            "user_id": registered_user.id,
            "token": token,
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
        })
        await db_session.commit()

        resp = await client.get(
            "/api/v0/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_token_returns_401(self, client):
        resp = await client.get(
            "/api/v0/auth/me",
            headers={"Authorization": "Bearer totally_fake_token"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_authorization_header_returns_422(self, client):
        resp = await client.get("/api/v0/auth/me")
        assert resp.status_code == 401
