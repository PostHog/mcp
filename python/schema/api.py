from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel


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
