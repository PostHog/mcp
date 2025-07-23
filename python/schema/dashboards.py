from typing import Any

from pydantic import BaseModel, Field


class DashboardCreatedBy(BaseModel):
    email: str


class Dashboard(BaseModel):
    id: int = Field(gt=0)
    name: str
    description: str | None = None
    pinned: bool | None = None
    created_at: str
    created_by: DashboardCreatedBy | None = None
    is_shared: bool | None = None
    deleted: bool | None = None
    filters: dict[str, Any] | None = None
    variables: dict[str, Any] | None = None
    tags: list[str] | None = None
    tiles: list[dict[str, Any]] | None = None


class CreateDashboardInput(BaseModel):
    name: str = Field(min_length=1, description="Dashboard name is required")
    description: str | None = None
    pinned: bool = False
    tags: list[str] | None = None


class UpdateDashboardInput(BaseModel):
    name: str | None = None
    description: str | None = None
    pinned: bool | None = None
    tags: list[str] | None = None


class ListDashboards(BaseModel):
    limit: int | None = Field(None, gt=0)
    offset: int | None = Field(None, ge=0)
    search: str | None = None
    pinned: bool | None = None


class AddInsightToDashboard(BaseModel):
    insight_id: int = Field(gt=0)
    dashboard_id: int = Field(gt=0)
