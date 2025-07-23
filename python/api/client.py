import json
from dataclasses import dataclass
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from lib.constants import BASE_URL
from lib.errors import ErrorCode
from lib.utils.api import with_pagination
from schema.api import ApiPropertyDefinition
from schema.dashboards import (
    AddInsightToDashboard,
    CreateDashboardInput,
    ListDashboards,
    UpdateDashboardInput,
)
from schema.flags import CreateFeatureFlagInput, UpdateFeatureFlagInput
from schema.insights import CreateInsightInput, ListInsights, UpdateInsightInput
from schema.orgs import Organization
from schema.projects import Project
from schema.properties import PropertyDefinition

T = TypeVar("T", bound=BaseModel)


@dataclass
class Result:
    success: bool
    data: Any | None = None
    error: Exception | None = None

    @classmethod
    def ok(cls, data: Any) -> "Result":
        return cls(success=True, data=data)

    @classmethod
    def err(cls, error: Exception) -> "Result":
        return cls(success=False, error=error)


@dataclass
class ApiConfig:
    api_token: str
    base_url: str | None = None


class ApiClient:
    def __init__(self, config: ApiConfig):
        self.config = config
        self.base_url = config.base_url or BASE_URL
        self.client = httpx.AsyncClient()

    def _build_headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.api_token}",
            "Content-Type": "application/json",
        }

    async def _fetch_with_schema(
        self,
        url: str,
        response_class: type[T],
        method: str = "GET",
        data: dict[str, Any] | None = None,
    ) -> Result:
        try:
            headers = self._build_headers()

            if method == "GET":
                response = await self.client.get(url, headers=headers)
            elif method == "POST":
                response = await self.client.post(
                    url, headers=headers, content=json.dumps(data) if data else None
                )
            elif method == "PATCH":
                response = await self.client.patch(
                    url, headers=headers, content=json.dumps(data) if data else None
                )
            elif method == "DELETE":
                response = await self.client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            if not response.is_success:
                if response.status_code == 401:
                    raise Exception(ErrorCode.INVALID_API_KEY)

                try:
                    error_data = response.json()
                    if error_data.get("type") == "validation_error" and error_data.get("code"):
                        raise Exception(f"Validation error: {error_data['code']}")
                except:
                    pass

                raise Exception(f"Request failed: {response.text}")

            raw_data = response.json()

            try:
                validated_data = response_class.model_validate(raw_data)
                return Result.ok(validated_data)
            except ValidationError as e:
                raise Exception(f"Response validation failed: {e}")

        except Exception as error:
            return Result.err(error)

    def organizations(self):
        return OrganizationResource(self)

    def projects(self):
        return ProjectResource(self)

    def feature_flags(self, project_id: str):
        return FeatureFlagResource(self, project_id)

    def insights(self, project_id: str):
        return InsightResource(self, project_id)

    def dashboards(self, project_id: str):
        return DashboardResource(self, project_id)

    def query(self, project_id: str):
        return QueryResource(self, project_id)

    def users(self):
        return UserResource(self)

    async def close(self):
        await self.client.aclose()


class OrganizationResource:
    def __init__(self, client: ApiClient):
        self.client = client

    async def list(self) -> Result:
        class OrgListResponse(BaseModel):
            results: list[Organization]

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/organizations/", OrgListResponse
        )

        if result.success:
            return Result.ok(result.data.results)
        return result

    async def get(self, org_id: str) -> Result:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/organizations/{org_id}/", Organization
        )

    def projects(self, org_id: str):
        return OrganizationProjectResource(self.client, org_id)


class OrganizationProjectResource:
    def __init__(self, client: ApiClient, org_id: str):
        self.client = client
        self.org_id = org_id

    async def list(self) -> Result:
        class ProjectListResponse(BaseModel):
            results: list[Project]

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/organizations/{self.org_id}/projects/", ProjectListResponse
        )

        if result.success:
            return Result.ok(result.data.results)
        return result


class ProjectResource:
    def __init__(self, client: ApiClient):
        self.client = client

    async def get(self, project_id: str) -> Result:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{project_id}/", Project
        )

    async def property_definitions(self, project_id: str) -> Result:
        try:
            property_definitions = await with_pagination(
                f"{self.client.base_url}/api/projects/{project_id}/property_definitions/",
                self.client.config.api_token,
                ApiPropertyDefinition,
            )

            filtered_definitions = [def_ for def_ in property_definitions if not def_.hidden]

            validated = [
                PropertyDefinition(name=def_.name, property_type=def_.property_type)
                for def_ in filtered_definitions
            ]

            return Result.ok(validated)
        except Exception as error:
            return Result.err(error)


class FeatureFlagResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self) -> Result:
        try:

            class FeatureFlagListItem(BaseModel):
                id: int
                key: str
                name: str
                active: bool

            flags = await with_pagination(
                f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/",
                self.client.config.api_token,
                FeatureFlagListItem,
            )

            return Result.ok(flags)
        except Exception as error:
            return Result.err(error)

    async def get(self, flag_id: int) -> Result:
        class FeatureFlagGetResponse(BaseModel):
            id: int
            key: str
            name: str
            active: bool
            description: str | None = None

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            FeatureFlagGetResponse,
        )

    async def find_by_key(self, key: str) -> Result:
        list_result = await self.list()
        if not list_result.success:
            return list_result

        for flag in list_result.data:
            if flag.key == key:
                return Result.ok(flag)

        return Result.ok(None)

    async def create(self, data: CreateFeatureFlagInput) -> Result:
        class FeatureFlagCreateResponse(BaseModel):
            id: int
            key: str
            name: str
            active: bool

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/",
            FeatureFlagCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def update(self, key: str, data: UpdateFeatureFlagInput) -> Result:
        find_result = await self.find_by_key(key)
        if not find_result.success:
            return find_result

        if not find_result.data:
            return Result.err(Exception(f"Feature flag with key '{key}' not found"))

        flag_id = find_result.data.id

        class FeatureFlagUpdateResponse(BaseModel):
            id: int
            key: str
            name: str
            active: bool

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            FeatureFlagUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, flag_id: int) -> Result:
        class DeleteResponse(BaseModel):
            success: bool = True
            message: str = "Feature flag deleted successfully"

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if result.success:
            return Result.ok({"success": True, "message": "Feature flag deleted successfully"})
        return result


class InsightResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self, params: ListInsights | None = None) -> Result:
        class InsightListItem(BaseModel):
            id: int
            name: str
            short_id: str
            description: str | None = None

        url = f"{self.client.base_url}/api/projects/{self.project_id}/insights/"
        if params:
            query_params = params.model_dump(exclude_unset=True)
            if query_params:
                url += "?" + "&".join([f"{k}={v}" for k, v in query_params.items()])

        try:
            insights = await with_pagination(url, self.client.config.api_token, InsightListItem)
            return Result.ok(insights)
        except Exception as error:
            return Result.err(error)

    async def create(self, data: CreateInsightInput) -> Result:
        class InsightCreateResponse(BaseModel):
            id: int
            name: str
            short_id: str

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/",
            InsightCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def get(self, insight_id: int) -> Result:
        class InsightGetResponse(BaseModel):
            id: int
            name: str
            short_id: str
            description: str | None = None

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            InsightGetResponse,
        )

    async def update(self, insight_id: int, data: UpdateInsightInput) -> Result:
        class InsightUpdateResponse(BaseModel):
            id: int
            name: str
            short_id: str

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            InsightUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, insight_id: int) -> Result:
        class DeleteResponse(BaseModel):
            success: bool = True
            message: str = "Insight deleted successfully"

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if result.success:
            return Result.ok({"success": True, "message": "Insight deleted successfully"})
        return result

    async def sql_insight(self, query: str) -> Result:
        class SQLInsightResponse(BaseModel):
            columns: list[str]
            results: list[list[Any]]

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/environments/{self.project_id}/max_tools/create_and_query_insight/",
            dict,  # Raw response handling
            method="POST",
            data={"query": query},
        )

        if result.success:
            # Parse the complex response structure
            try:
                response_data = result.data
                if isinstance(response_data, list) and len(response_data) > 0:
                    first_item = response_data[0]
                    if "data" in first_item:
                        data = first_item["data"]
                        columns = data.get("columns", [])
                        results = data.get("results", [])
                        return Result.ok({"columns": columns, "results": results})

                return Result.err(Exception("Unexpected response format from SQL insight"))
            except Exception as e:
                return Result.err(e)

        return result


class DashboardResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self, params: ListDashboards | None = None) -> Result:
        class DashboardListItem(BaseModel):
            id: int
            name: str
            description: str | None = None

        url = f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/"
        if params:
            query_params = params.model_dump(exclude_unset=True)
            if query_params:
                url += "?" + "&".join([f"{k}={v}" for k, v in query_params.items()])

        try:
            dashboards = await with_pagination(url, self.client.config.api_token, DashboardListItem)
            return Result.ok(dashboards)
        except Exception as error:
            return Result.err(error)

    async def get(self, dashboard_id: int) -> Result:
        class DashboardGetResponse(BaseModel):
            id: int
            name: str
            description: str | None = None

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DashboardGetResponse,
        )

    async def create(self, data: CreateDashboardInput) -> Result:
        class DashboardCreateResponse(BaseModel):
            id: int
            name: str

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/",
            DashboardCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def update(self, dashboard_id: int, data: UpdateDashboardInput) -> Result:
        class DashboardUpdateResponse(BaseModel):
            id: int
            name: str

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DashboardUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, dashboard_id: int) -> Result:
        class DeleteResponse(BaseModel):
            success: bool = True
            message: str = "Dashboard deleted successfully"

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if result.success:
            return Result.ok({"success": True, "message": "Dashboard deleted successfully"})
        return result

    async def add_insight(self, data: AddInsightToDashboard) -> Result:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{data.insight_id}/",
            dict,
            method="PATCH",
            data={"dashboard": data.dashboard_id},
        )


class QueryResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def execute(self, query_body: dict[str, Any]) -> Result:
        class QueryResponse(BaseModel):
            results: list[Any]

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/environments/{self.project_id}/query/",
            QueryResponse,
            method="POST",
            data=query_body,
        )


class UserResource:
    def __init__(self, client: ApiClient):
        self.client = client

    async def me(self) -> Result:
        class UserResponse(BaseModel):
            distinct_id: str

        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/users/@me/", UserResponse
        )

        if result.success:
            return Result.ok({"distinctId": result.data.distinct_id})
        return result
