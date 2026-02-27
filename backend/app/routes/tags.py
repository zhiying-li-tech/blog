from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import require_role
from app.models import Tag, User
from app.models.user import UserRole
from app.schemas.common import ResponseModel
from app.schemas.post import TagCreate, TagResponse
from app.utils.slug import generate_slug

router = APIRouter(prefix="/tags", tags=["Tags"])


def _tag_response(tag: Tag) -> dict:
    return TagResponse(
        id=str(tag.id),
        name=tag.name,
        slug=tag.slug,
        created_at=tag.created_at,
    ).model_dump()


@router.get("", response_model=ResponseModel)
async def list_tags():
    tags = await Tag.find_all().to_list()
    return ResponseModel(data=[_tag_response(t) for t in tags])


@router.post("", response_model=ResponseModel)
async def create_tag(
    data: TagCreate,
    user: User = Depends(require_role([UserRole.AUTHOR, UserRole.ADMIN])),
):
    existing = await Tag.find_one(Tag.name == data.name)
    if existing:
        raise HTTPException(400, "Tag already exists")
    tag = Tag(
        name=data.name,
        slug=generate_slug(data.name),
    )
    await tag.insert()
    return ResponseModel(data=_tag_response(tag))


@router.delete("/{slug}", response_model=ResponseModel)
async def delete_tag(
    slug: str,
    user: User = Depends(require_role([UserRole.ADMIN])),
):
    tag = await Tag.find_one(Tag.slug == slug)
    if not tag:
        raise HTTPException(404, "Tag not found")
    await tag.delete()
    return ResponseModel(message="Tag deleted successfully")
