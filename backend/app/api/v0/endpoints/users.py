from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models import User
from app.db import crud
from app.schemas import APIResponse, UserPublic


router = APIRouter()


@router.get(
    "",
    response_model=APIResponse[list[UserPublic]],
    summary="Get all users with their public keys",
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> APIResponse[list[UserPublic]]:
    """
    возвращает список всех зарегистрированных пользователей
    требует авторизации (токен)
    """
    users: list[User] = await crud.get_all_users(db)
    return APIResponse.ok([UserPublic.model_validate(u) for u in users])