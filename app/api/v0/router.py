from fastapi import APIRouter
from app.api.v0.endpoints import auth

v0router = APIRouter()
v0router.include_router(auth.router, prefix="/auth", tags=["auth"])