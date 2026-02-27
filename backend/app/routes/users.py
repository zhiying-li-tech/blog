from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user
from app.models import User
from app.schemas.common import ResponseModel
from app.schemas.user import PasswordChange, UserResponse, UserUpdate
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


def _user_response(user: User) -> dict:
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        avatar=user.avatar,
        bio=user.bio,
        role=user.role.value,
        created_at=user.created_at,
    ).model_dump()


@router.get("/me", response_model=ResponseModel)
async def get_me(user: User = Depends(get_current_user)):
    return ResponseModel(data=_user_response(user))


@router.put("/me", response_model=ResponseModel)
async def update_me(data: UserUpdate, user: User = Depends(get_current_user)):
    update_data = data.model_dump(exclude_unset=True)
    if "username" in update_data:
        existing = await User.find_one(
            User.username == update_data["username"], User.id != user.id
        )
        if existing:
            raise HTTPException(400, "Username already taken")
    for key, value in update_data.items():
        setattr(user, key, value)
    user.updated_at = datetime.utcnow()
    await user.save()
    return ResponseModel(data=_user_response(user))


@router.put("/me/password", response_model=ResponseModel)
async def change_password(data: PasswordChange, user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(400, "Old password is incorrect")
    user.password_hash = hash_password(data.new_password)
    user.updated_at = datetime.utcnow()
    await user.save()
    return ResponseModel(message="Password changed successfully")


@router.get("/{user_id}", response_model=ResponseModel)
async def get_user(user_id: str):
    user = await User.get(PydanticObjectId(user_id))
    if not user or not user.is_active:
        raise HTTPException(404, "User not found")
    return ResponseModel(data=_user_response(user))
