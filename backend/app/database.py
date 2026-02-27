import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import settings
from app.models.user import User
from app.models.post import Post
from app.models.category import Category
from app.models.tag import Tag


async def init_db():
    client = AsyncIOMotorClient(settings.MONGO_URI, tlsCAFile=certifi.where())
    db = client[settings.DB_NAME]
    await init_beanie(
        database=db,
        document_models=[User, Post, Category, Tag],
    )
