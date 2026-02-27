from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class UserRole(str, Enum):
    VISITOR = "visitor"
    AUTHOR = "author"
    ADMIN = "admin"


class User(Document):
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    password_hash: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: UserRole = UserRole.AUTHOR
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
