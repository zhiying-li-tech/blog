from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ResponseModel(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    pagination: Pagination
