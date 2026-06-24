"""Auth routes: register, login, me."""
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from bson.errors import InvalidId

from ..db import get_db
from ..auth import hash_password, verify_password, sign_token, require_user, require_db

router = APIRouter()
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class RegisterIn(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None


class LoginIn(BaseModel):
    email: str | None = None
    password: str | None = None


def safe_user(u: dict) -> dict:
    created = u.get("createdAt")
    return {
        "id": str(u["_id"]),
        "name": u.get("name"),
        "email": u.get("email"),
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
    }


@router.post("/register")
def register(body: RegisterIn):
    require_db()
    if not body.name or not body.email or not body.password:
        raise HTTPException(400, "Name, email, and password are required.")
    if not EMAIL_RE.match(body.email):
        raise HTTPException(400, "Please provide a valid email address.")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    db = get_db()
    if db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(409, "An account with that email already exists.")

    doc = {
        "name": body.name,
        "email": body.email.lower(),
        "passwordHash": hash_password(body.password),
        "createdAt": datetime.now(timezone.utc),
    }
    doc["_id"] = db.users.insert_one(doc).inserted_id
    return JSONResponse(status_code=201, content={"token": sign_token(doc["_id"]), "user": safe_user(doc)})


@router.post("/login")
def login(body: LoginIn):
    require_db()
    if not body.email or not body.password:
        raise HTTPException(400, "Email and password are required.")

    db = get_db()
    user = db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("passwordHash", "")):
        raise HTTPException(401, "Invalid email or password.")
    return {"token": sign_token(user["_id"]), "user": safe_user(user)}


@router.get("/me")
def me(user_id: str = Depends(require_user)):
    require_db()
    db = get_db()
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except InvalidId:
        user = None
    if not user:
        raise HTTPException(404, "User not found.")
    return {"user": safe_user(user)}
