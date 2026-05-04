import pytest
from app.db.crud import *
from app.tests.helpers import make_user_data, make_session_data
from datetime import datetime, timedelta, timezone


class TestCreateSession:
    async def test_create_session_success(self, session, user):
        data = make_session_data(user.id)
        s = await create_session(session, data)

        assert s.user_id == user.id
        assert s.token == data["token"]

        await session.commit()
        found = await get_session_by_token(session, data["token"])
        assert found is not None

    async def test_create_session_persists(self, session, user):
        data = make_session_data(user.id)
        await create_session(session, data)
        await session.commit()

        found = await get_session_by_token(session, data["token"])
        assert found.user_id == user.id


class TestGetSessionByToken:
    async def test_get_existing_session(self, session, user):
        data = make_session_data(user.id)
        await create_session(session, data)
        await session.commit()

        found = await get_session_by_token(session, data["token"])
        assert found is not None
        assert found.token == data["token"]

    async def test_get_nonexistent_session(self, session):
        found = await get_session_by_token(session, "nonexistent_token")
        assert found is None


class TestDeleteSession:
    async def test_delete_session_removes(self, session, user):
        data = make_session_data(user.id)
        await create_session(session, data)
        await session.commit()

        await delete_session(session, data["token"])

        found = await get_session_by_token(session, data["token"])
        assert found is None

    async def test_delete_nonexistent_session(self, session):
        await delete_session(session, "nonexistent_token")


class TestDeleteExpiredSessions:
    async def test_deletes_expired(self, session, user):
        data = {
            "token": "expired_token",
            "user_id": user.id,
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        await create_session(session, data)
        await session.commit()

        deleted = await delete_expired_sessions(session)
        assert deleted >= 1

        found = await get_session_by_token(session, "expired_token")
        assert found is None

    async def test_keeps_fresh(self, session, user):
        data = make_session_data(user.id)
        await create_session(session, data)
        await session.commit()

        await delete_expired_sessions(session)

        found = await get_session_by_token(session, data["token"])
        assert found is not None


class TestDeleteAllSessions:
    async def test_deletes_all(self, session, user):
        for i in range(3):
            await create_session(session, {
                "token": f"token_all_{i}",
                "user_id": user.id,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            })
        await session.commit()

        deleted = await delete_all_sessions(session)
        assert deleted >= 3