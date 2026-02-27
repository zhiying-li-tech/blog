from fastapi import APIRouter
from pydantic import BaseModel

from app.schemas.common import ResponseModel
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import authenticate_user, generate_tokens, refresh_tokens, register_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=ResponseModel)
async def register(data: UserCreate):
    user = await register_user(data)
    tokens = generate_tokens(user)
    return ResponseModel(
        data={
            "user": UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                avatar=user.avatar,
                bio=user.bio,
                role=user.role.value,
                created_at=user.created_at,
            ).model_dump(),
            "tokens": tokens.model_dump(),
        }
    )


@router.post("/login", response_model=ResponseModel)
async def login(data: UserLogin):
    user = await authenticate_user(data.email, data.password)
    tokens = generate_tokens(user)
    return ResponseModel(
        data={
            "user": UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                avatar=user.avatar,
                bio=user.bio,
                role=user.role.value,
                created_at=user.created_at,
            ).model_dump(),
            "tokens": tokens.model_dump(),
        }
    )


@router.post("/refresh", response_model=ResponseModel)
async def refresh(body: RefreshRequest):
    tokens = await refresh_tokens(body.refresh_token)
    return ResponseModel(data=tokens.model_dump())
