import base64
from datetime import datetime, timedelta, timezone

import pytest

from app.db.crud import create_message, create_user


VALID_CIPHERTEXT = base64.b64encode(b"encrypted-payload-with-tag").decode()
VALID_NONCE = "ab" * 24


class TestCreateMessage:
    @pytest.mark.asyncio
    async def test_create_message_success(self, client, auth_headers):
        resp = await client.post(
            "/api/v0/messages",
            json={
                "ciphertext": VALID_CIPHERTEXT,
                "nonce": VALID_NONCE,
            },
            headers=auth_headers,
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["ciphertext"] == VALID_CIPHERTEXT

    @pytest.mark.asyncio
    async def test_reply_to_unknown_message_returns_404(self, client, auth_headers):
        resp = await client.post(
            "/api/v0/messages",
            json={
                "ciphertext": VALID_CIPHERTEXT,
                "nonce": VALID_NONCE,
                "reply_to_message": 999999,
            },
            headers=auth_headers,
        )

        assert resp.status_code == 404


class TestEditMessage:
    @pytest.mark.asyncio
    async def test_edit_own_message_success(self, client, auth_headers, db_session, registered_user):
        message = await create_message(
            db_session,
            {
                "sender_id": registered_user.id,
                "ciphertext": b"old-message-ciphertext",
                "nonce": bytes.fromhex(VALID_NONCE),
                "reply_to_message": -1,
                "created_at": datetime.now(timezone.utc),
                "delete_at": datetime.now(timezone.utc) + timedelta(hours=1),
            },
        )
        await db_session.commit()
        await db_session.refresh(message)

        resp = await client.post(
            "/api/v0/messages/edit",
            json={
                "message_id": message.id,
                "ciphertext": VALID_CIPHERTEXT,
                "nonce": VALID_NONCE,
            },
            headers=auth_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["edited_content"] is True

    @pytest.mark.asyncio
    async def test_edit_other_user_message_returns_403(self, client, auth_headers, db_session):
        other_user = await create_user(
            db_session,
            {
                "username": "bob",
            },
        )
        await db_session.commit()
        await db_session.refresh(other_user)

        message = await create_message(
            db_session,
            {
                "sender_id": other_user.id,
                "ciphertext": b"other-message-ciphertext",
                "nonce": bytes.fromhex(VALID_NONCE),
                "reply_to_message": -1,
                "created_at": datetime.now(timezone.utc),
                "delete_at": datetime.now(timezone.utc) + timedelta(hours=1),
            },
        )
        await db_session.commit()
        await db_session.refresh(message)

        resp = await client.post(
            "/api/v0/messages/edit",
            json={
                "message_id": message.id,
                "ciphertext": VALID_CIPHERTEXT,
                "nonce": VALID_NONCE,
            },
            headers=auth_headers,
        )

        assert resp.status_code == 403


class TestDeleteMessage:
    @pytest.mark.asyncio
    async def test_delete_own_message_success(self, client, auth_headers, db_session, registered_user):
        message = await create_message(
            db_session,
            {
                "sender_id": registered_user.id,
                "ciphertext": b"message-to-delete",
                "nonce": bytes.fromhex(VALID_NONCE),
                "reply_to_message": -1,
                "created_at": datetime.now(timezone.utc),
                "delete_at": datetime.now(timezone.utc) + timedelta(hours=1),
            },
        )
        await db_session.commit()
        await db_session.refresh(message)

        resp = await client.post(
            "/api/v0/messages/delete",
            json={"message_id": message.id},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == message.id

    @pytest.mark.asyncio
    async def test_delete_other_user_message_returns_403(self, client, auth_headers, db_session):
        other_user = await create_user(
            db_session,
            {
                "username": "carol",
            },
        )
        await db_session.commit()
        await db_session.refresh(other_user)

        message = await create_message(
            db_session,
            {
                "sender_id": other_user.id,
                "ciphertext": b"other-delete-ciphertext",
                "nonce": bytes.fromhex(VALID_NONCE),
                "reply_to_message": -1,
                "created_at": datetime.now(timezone.utc),
                "delete_at": datetime.now(timezone.utc) + timedelta(hours=1),
            },
        )
        await db_session.commit()
        await db_session.refresh(message)

        resp = await client.post(
            "/api/v0/messages/delete",
            json={"message_id": message.id},
            headers=auth_headers,
        )

        assert resp.status_code == 403
