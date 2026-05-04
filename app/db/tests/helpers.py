from datetime import datetime, timedelta, timezone


def make_user_data(username="testuser"):
    return {
        "username": username,
        "sign_public_key": b"sign_key_" + username.encode(),
        "dh_public_key": b"dh_key_" + username.encode(),
    }

def make_message_data(sender_id, days=1):
    return {
        "sender_id": sender_id,
        "ciphertext": b"encrypted_text",
        "nonce": bytes.fromhex("ab" * 24),
        "delete_at": datetime.now(timezone.utc) + timedelta(days=days),
    }

def make_challenge_data(user_id, hours=1, used=0):
    return {
        "user_id": user_id,
        "challenge": f"challenge_{user_id}_{hours}",
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=hours),
        "used": used,
    }

def make_session_data(user_id, hours=1):
    return {
        "token": f"token_{user_id}_{hours}",
        "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=hours),
    }