import pytest
from app.db import crud
from app.db.tests.helpers import make_user_data


class TestCreateUser:
    @pytest.mark.asyncio
    async def test_create_user_success(self, session):
        u = await crud.create_user(session, make_user_data("alice"))

        assert u.username == "alice"
        assert u.id is None

        await session.commit()
        assert u.id is not None

    @pytest.mark.asyncio
    async def test_create_user_persists(self, session):
        u = await crud.create_user(session, make_user_data("bob"))
        await session.commit()

        found = await crud.get_user_by_id(session, u.id)
        assert found is not None
        assert found.username == "bob"


class TestCreateMultipleUsers:
    @pytest.mark.asyncio
    async def test_create_multiple_users(self, session):
        users_data = [make_user_data(f"user_{i}") for i in range(3)]
        users = await crud.create_multiple_users(session, users_data)
        await session.commit()

        assert len(users) == 3
        all_users = await crud.get_all_users(session)
        assert len(all_users) >= 3


class TestGetUserById:
    @pytest.mark.asyncio
    async def test_get_existing_user(self, session, user):
        found = await crud.get_user_by_id(session, user.id)
        assert found is not None
        assert found.id == user.id

    @pytest.mark.asyncio
    async def test_get_nonexistent_user(self, session):
        found = await crud.get_user_by_id(session, 999999)
        assert found is None


class TestGetUserByUsername:
    @pytest.mark.asyncio
    async def test_get_existing_user(self, session, user):
        found = await crud.get_user_by_username(session, user.username)
        assert found is not None
        assert found.username == user.username

    @pytest.mark.asyncio
    async def test_get_nonexistent_user(self, session):
        found = await crud.get_user_by_username(session, "nonexistent")
        assert found is None


class TestGetAllUsers:
    @pytest.mark.asyncio
    async def test_get_all_empty(self, session):
        users = await crud.get_all_users(session)
        assert isinstance(users, list)

    @pytest.mark.asyncio
    async def test_get_all_returns_created(self, session, user):
        users = await crud.get_all_users(session)
        ids = [u.id for u in users]
        assert user.id in ids


class TestDeleteUser:
    @pytest.mark.asyncio
    async def test_delete_user_removes(self, session, user):
        await crud.delete_user(session, user.id)
        found = await crud.get_user_by_id(session, user.id)
        assert found is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_user(self, session):
        await crud.delete_user(session, 999999)


class TestUpdateUserKeys:
    @pytest.mark.asyncio
    async def test_update_keys(self, session, user):
        new_sign_key = b"new_sign_key"
        new_dh_key = b"new_dh_key"

        updated = await crud.update_user_keys(
            session, user.id,
            sign_public_key=new_sign_key,
            dh_public_key=new_dh_key
        )

        assert updated.sign_public_key == new_sign_key
        assert updated.dh_public_key == new_dh_key

    @pytest.mark.asyncio
    async def test_update_nonexistent_user(self, session):
        result = await crud.update_user_keys(session, 999999, sign_public_key=b"key")
        assert result is None