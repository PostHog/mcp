from typing import Any, Dict, List, Optional
from pydantic import BaseModel, RootModel
from uuid import UUID
from src.schema.query import InsightQuery


class User(BaseModel):
    id: int
    uuid: UUID
    distinct_id: str
    first_name: str
    email: str


class Insight(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any]
    query: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    created_at: str
    updated_at: str
    created_by: Optional[User] = None
    saved: bool
    favorited: Optional[bool] = None
    deleted: bool
    dashboard: Optional[int] = None
    layouts: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    last_refresh: Optional[str] = None
    refreshing: Optional[bool] = None
    tags: Optional[List[str]] = None


class CreateInsightInput(BaseModel):
    name: str
    query: InsightQuery
    description: Optional[str] = None
    saved: bool = True
    favorited: bool = False
    tags: Optional[List[str]] = None


class UpdateInsightInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    query: Optional[InsightQuery] = None
    saved: Optional[bool] = None
    favorited: Optional[bool] = None
    dashboard: Optional[int] = None
    tags: Optional[List[str]] = None


class ListInsights(BaseModel):
    limit: Optional[int] = None
    offset: Optional[int] = None
    saved: Optional[bool] = None
    favorited: Optional[bool] = None
    search: Optional[str] = None


class SQLInsightResponseItem(BaseModel):
    type: str
    data: Dict[str, Any]


class SQLInsightResponse(RootModel[List[SQLInsightResponseItem]]):
    root: List[SQLInsightResponseItem]