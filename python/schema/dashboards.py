from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DashboardCreatedBy(BaseModel):
    email: str


class Dashboard(BaseModel):
    id: int = Field(gt=0)
    name: str
    description: Optional[str] = None
    pinned: Optional[bool] = None
    created_at: str
    created_by: Optional[DashboardCreatedBy] = None
    is_shared: Optional[bool] = None
    deleted: Optional[bool] = None
    filters: Optional[Dict[str, Any]] = None
    variables: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    tiles: Optional[List[Dict[str, Any]]] = None


class CreateDashboardInput(BaseModel):
    name: str = Field(min_length=1, description="Dashboard name is required")
    description: Optional[str] = None
    pinned: bool = False
    tags: Optional[List[str]] = None


class UpdateDashboardInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pinned: Optional[bool] = None
    tags: Optional[List[str]] = None


class ListDashboards(BaseModel):
    limit: Optional[int] = Field(None, gt=0)
    offset: Optional[int] = Field(None, ge=0)
    search: Optional[str] = None
    pinned: Optional[bool] = None


class AddInsightToDashboard(BaseModel):
    insight_id: int = Field(gt=0)
    dashboard_id: int = Field(gt=0)