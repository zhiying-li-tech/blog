from datetime import datetime
from enum import Enum
from typing import List, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import DESCENDING, IndexModel, TEXT


class PostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class Post(Document):
    title: str
    slug: Indexed(str, unique=True)
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: PydanticObjectId
    category_id: Optional[PydanticObjectId] = None
    tag_ids: List[PydanticObjectId] = Field(default_factory=list)
    status: PostStatus = PostStatus.DRAFT
    view_count: int = 0
    is_deleted: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "posts"
        indexes = [
            IndexModel([("title", TEXT), ("content", TEXT)]),
            IndexModel(
                [("is_deleted", 1), ("status", 1), ("created_at", DESCENDING)],
                name="idx_list_posts",
            ),
            IndexModel([("author_id", 1), ("is_deleted", 1)], name="idx_author"),
            IndexModel([("category_id", 1), ("is_deleted", 1)], name="idx_category"),
            IndexModel([("tag_ids", 1), ("is_deleted", 1)], name="idx_tags"),
        ]
