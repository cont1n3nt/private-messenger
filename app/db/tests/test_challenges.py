import pytest
from app.db.crud import *
from app.db.tests.helpers import make_user_data, make_challenge_data
from datetime import datetime, timedelta, timezone


class TestCreateChallenge:
    async def test_create_challenge_success(self, session, user):
        challenge = await create_challenge(session, make_challenge_data(user.id))

        assert challenge.user_id == user.id
        assert challenge.used == 0
        assert challenge.challenge is not None

        await session.commit()
        await session.refresh(challenge)
        assert challenge.challenge is not None

    async def test_create_challenge_replaces_existing(self, session, user):
        await create_challenge(session, make_challenge_data(user.id, hours=1))
        await session.commit()

        new = await create_challenge(session, {
            "user_id": user.id,
            "challenge": "brand_new_challenge",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": 0,
        })
        await session.commit()
        await session.refresh(new)

        active = await get_active_challenge(session, user_id=user.id)
        assert active is not None
        assert active.challenge == "brand_new_challenge"


class TestGetActiveChallenge:
    async def test_get_active_challenge_found(self, session, user, test_challenge):
        challenge = await get_active_challenge(session, user_id=user.id)
        assert challenge is not None
        assert challenge.challenge == test_challenge.challenge

    async def test_get_active_challenge_expired(self, session, user):
        await create_challenge(session, {
            "user_id": user.id,
            "challenge": "expired_one",
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
            "used": 0,
        })
        await session.commit()

        challenge = await get_active_challenge(session, user_id=user.id)
        assert challenge is None

    async def test_get_active_challenge_used(self, session, user):
        await create_challenge(session, {
            "user_id": user.id,
            "challenge": "used_challenge",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": 1,
        })
        await session.commit()

        challenge = await get_active_challenge(session, user_id=user.id)
        assert challenge is None

    async def test_get_active_challenge_not_found(self, session):
        challenge = await get_active_challenge(session, user_id=999999)
        assert challenge is None


class TestDeleteChallenge:
    async def test_delete_challenge_removes(self, session, user, test_challenge):
        await delete_challenge(session, user_id=user.id)
        challenge = await get_active_challenge(session, user_id=user.id)
        assert challenge is None

    async def test_delete_challenge_nonexistent(self, session):
        await delete_challenge(session, user_id=999999)


class TestDeleteExpiredChallenges:
    async def test_deletes_expired(self, session, user):
        await create_challenge(session, {
            "user_id": user.id,
            "challenge": "exp_challenge",
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
            "used": 0,
        })
        await session.commit()

        deleted = await delete_expired_challenges(session)
        assert deleted >= 1

    async def test_deletes_used(self, session, user):
        await create_challenge(session, {
            "user_id": user.id,
            "challenge": "used_ch",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": 1,
        })
        await session.commit()

        deleted = await delete_expired_challenges(session)
        assert deleted >= 1

    async def test_keeps_active(self, session, user, test_challenge):
        await delete_expired_challenges(session)
        active = await get_active_challenge(session, user_id=user.id)
        assert active is not None