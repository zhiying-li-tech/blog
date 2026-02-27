from fastapi import HTTPException
from beanie import PydanticObjectId

from app.models import User
from app.schemas.user import UserCreate, TokenResponse
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


async def register_user(data: UserCreate) -> User:
    existing = await User.find_one(
        {"$or": [{"email": data.email}, {"username": data.username}]}
    )
    if existing:
        raise HTTPException(400, "Email or username already registered")
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    await user.insert()
    return user


async def authenticate_user(email: str, password: str) -> User:
    user = await User.find_one(User.email == email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account is disabled")
    return user


def generate_tokens(user: User) -> TokenResponse:
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, refresh_token=refresh)


async def refresh_tokens(refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid token type, expected refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Invalid token")
    user = await User.get(PydanticObjectId(user_id))
    if not user or not user.is_active:
        raise HTTPException(401, "User not found")
    return generate_tokens(user)
