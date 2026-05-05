from fastapi import APIRouter
from app.api.v0.endpoints import auth, users, keys

v0router = APIRouter()
v0router.include_router(auth.router, prefix="/auth", tags=["auth"])
v0router.include_router(users.router, prefix="/users", tags=["users"])
v0router.include_router(keys.router, prefix="/keys", tags=["keys"])