import pytest
from app.db.crud import *
from app.db.tests.helpers import make_user_data, make_message_data
from datetime import datetime, timedelta, timezone



class TestCreateMessage:
    async def test_create_message_success(self, session, user):
        msg = await create_message(session, make_message_data(user.id))

        assert msg.sender_id == user.id
        assert msg.ciphertext == b"encrypted_text"
        assert msg.id is None

        await session.commit()
        assert msg.id is not None

    async def test_create_message_persists_in_db(self, session, test_message):
        messages = await get_messages(session)
        assert any(m.id == test_message.id for m in messages)


class TestGetMessages:
    async def test_get_messages_empty(self, session):
        messages = await get_messages(session)
        assert isinstance(messages, list)

    async def test_get_messages_returns_created(self, session, test_message):
        messages = await get_messages(session)
        ids = [m.id for m in messages]
        assert test_message.id in ids


class TestGetLatestMessages:
    async def test_get_latest_messages_limit(self, session, user):
        for i in range(3):
            await create_message(session, make_message_data(user.id))
        await session.commit()

        messages = await get_latest_messages(session, limit=2)
        assert len(messages) <= 2

    async def test_get_latest_messages_order_asc(self, session, user):
        for i in range(3):
            await create_message(session, make_message_data(user.id))
        await session.commit()

        messages = await get_latest_messages(session, limit=3)
        ids = [m.id for m in messages]
        assert ids == sorted(ids)


class TestGetMessagesAfter:
    async def test_get_messages_after(self, session, user, test_message):
        new_msg = await create_message(session, make_message_data(user.id))
        await session.commit()
        await session.refresh(new_msg)

        messages = await get_messages_after(session, test_message.id)
        ids = [m.id for m in messages]
        assert new_msg.id in ids
        assert test_message.id not in ids

    async def test_get_messages_after_no_results(self, session):
        messages = await get_messages_after(session, message_id=999999)
        assert messages == []


class TestDeleteOldMessages:
    async def test_delete_old_messages_deletes_expired(self, session, user):
        expired = await create_message(session, make_message_data(user.id, days=-1))
        await session.commit()

        deleted = await delete_old_messages(session)
        assert deleted >= 1

        messages = await get_messages(session)
        assert all(m.id != expired.id for m in messages)

    async def test_delete_old_messages_keeps_fresh(self, session, test_message):
        await delete_old_messages(session)
        messages = await get_messages(session)
        ids = [m.id for m in messages]
        assert test_message.id in ids