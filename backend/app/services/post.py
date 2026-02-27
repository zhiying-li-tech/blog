import asyncio
from datetime import datetime
from typing import List, Optional, Tuple

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models import Category, Post, Tag, User
from app.models.post import PostStatus
from app.schemas.post import (
    AuthorInfo,
    CategoryInfo,
    PostCreate,
    PostListItem,
    PostUpdate,
    TagInfo,
)
from app.utils.slug import generate_slug


async def create_post(data: PostCreate, author: User) -> Post:
    slug = generate_slug(data.title)
    post = Post(
        title=data.title,
        slug=slug,
        content=data.content,
        summary=data.summary,
        cover_image=data.cover_image,
        author_id=author.id,
        category_id=PydanticObjectId(data.category_id) if data.category_id else None,
        tag_ids=[PydanticObjectId(tid) for tid in data.tag_ids] if data.tag_ids else [],
        status=PostStatus(data.status) if data.status else PostStatus.DRAFT,
    )
    if post.status == PostStatus.PUBLISHED:
        post.published_at = datetime.utcnow()
    await post.insert()
    return post


async def get_posts(
    page: int = 1,
    page_size: int = 10,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    status: str = "published",
    author_id: Optional[str] = None,
) -> Tuple[List[dict], int]:
    query_filter: dict = {"is_deleted": False}

    if status:
        query_filter["status"] = status

    if author_id:
        query_filter["author_id"] = PydanticObjectId(author_id)

    if category_slug:
        cat = await Category.find_one(Category.slug == category_slug)
        if cat:
            query_filter["category_id"] = cat.id
        else:
            return [], 0

    if tag_slug:
        tag = await Tag.find_one(Tag.slug == tag_slug)
        if tag:
            query_filter["tag_ids"] = {"$in": [tag.id]}
        else:
            return [], 0

    total, posts = await asyncio.gather(
        Post.find(query_filter).count(),
        Post.find(query_filter)
        .sort(-Post.created_at)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(),
    )

    if not posts:
        return [], total

    items = await _batch_build_responses(posts, include_content=False)
    return items, total


async def get_post_by_slug(slug: str) -> dict:
    post = await Post.find_one(Post.slug == slug, Post.is_deleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    await Post.find_one(Post.id == post.id).update({"$inc": {"view_count": 1}})
    post.view_count += 1
    return await _build_single_response(post, include_content=True)


async def update_post(slug: str, data: PostUpdate, user: User) -> dict:
    post = await Post.find_one(Post.slug == slug, Post.is_deleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(403, "Permission denied")

    update_data = data.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        val = update_data["category_id"]
        update_data["category_id"] = PydanticObjectId(val) if val else None

    if "tag_ids" in update_data:
        val = update_data["tag_ids"]
        update_data["tag_ids"] = [PydanticObjectId(tid) for tid in val] if val else []

    if "status" in update_data:
        update_data["status"] = PostStatus(update_data["status"])
        if update_data["status"] == PostStatus.PUBLISHED and not post.published_at:
            update_data["published_at"] = datetime.utcnow()

    if "title" in update_data and update_data["title"] != post.title:
        update_data["slug"] = generate_slug(update_data["title"])

    update_data["updated_at"] = datetime.utcnow()

    for key, value in update_data.items():
        setattr(post, key, value)
    await post.save()
    return await _build_single_response(post, include_content=True)


async def delete_post(slug: str, user: User) -> bool:
    post = await Post.find_one(Post.slug == slug, Post.is_deleted == False)
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(403, "Permission denied")
    post.is_deleted = True
    post.updated_at = datetime.utcnow()
    await post.save()
    return True


async def _batch_build_responses(
    posts: List[Post], include_content: bool = False
) -> List[dict]:
    author_ids = list({p.author_id for p in posts})
    category_ids = list({p.category_id for p in posts if p.category_id})
    tag_ids = list({tid for p in posts for tid in p.tag_ids})

    async def _empty():
        return []

    authors_task = User.find({"_id": {"$in": author_ids}}).to_list() if author_ids else _empty()
    categories_task = Category.find({"_id": {"$in": category_ids}}).to_list() if category_ids else _empty()
    tags_task = Tag.find({"_id": {"$in": tag_ids}}).to_list() if tag_ids else _empty()

    authors_list, categories_list, tags_list = await asyncio.gather(
        authors_task, categories_task, tags_task
    )

    authors_map = {a.id: a for a in authors_list}
    categories_map = {c.id: c for c in categories_list}
    tags_map = {t.id: t for t in tags_list}

    return [
        _format_post(post, authors_map, categories_map, tags_map, include_content)
        for post in posts
    ]


async def _build_single_response(post: Post, include_content: bool = True) -> dict:
    tasks = [User.get(post.author_id)]

    if post.category_id:
        tasks.append(Category.get(post.category_id))
    if post.tag_ids:
        tasks.append(Tag.find({"_id": {"$in": post.tag_ids}}).to_list())

    results = await asyncio.gather(*tasks)

    author = results[0]
    idx = 1
    cat = None
    tag_list = []
    if post.category_id:
        cat = results[idx]
        idx += 1
    if post.tag_ids:
        tag_list = results[idx]

    authors_map = {author.id: author} if author else {}
    categories_map = {cat.id: cat} if cat else {}
    tags_map = {t.id: t for t in tag_list}

    return _format_post(post, authors_map, categories_map, tags_map, include_content)


def _format_post(
    post: Post,
    authors_map: dict,
    categories_map: dict,
    tags_map: dict,
    include_content: bool,
) -> dict:
    author = authors_map.get(post.author_id)
    author_info = AuthorInfo(
        id=str(author.id), username=author.username, avatar=author.avatar
    ) if author else AuthorInfo(id="", username="unknown", avatar=None)

    category_info = None
    if post.category_id:
        cat = categories_map.get(post.category_id)
        if cat:
            category_info = CategoryInfo(id=str(cat.id), name=cat.name, slug=cat.slug)

    tag_infos = [
        TagInfo(id=str(tags_map[tid].id), name=tags_map[tid].name, slug=tags_map[tid].slug)
        for tid in post.tag_ids
        if tid in tags_map
    ]

    result = {
        "id": str(post.id),
        "title": post.title,
        "slug": post.slug,
        "summary": post.summary,
        "cover_image": post.cover_image,
        "author": author_info,
        "category": category_info,
        "tags": tag_infos,
        "status": post.status.value,
        "view_count": post.view_count,
        "published_at": post.published_at,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
    if include_content:
        result["content"] = post.content
    return result
