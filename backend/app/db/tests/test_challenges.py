import pytest
import sqlalchemy
from app.db import crud, models
from app.db.tests.helpers import make_challenge_data
from datetime import datetime, timedelta, timezone


class TestCreateChallenge:
    
    @pytest.mark.asyncio
    async def test_create_challenge_success(self, session, user):
        challenge = await crud.create_challenge(session, make_challenge_data(user.id))

        assert challenge.user_id == user.id
        assert challenge.used is False
        assert challenge.challenge is not None

        await session.commit()
        await session.refresh(challenge)
        assert challenge.challenge is not None

    @pytest.mark.asyncio
    async def test_create_challenge_multiple(self, session, user):
        await crud.create_challenge(session, make_challenge_data(user.id, hours=1))
        await session.commit()

        new = await crud.create_challenge(session, {
            "user_id": user.id,
            "challenge": "brand_new_challenge",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        await session.commit()
        await session.refresh(new)

        all_challenges = (await session.execute(
            sqlalchemy.select(models.Challenge)
        )).scalars().all()
        assert len(all_challenges) >= 2


class TestGetActiveChallenge:
    @pytest.mark.asyncio
    async def test_get_active_challenge_found(self, session, user, test_challenge):
        challenge = await crud.get_active_challenge(session, user_id=user.id)
        assert challenge is not None
        assert challenge.challenge == test_challenge.challenge

    @pytest.mark.asyncio
    async def test_get_active_challenge_expired(self, session, user):
        await crud.create_challenge(session, {
            "user_id": user.id,
            "challenge": "expired_one",
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
            "used": False,
        })
        await session.commit()

        challenge = await crud.get_active_challenge(session, user_id=user.id)
        assert challenge is None

    @pytest.mark.asyncio
    async def test_get_active_challenge_used(self, session, user):
        await crud.create_challenge(session, {
            "user_id": user.id,
            "challenge": "used_challenge",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": True,
        })
        await session.commit()

        challenge = await crud.get_active_challenge(session, user_id=user.id)
        assert challenge is None

    @pytest.mark.asyncio
    async def test_get_active_challenge_not_found(self, session):
        challenge = await crud.get_active_challenge(session, user_id=999999)
        assert challenge is None


class TestDeleteChallenge:
    @pytest.mark.asyncio
    async def test_delete_challenge_removes(self, session, user, test_challenge):
        await crud.delete_challenge(session, user_id=user.id)
        await session.commit()
        challenge = await crud.get_active_challenge(session, user_id=user.id)
        assert challenge is None

    @pytest.mark.asyncio
    async def test_delete_challenge_nonexistent(self, session):
        await crud.delete_challenge(session, user_id=999999)


class TestDeleteExpiredChallenges:
    @pytest.mark.asyncio
    async def test_deletes_expired(self, session, user):
        await crud.create_challenge(session, {
            "user_id": user.id,
            "challenge": "exp_challenge",
            "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1),
            "used": False,
        })
        await session.commit()

        deleted = await crud.delete_expired_challenges(session)
        assert deleted >= 1

    @pytest.mark.asyncio
    async def test_deletes_used(self, session, user):
        await crud.create_challenge(session, {
            "user_id": user.id,
            "challenge": "used_ch",
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": True,
        })
        await session.commit()

        deleted = await crud.delete_expired_challenges(session)
        assert deleted >= 1

    @pytest.mark.asyncio
    async def test_keeps_active(self, session, user, test_challenge):
        await crud.delete_expired_challenges(session)
        active = await crud.get_active_challenge(session, user_id=user.id)
        assert active is not None
