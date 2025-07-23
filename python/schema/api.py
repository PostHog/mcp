from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel
from enum import Enum


class PropertyType(str, Enum):
    STRING = "String"
    NUMERIC = "Numeric"
    BOOLEAN = "Boolean"
    DATETIME = "DateTime"


class ApiPropertyDefinition(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_numerical: Optional[bool] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    is_seen_on_filtered_events: Optional[bool] = None
    property_type: Optional[PropertyType] = None
    verified: Optional[bool] = None
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    hidden: Optional[bool] = None
    tags: List[str] = []


T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    count: int
    next: Optional[str] = None
    previous: Optional[str] = None
    results: List[T]