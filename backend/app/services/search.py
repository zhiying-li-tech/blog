import asyncio
import re
from typing import List, Tuple

from app.models import Post
from app.services.post import _batch_build_responses


async def search_posts(
    query: str, page: int = 1, page_size: int = 10
) -> Tuple[List[dict], int]:
    search_filter = {
        "$text": {"$search": query},
        "is_deleted": False,
        "status": "published",
    }
    total, posts = await asyncio.gather(
        Post.find(search_filter).count(),
        Post.find(search_filter)
        .sort(-Post.created_at)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(),
    )
    if not posts:
        return [], total
    items = await _batch_build_responses(posts, include_content=False)
    return items, total


async def search_suggest(query: str, limit: int = 5) -> List[dict]:
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    posts = (
        await Post.find(
            {"title": {"$regex": pattern}, "is_deleted": False, "status": "published"}
        )
        .limit(limit)
        .to_list()
    )
    return [{"title": post.title, "slug": post.slug} for post in posts]
