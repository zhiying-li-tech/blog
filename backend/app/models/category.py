from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class Category(Document):
    name: Indexed(str, unique=True)
    slug: Indexed(str, unique=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "categories"
