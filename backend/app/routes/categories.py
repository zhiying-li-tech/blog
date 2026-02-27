from datetime import datetime
from typing import List

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import require_role
from app.models import Category, Post, User
from app.models.user import UserRole
from app.schemas.common import ResponseModel
from app.schemas.post import CategoryCreate, CategoryResponse, CategoryUpdate
from app.utils.slug import generate_slug

router = APIRouter(prefix="/categories", tags=["Categories"])


async def _get_post_counts() -> dict:
    pipeline = [
        {"$match": {"is_deleted": False}},
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
    ]
    results = await Post.aggregate(pipeline).to_list()
    return {r["_id"]: r["count"] for r in results if r["_id"]}


@router.get("", response_model=ResponseModel)
async def list_categories():
    categories, counts = await _concurrent_load()
    items = [
        CategoryResponse(
            id=str(cat.id),
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            post_count=counts.get(cat.id, 0),
            created_at=cat.created_at,
            updated_at=cat.updated_at,
        ).model_dump()
        for cat in categories
    ]
    return ResponseModel(data=items)


async def _concurrent_load():
    import asyncio
    return await asyncio.gather(
        Category.find_all().to_list(),
        _get_post_counts(),
    )


@router.post("", response_model=ResponseModel)
async def create_category(
    data: CategoryCreate,
    user: User = Depends(require_role([UserRole.ADMIN])),
):
    existing = await Category.find_one(Category.name == data.name)
    if existing:
        raise HTTPException(400, "Category already exists")
    cat = Category(
        name=data.name,
        slug=generate_slug(data.name),
        description=data.description,
    )
    await cat.insert()
    post_count = 0
    return ResponseModel(data=CategoryResponse(
        id=str(cat.id),
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        post_count=post_count,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    ).model_dump())


@router.put("/{slug}", response_model=ResponseModel)
async def update_category(
    slug: str,
    data: CategoryUpdate,
    user: User = Depends(require_role([UserRole.ADMIN])),
):
    cat = await Category.find_one(Category.slug == slug)
    if not cat:
        raise HTTPException(404, "Category not found")
    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != cat.name:
        existing = await Category.find_one(Category.name == update_data["name"])
        if existing:
            raise HTTPException(400, "Category name already exists")
        update_data["slug"] = generate_slug(update_data["name"])
    for key, value in update_data.items():
        setattr(cat, key, value)
    cat.updated_at = datetime.utcnow()
    await cat.save()
    post_count = await Post.find(
        Post.category_id == cat.id, Post.is_deleted == False
    ).count()
    return ResponseModel(data=CategoryResponse(
        id=str(cat.id),
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        post_count=post_count,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
    ).model_dump())


@router.delete("/{slug}", response_model=ResponseModel)
async def delete_category(
    slug: str,
    user: User = Depends(require_role([UserRole.ADMIN])),
):
    cat = await Category.find_one(Category.slug == slug)
    if not cat:
        raise HTTPException(404, "Category not found")
    post_count = await Post.find(
        Post.category_id == cat.id, Post.is_deleted == False
    ).count()
    if post_count > 0:
        raise HTTPException(400, "Cannot delete category with associated posts")
    await cat.delete()
    return ResponseModel(message="Category deleted successfully")
