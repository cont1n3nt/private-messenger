import asyncio
import base64
import json
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption

from app.db.session import AsyncSessionLocal
from app.db.init_db import init_db
from app.db import crud


USERNAMES: list[str] = ["kosmo", "ayala13rus", "treizd"]
KEYS_DIR: Path = Path("keys")


def generate_keypairs() -> dict[str, bytes]:
    """
    генерит две пары ключей для юзеров

    sign_private_key - приватный ключ Ed25519 (raw 32 байта)
    sign_public_key - публичный ключ Ed25519 (raw 32 байта)
    dh_private_key - приватный ключ X25519 (raw 32 байта)
    dh_public_key - публичный ключ X25519 (raw 32 байта)
    """
    sign_priv = Ed25519PrivateKey.generate()
    sign_pub = sign_priv.public_key()

    dh_priv = X25519PrivateKey.generate()
    dh_pub = dh_priv.public_key()

    return {
        "sign_private_key": sign_priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption()),
        "sign_public_key":  sign_pub.public_bytes(Encoding.Raw, PublicFormat.Raw),
        "dh_private_key":   dh_priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption()),
        "dh_public_key":    dh_pub.public_bytes(Encoding.Raw, PublicFormat.Raw),
    }


def save_private_keys(username: str, keys: dict[str, bytes]) -> Path:
    KEYS_DIR.mkdir(exist_ok=True)

    payload = {
        "username": username,
        "sign_private_key": base64.b64encode(keys["sign_private_key"]).decode(),
        "sign_public_key":  base64.b64encode(keys["sign_public_key"]).decode(),
        "dh_private_key":   base64.b64encode(keys["dh_private_key"]).decode(),
        "dh_public_key":    base64.b64encode(keys["dh_public_key"]).decode(),
    }

    path = KEYS_DIR / f"{username}.json"
    path.write_text(json.dumps(payload, indent=2))
    return path


async def seed_user(username: str) -> None:
    async with AsyncSessionLocal() as session:
        existing = await crud.get_user_by_username(session, username)
        if existing is not None:
            return

        keys = generate_keypairs()

        await crud.create_user(session, {
            "username": username,
            "sign_public_key": keys["sign_public_key"],
            "dh_public_key":   keys["dh_public_key"],
        })
        await session.commit()

        key_path = save_private_keys(username, keys)


async def main() -> None:
    await init_db()

    for username in USERNAMES:
        await seed_user(username)
    print(f"'{KEYS_DIR}/'")


if __name__ == "__main__":
    asyncio.run(main())