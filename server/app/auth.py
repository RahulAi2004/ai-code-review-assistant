"""JWT auth, password hashing, and FastAPI dependencies."""
import os
import time

import jwt
import bcrypt
from fastapi import Header, HTTPException

from .db import is_db_ready

JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRES_DAYS = 7


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def sign_token(user_id) -> str:
    payload = {
        "sub": str(user_id),
        "exp": int(time.time()) + JWT_EXPIRES_DAYS * 86400,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _read_token(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])["sub"]
    except Exception:
        return None


# Dependency: hard requirement — 401 if not authenticated.
def require_user(authorization: str | None = Header(default=None)) -> str:
    user_id = _read_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user_id


# Dependency: soft — returns the user id if a valid token is present, else None.
def optional_user(authorization: str | None = Header(default=None)):
    return _read_token(authorization)


def require_db():
    if not is_db_ready():
        raise HTTPException(status_code=503, detail="Database is not available. Running in guest mode.")
