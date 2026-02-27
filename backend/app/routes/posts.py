import math
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.middleware.auth import require_role
from app.models import User
from app.models.user import UserRole
from app.schemas.common import PaginatedData, Pagination, ResponseModel
from app.schemas.post import PostCreate, PostListItem, PostResponse, PostUpdate
from app.services.post import (
    create_post,
    delete_post,
    get_post_by_slug,
    get_posts,
    update_post,
)
from app.services.search import search_posts, search_suggest

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/search", response_model=ResponseModel)
async def search(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    items, total = await search_posts(q, page, page_size)
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return ResponseModel(
        data=PaginatedData[PostListItem](
            items=[PostListItem(**i) for i in items],
            pagination=Pagination(
                page=page, page_size=page_size, total=total, total_pages=total_pages
            ),
        ).model_dump()
    )


@router.get("/search/suggest", response_model=ResponseModel)
async def suggest(q: str = Query(..., min_length=1)):
    suggestions = await search_suggest(q)
    return ResponseModel(data=suggestions)


@router.get("", response_model=ResponseModel)
async def list_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    status: str = Query("published"),
):
    items, total = await get_posts(
        page=page,
        page_size=page_size,
        category_slug=category,
        tag_slug=tag,
        status=status if status else "published",
        author_id=author,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return ResponseModel(
        data=PaginatedData[PostListItem](
            items=[PostListItem(**i) for i in items],
            pagination=Pagination(
                page=page, page_size=page_size, total=total, total_pages=total_pages
            ),
        ).model_dump()
    )


@router.get("/{slug}", response_model=ResponseModel)
async def get_post(slug: str):
    post_data = await get_post_by_slug(slug)
    return ResponseModel(data=PostResponse(**post_data).model_dump())


@router.post("", response_model=ResponseModel)
async def create(
    data: PostCreate,
    user: User = Depends(require_role([UserRole.AUTHOR, UserRole.ADMIN])),
):
    post = await create_post(data, user)
    from app.services.post import _build_single_response

    post_data = await _build_single_response(post, include_content=True)
    return ResponseModel(data=PostResponse(**post_data).model_dump())


@router.put("/{slug}", response_model=ResponseModel)
async def update(
    slug: str,
    data: PostUpdate,
    user: User = Depends(require_role([UserRole.AUTHOR, UserRole.ADMIN])),
):
    post_data = await update_post(slug, data, user)
    return ResponseModel(data=PostResponse(**post_data).model_dump())


@router.delete("/{slug}", response_model=ResponseModel)
async def delete(
    slug: str,
    user: User = Depends(require_role([UserRole.AUTHOR, UserRole.ADMIN])),
):
    await delete_post(slug, user)
    return ResponseModel(message="Post deleted successfully")
