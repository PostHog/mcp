from pydantic import BaseModel, Field


class DateRange(BaseModel):
    date_from: str = Field(description="The start date of the date range. Could be a date string or a relative date string like '-7d'")
    date_to: str = Field(description="The end date of the date range. Could be a date string or a relative date string like '-1d'")


class HogQLFilters(BaseModel):
    dateRange: DateRange | None = None


class HogQLQuery(BaseModel):
    kind: str = "HogQLQuery"
    query: str
    explain: bool | None = None
    filters: HogQLFilters | None = None


class InsightQuery(BaseModel):
    kind: str = "DataVisualizationNode"
    source: HogQLQuery
