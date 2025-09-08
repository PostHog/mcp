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


class Type(StrEnum):
    """
    Experiment type: 'product' for backend/API changes, 'web' for frontend UI changes
    """

    PRODUCT = "product"
    WEB = "web"


class MetricType(StrEnum):
    """
    Metric type: 'mean' for average values (revenue, time spent), 'funnel' for conversion flows, 'ratio' for comparing two metrics
    """

    MEAN = "mean"
    FUNNEL = "funnel"
    RATIO = "ratio"


class PrimaryMetric(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    """
    Human-readable metric name
    """
    metric_type: MetricType
    """
    Metric type: 'mean' for average values (revenue, time spent), 'funnel' for conversion flows, 'ratio' for comparing two metrics
    """
    event_name: str | None = None
    """
    REQUIRED for metrics to work: PostHog event name (e.g., '$pageview', 'add_to_cart', 'purchase'). For funnels, this is the first step. Use '$pageview' if unsure. Search project-property-definitions tool for available events.
    """
    funnel_steps: list[str] | None = None
    """
    For funnel metrics only: Array of event names for each funnel step (e.g., ['product_view', 'add_to_cart', 'checkout', 'purchase'])
    """
    properties: dict[str, Any] | None = None
    """
    Event properties to filter on
    """
    description: str | None = None
    """
    What this metric measures and why it's important for the experiment
    """


class MetricType1(StrEnum):
    """
    Metric type: 'mean' for average values, 'funnel' for conversion flows, 'ratio' for comparing two metrics
    """

    MEAN = "mean"
    FUNNEL = "funnel"
    RATIO = "ratio"


class SecondaryMetric(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: str | None = None
    """
    Human-readable metric name
    """
    metric_type: MetricType1
    """
    Metric type: 'mean' for average values, 'funnel' for conversion flows, 'ratio' for comparing two metrics
    """
    event_name: str | None = None
    """
    REQUIRED: PostHog event name. Use '$pageview' if unsure.
    """
    funnel_steps: list[str] | None = None
    """
    For funnel metrics only: Array of event names for each funnel step
    """
    properties: dict[str, Any] | None = None
    """
    Event properties to filter on
    """
    description: str | None = None
    """
    What this secondary metric measures
    """


class Variant(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    key: str
    """
    Variant key (e.g., 'control', 'variant_a', 'new_design')
    """
    name: str | None = None
    """
    Human-readable variant name
    """
    rollout_percentage: Annotated[float, Field(ge=0.0, le=100.0)]
    """
    Percentage of users to show this variant
    """


class ExperimentCreateSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    name: Annotated[str, Field(min_length=1)]
    """
    Experiment name - should clearly describe what is being tested
    """
    description: str | None = None
    """
    Detailed description of the experiment hypothesis, what changes are being tested, and expected outcomes
    """
    feature_flag_key: str
    """
    Feature flag key (letters, numbers, hyphens, underscores only). IMPORTANT: First search for existing feature flags that might be suitable using the feature-flags-get-all tool, then suggest reusing existing ones or creating a new key based on the experiment name
    """
    type: Type | None = Type.PRODUCT
    """
    Experiment type: 'product' for backend/API changes, 'web' for frontend UI changes
    """
    primary_metrics: list[PrimaryMetric] | None = None
    """
    Primary metrics to measure experiment success. IMPORTANT: Each metric needs event_name to track data. For funnels, provide funnel_steps array with event names for each step. Ask user what events they track, or use project-property-definitions to find available events.
    """
    secondary_metrics: list[SecondaryMetric] | None = None
    """
    Secondary metrics to monitor for potential side effects or additional insights. Each metric needs event_name.
    """
    variants: list[Variant] | None = None
    """
    Experiment variants. If not specified, defaults to 50/50 control/test split. Ask user how many variants they need and what each tests
    """
    minimum_detectable_effect: float | None = 30
    """
    Minimum detectable effect in percentage. Lower values require more users but detect smaller changes. Suggest 20-30% for most experiments
    """
    filter_test_accounts: bool | None = True
    """
    Whether to filter out internal test accounts
    """
    target_properties: dict[str, Any] | None = None
    """
    Properties to target specific user segments (e.g., country, subscription type)
    """
    draft: bool | None = True
    """
    Create as draft (true) or launch immediately (false). Recommend draft for review first
    """
    holdout_id: float | None = None
    """
    Holdout group ID if this experiment should exclude users from other experiments
    """


class ExperimentExposureQueryToolSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    experimentId: float
    """
    The ID of the experiment to get exposure data for
    """
    refresh: bool
    """
    Force refresh of results instead of using cached values
    """


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


class ExperimentMetricResultsGetSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    experimentId: float
    """
    The ID of the experiment to get results for
    """
    refresh: bool
    """
    Force refresh of results instead of using cached values
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
    insightId: str


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
    insightId: str


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
    insightId: str


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
    insightId: str
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


class ProjectPropertyDefinitionsSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    eventName: str
    """
    Event name to filter properties by
    """


class ProjectSetActiveSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )
    projectId: Annotated[int, Field(gt=0)]
