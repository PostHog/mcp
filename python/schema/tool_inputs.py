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
    insightId: str
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
    pinned: bool | None = None
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


class ExperimentGetSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    experimentId: float
    """
    The ID of the experiment to retrieve
    """


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


class Kind(StrEnum):
    INSIGHT_VIZ_NODE = "InsightVizNode"
    DATA_VISUALIZATION_NODE = "DataVisualizationNode"


class Query(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Kind
    source: Any | None = None
    """
    For new insights, use the query from your successful query-run tool call. For updates, the existing query can optionally be reused.
    """


class Data5(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str
    query: Query
    description: str | None = None
    favorited: bool
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
    insightId: str


class InsightGenerateHogQLFromQuestionSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    question: Annotated[str, Field(max_length=1000)]
    """
    Your natural language query describing the SQL insight (max 1000 characters).
    """


class Data6(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    limit: float | None = None
    offset: float | None = None
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
    insightId: str


class InsightQueryInputSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: str


class Query1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Kind
    source: Any | None = None
    """
    For new insights, use the query from your successful query-run tool call. For updates, the existing query can optionally be reused
    """


class Data7(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    description: str | None = None
    filters: dict[str, Any] | None = None
    query: Query1
    favorited: bool | None = None
    dashboard: float | None = None
    tags: list[str] | None = None


class InsightUpdateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    insightId: str
    data: Data7


class LLMAnalyticsGetCostsSchema(BaseModel):
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


class ProjectEventDefinitionsSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    q: str | None = None
    """
    Search query to filter event names. Only use if there are lots of events.
    """


class ProjectGetAllSchema(BaseModel):
    pass
    model_config = ConfigDict(
        extra="forbid",
    )


class Type(StrEnum):
    """
    Type of properties to get
    """

    EVENT = "event"
    PERSON = "person"


class ProjectPropertyDefinitionsInputSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type
    """
    Type of properties to get
    """
    eventName: str | None = None
    """
    Event name to filter properties by, required for event type
    """
    includePredefinedProperties: bool | None = None
    """
    Whether to include predefined properties
    """


class ProjectSetActiveSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    projectId: Annotated[int, Field(gt=0)]


class DateRange(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    date_from: str | None = None
    date_to: str | None = None
    explicitDate: bool | None = None


class Properties(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Type1(StrEnum):
    AND_ = "AND"
    OR_ = "OR"


class Value(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Properties1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Properties2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Interval(StrEnum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class Math(StrEnum):
    TOTAL = "total"
    DAU = "dau"
    WEEKLY_ACTIVE = "weekly_active"
    MONTHLY_ACTIVE = "monthly_active"
    UNIQUE_SESSION = "unique_session"
    FIRST_TIME_FOR_USER = "first_time_for_user"
    FIRST_MATCHING_EVENT_FOR_USER = "first_matching_event_for_user"
    AVG = "avg"
    SUM = "sum"
    MIN = "min"
    MAX = "max"
    MEDIAN = "median"
    P75 = "p75"
    P90 = "p90"
    P95 = "p95"
    P99 = "p99"


class Properties3(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Properties4(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Properties5(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Series(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    custom_name: str
    """
    A display name
    """
    math: Math | None = None
    math_property: str | None = None
    properties: list[Properties3 | Properties4] | Properties5 | None = None
    kind: Literal["EventsNode"] = "EventsNode"
    event: str | None = None
    limit: float | None = None


class Display(StrEnum):
    ACTIONS_LINE_GRAPH = "ActionsLineGraph"
    ACTIONS_TABLE = "ActionsTable"
    ACTIONS_PIE = "ActionsPie"
    ACTIONS_BAR = "ActionsBar"
    ACTIONS_BAR_VALUE = "ActionsBarValue"
    WORLD_MAP = "WorldMap"
    BOLD_NUMBER = "BoldNumber"


class TrendsFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    display: Display | None = Display.ACTIONS_LINE_GRAPH
    showLegend: bool | None = False


class BreakdownType(StrEnum):
    PERSON = "person"
    EVENT = "event"


class BreakdownFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    breakdown_type: BreakdownType | None = BreakdownType.EVENT
    breakdown_limit: float | None = None
    breakdown: str | float | list[str | float] | None = None


class CompareFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    compare: bool | None = False
    compare_to: str | None = None


class Source(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dateRange: DateRange | None = None
    filterTestAccounts: bool | None = False
    properties: list[Properties | Properties1] | Properties2 | None = []
    kind: Literal["TrendsQuery"] = "TrendsQuery"
    interval: Interval | None = Interval.DAY
    series: list[Series]
    trendsFilter: TrendsFilter | None = None
    breakdownFilter: BreakdownFilter | None = None
    compareFilter: CompareFilter | None = None
    conversionGoal: Any = None


class Properties6(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Properties7(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Properties8(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Properties9(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Properties10(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Properties11(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Series1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    custom_name: str
    """
    A display name
    """
    math: Math | None = None
    math_property: str | None = None
    properties: list[Properties9 | Properties10] | Properties11 | None = None
    kind: Literal["EventsNode"] = "EventsNode"
    event: str | None = None
    limit: float | None = None


class Layout(StrEnum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"


class BreakdownAttributionType(StrEnum):
    FIRST_TOUCH = "first_touch"
    LAST_TOUCH = "last_touch"
    ALL_EVENTS = "all_events"


class FunnelOrderType(StrEnum):
    ORDERED = "ordered"
    UNORDERED = "unordered"
    STRICT = "strict"


class FunnelVizType(StrEnum):
    STEPS = "steps"
    TIME_TO_CONVERT = "time_to_convert"
    TRENDS = "trends"


class FunnelWindowIntervalUnit(StrEnum):
    MINUTE = "minute"
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


class FunnelStepReference(StrEnum):
    TOTAL = "total"
    PREVIOUS = "previous"


class FunnelsFilter(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    layout: Layout | None = None
    breakdownAttributionType: BreakdownAttributionType | None = None
    breakdownAttributionValue: float | None = None
    funnelToStep: float | None = None
    funnelFromStep: float | None = None
    funnelOrderType: FunnelOrderType | None = None
    funnelVizType: FunnelVizType | None = None
    funnelWindowInterval: float | None = 14
    funnelWindowIntervalUnit: FunnelWindowIntervalUnit | None = FunnelWindowIntervalUnit.DAY
    funnelStepReference: FunnelStepReference | None = None


class BreakdownFilter1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    breakdown_type: BreakdownType | None = BreakdownType.EVENT
    breakdown_limit: float | None = None
    breakdown: str | float | list[str | float] | None = None


class Source1(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    dateRange: DateRange | None = None
    filterTestAccounts: bool | None = False
    properties: list[Properties6 | Properties7] | Properties8 | None = []
    kind: Literal["FunnelsQuery"] = "FunnelsQuery"
    interval: Interval | None = Interval.DAY
    series: Annotated[list[Series1], Field(min_length=2)]
    funnelsFilter: FunnelsFilter | None = None
    breakdownFilter: BreakdownFilter1 | None = None


class Query2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Literal["InsightVizNode"] = "InsightVizNode"
    source: Source | Source1


class Properties12(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    value: str | float | list[str] | list[float] | None = None
    operator: str | None = None
    type: str | None = None


class Properties13(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    type: Type1
    values: list[Value]


class Filters2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    properties: list[Properties12 | Properties13] | None = None
    dateRange: DateRange | None = None
    filterTestAccounts: bool | None = None


class Source2(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Literal["HogQLQuery"] = "HogQLQuery"
    query: str
    filters: Filters2 | None = None


class Query3(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    kind: Literal["DataVisualizationNode"] = "DataVisualizationNode"
    source: Source2


class QueryRunInputSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    query: Query2 | Query3
