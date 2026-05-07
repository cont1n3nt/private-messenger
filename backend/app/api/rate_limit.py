from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

def _get_real_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    return get_remote_address(request)

limiter = Limiter(key_func=_get_real_ip)
