from typing import Any
from uuid import UUID

from pydantic import BaseModel, RootModel

from schema.query import InsightQuery


class User(BaseModel):
    id: int
    uuid: UUID
    distinct_id: str
    first_name: str
    email: str


class Insight(BaseModel):
    id: int
    name: str
    description: str | None = None
    filters: dict[str, Any]
    query: dict[str, Any] | None = None
    result: Any | None = None
    created_at: str
    updated_at: str
    created_by: User | None = None
    saved: bool
    favorited: bool | None = None
    deleted: bool
    dashboard: int | None = None
    layouts: dict[str, Any] | None = None
    color: str | None = None
    last_refresh: str | None = None
    refreshing: bool | None = None
    tags: list[str] | None = None


class CreateInsightInput(BaseModel):
    name: str
    query: InsightQuery
    description: str | None = None
    saved: bool = True
    favorited: bool = False
    tags: list[str] | None = None


class UpdateInsightInput(BaseModel):
    name: str | None = None
    description: str | None = None
    filters: dict[str, Any] | None = None
    query: InsightQuery | None = None
    saved: bool | None = None
    favorited: bool | None = None
    dashboard: int | None = None
    tags: list[str] | None = None


class ListInsights(BaseModel):
    limit: int | None = None
    offset: int | None = None
    saved: bool | None = None
    favorited: bool | None = None
    search: str | None = None


class SQLInsightResponseItem(BaseModel):
    type: str
    data: dict[str, Any]


class SQLInsightResponse(RootModel[list[SQLInsightResponseItem]]):
    root: list[SQLInsightResponseItem]
