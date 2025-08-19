# mypy: disable-error-code="assignment"

from __future__ import annotations

from datetime import datetime
from enum import Enum, StrEnum
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, RootModel


class ToolInputs(RootModel[Any]):
    root: Any


class Data(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: Annotated[int, Field(gt=0)]
    dashboardId: Annotated[int, Field(gt=0)]


class DashboardAddInsightSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: Data


class Data1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: Annotated[str, Field(min_length=1)]
    description: str | None = None
    pinned: bool | None = False
    tags: list[str] | None = None


class DashboardCreateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: Data1


class DashboardDeleteSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dashboardId: float


class Data2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    limit: Annotated[int | None, Field(gt=0)] = None
    offset: Annotated[int | None, Field(ge=0)] = None
    search: str | None = None
    pinned: bool | None = None


class DashboardGetAllSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: Data2 | None = None


class DashboardGetSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dashboardId: float


class Data3(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    description: str | None = None
    pinned: bool | None = None
    tags: list[str] | None = None


class DashboardUpdateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dashboardId: float
    data: Data3


class DocumentationSearchSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    query: str


class ErrorTrackingDetailsSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    issueId: UUID
    dateFrom: datetime | None = None
    dateTo: datetime | None = None


class OrderBy(StrEnum):
    OCCURRENCES = "occurrences"
    FIRST_SEEN = "first_seen"
    LAST_SEEN = "last_seen"
    USERS = "users"
    SESSIONS = "sessions"


class OrderDirection(StrEnum):
    ASC = "ASC"
    DESC = "DESC"


class Status(StrEnum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ALL = "all"
    SUPPRESSED = "suppressed"


class ErrorTrackingListSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    orderBy: OrderBy | None = None
    dateFrom: datetime | None = None
    dateTo: datetime | None = None
    orderDirection: OrderDirection | None = None
    filterTestAccounts: bool | None = None
    status: Status | None = None


class ExperimentGetAllSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class Operator(StrEnum):
    EXACT = "exact"
    IS_NOT = "is_not"
    ICONTAINS = "icontains"
    NOT_ICONTAINS = "not_icontains"
    REGEX = "regex"
    NOT_REGEX = "not_regex"
    IS_CLEANED_PATH_EXACT = "is_cleaned_path_exact"
    exact_1 = "exact"
    is_not_1 = "is_not"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    MIN = "min"
    MAX = "max"
    exact_2 = "exact"
    is_not_2 = "is_not"
    IN_ = "in"
    NOT_IN = "not_in"


class Property(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | bool | list[str] | list[float]
    operator: Operator | None = None


class Group(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    properties: list[Property]
    rollout_percentage: float


class Filters(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    groups: list[Group]


class FeatureFlagCreateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str
    key: str
    description: str
    filters: Filters
    active: bool
    tags: list[str] | None = None


class FeatureFlagDeleteSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    flagKey: str


class FeatureFlagGetAllSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class FeatureFlagGetDefinitionSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    flagId: Annotated[int | None, Field(gt=0)] = None
    flagKey: str | None = None


class Property1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | bool | list[str] | list[float]
    operator: Operator | None = None


class Group1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    properties: list[Property1]
    rollout_percentage: float


class Filters1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    groups: list[Group1]


class Data4(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    description: str | None = None
    filters: Filters1 | None = None
    active: bool | None = None
    tags: list[str] | None = None


class FeatureFlagUpdateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    flagKey: str
    data: Data4


class DateRange(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    date_from: str
    """
    The start date of the date range. Could be a date string or a relative date string like '-7d'
    """
    date_to: str
    """
    The end date of the date range. Could be a date string or a relative date string like '-1d'
    """


class Filters2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dateRange: DateRange | None = None


class Source(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Literal["HogQLQuery"] = "HogQLQuery"
    query: str
    explain: bool | None = None
    filters: Filters2 | None = None


class Query(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Literal["DataVisualizationNode"] = "DataVisualizationNode"
    source: Source


class Data5(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str
    query: Query
    description: str | None = None
    saved: bool | None = True
    favorited: bool | None = False
    tags: list[str] | None = None


class InsightCreateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: Data5


class InsightDeleteSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: float


class Data6(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    limit: float | None = None
    offset: float | None = None
    saved: bool | None = None
    favorited: bool | None = None
    search: str | None = None


class InsightGetAllSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    data: Data6 | None = None


class InsightGetSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: float


class InsightGetSqlSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    query: Annotated[str, Field(max_length=1000)]
    """
    Your natural language query describing the SQL insight (max 1000 characters).
    """


class InsightQuerySchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: float


class Data7(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    description: str | None = None
    filters: dict[str, Any] | None = None
    query: dict[str, Any] | None = None
    saved: bool | None = None
    favorited: bool | None = None
    dashboard: float | None = None
    tags: list[str] | None = None


class InsightUpdateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: float
    data: Data7


class LLMObservabilityGetCostsSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    projectId: Annotated[int, Field(gt=0)]
    days: float | None = None


class OrganizationGetAllSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class OrganizationGetDetailsSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class OrganizationSetActiveSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    orgId: UUID


class ProjectGetAllSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class ProjectPropertyDefinitionsSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class ProjectSetActiveSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    projectId: Annotated[int, Field(gt=0)]
