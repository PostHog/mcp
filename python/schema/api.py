from enum import Enum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, RootModel


class PropertyType(str, Enum):
    STRING = "String"
    NUMERIC = "Numeric"
    BOOLEAN = "Boolean"
    DATETIME = "DateTime"


class ApiPropertyDefinition(BaseModel):
    id: str
    name: str
    description: str | None = None
    is_numerical: bool | None = None
    updated_at: str | None = None
    updated_by: str | None = None
    is_seen_on_filtered_events: bool | None = None
    property_type: PropertyType | None = None
    verified: bool | None = None
    verified_at: str | None = None
    verified_by: str | None = None
    hidden: bool | None = None
    tags: list[str] = []


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    count: int
    next: str | None = None
    previous: str | None = None
    results: list[T]


# Organization API Schemas
class OrgListResponse(BaseModel):
    results: list["Organization"]


class ProjectListResponse(BaseModel):
    results: list["Project"]


# Feature Flag API Schemas
class FeatureFlagListItem(BaseModel):
    id: int
    key: str
    name: str
    active: bool


class FeatureFlagGetResponse(BaseModel):
    id: int
    key: str
    name: str
    active: bool
    description: str | None = None


class FeatureFlagCreateResponse(BaseModel):
    id: int
    key: str
    name: str
    active: bool


class FeatureFlagUpdateResponse(BaseModel):
    id: int
    key: str
    name: str
    active: bool


# Insight API Schemas
class InsightListItem(BaseModel):
    id: int
    name: str
    short_id: str
    description: str | None = None


class InsightCreateResponse(BaseModel):
    id: int
    name: str
    short_id: str


class InsightGetResponse(BaseModel):
    id: int
    name: str
    short_id: str
    description: str | None = None


class InsightUpdateResponse(BaseModel):
    id: int
    name: str
    short_id: str


class SQLInsightResponse(BaseModel):
    columns: list[str]
    results: list[list[Any]]


# Dashboard API Schemas
class DashboardListItem(BaseModel):
    id: int
    name: str
    description: str | None = None


class DashboardGetResponse(BaseModel):
    id: int
    name: str
    description: str | None = None


class DashboardCreateResponse(BaseModel):
    id: int
    name: str


class DashboardUpdateResponse(BaseModel):
    id: int
    name: str


# Query API Schemas
class QueryResponse(BaseModel):
    results: list[Any]


# User API Schemas
class UserResponse(BaseModel):
    distinct_id: str


# Generic API Schemas
class DeleteResponse(BaseModel):
    success: bool = True
    message: str = "Successfully deleted"


# SQL Insight API Schemas
class SqlInsightItem(BaseModel):
    data: dict[str, Any] | None = None
    type: str | None = None


class SqlInsightResponse(RootModel[list[SqlInsightItem]]):
    root: list[SqlInsightItem]

    @classmethod
    def model_validate(cls, value):
        if isinstance(value, list):
            return cls(root=[SqlInsightItem.model_validate(item) if isinstance(item, dict) else SqlInsightItem(data=item) for item in value])
        return super().model_validate(value)


# Forward references for imported types
from schema.orgs import Organization  # noqa: E402
from schema.projects import Project  # noqa: E402
