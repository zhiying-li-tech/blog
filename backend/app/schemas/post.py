from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PostCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    status: Optional[str] = "draft"


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    status: Optional[str] = None


class AuthorInfo(BaseModel):
    id: str
    username: str
    avatar: Optional[str] = None


class CategoryInfo(BaseModel):
    id: str
    name: str
    slug: str


class TagInfo(BaseModel):
    id: str
    name: str
    slug: str


class PostResponse(BaseModel):
    id: str
    title: str
    slug: str
    content: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    author: AuthorInfo
    category: Optional[CategoryInfo] = None
    tags: List[TagInfo] = []
    status: str
    view_count: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PostListItem(BaseModel):
    id: str
    title: str
    slug: str
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    author: AuthorInfo
    category: Optional[CategoryInfo] = None
    tags: List[TagInfo] = []
    status: str
    view_count: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    post_count: int = 0
    created_at: datetime
    updated_at: datetime


class TagCreate(BaseModel):
    name: str


class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime


class SearchSuggestion(BaseModel):
    title: str
    slug: str
