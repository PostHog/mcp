import json
from dataclasses import dataclass
from typing import Any, Generic, Literal, TypeGuard, TypeVar

import httpx
from pydantic import ValidationError

from lib.constants import BASE_URL
from lib.errors import ErrorCode
from lib.utils.api import with_pagination
from schema.api import (
    ApiPropertyDefinition,
    DashboardCreateResponse,
    DashboardGetResponse,
    DashboardListItem,
    DashboardUpdateResponse,
    DeleteResponse,
    FeatureFlagCreateResponse,
    FeatureFlagGetResponse,
    FeatureFlagListItem,
    FeatureFlagUpdateResponse,
    InsightCreateResponse,
    InsightGetResponse,
    InsightListItem,
    InsightUpdateResponse,
    OrgListResponse,
    ProjectListResponse,
    QueryResponse,
    UserResponse,
)
from schema.dashboards import AddInsightToDashboard, CreateDashboardInput, ListDashboards, UpdateDashboardInput
from schema.flags import CreateFeatureFlagInput, UpdateFeatureFlagInput
from schema.insights import CreateInsightInput, ListInsights, UpdateInsightInput
from schema.orgs import Organization
from schema.projects import Project
from schema.properties import PropertyDefinition

T = TypeVar("T")


@dataclass
class SuccessResult(Generic[T]):
    success: Literal[True]
    data: T

    def __init__(self, data: T):
        self.success = True
        self.data = data


@dataclass
class ErrorResult:
    success: Literal[False]
    error: Exception

    def __init__(self, error: Exception):
        self.success = False
        self.error = error


# Generic Result type with proper narrowing
Result = SuccessResult[T] | ErrorResult


# Type narrowing functions - these work with Python's type system
def is_success(result: Result[T]) -> TypeGuard[SuccessResult[T]]:
    """Type guard that narrows Result[T] to SuccessResult[T]"""
    return result.success


def is_error(result: Result[T]) -> TypeGuard[ErrorResult]:
    """Type guard that narrows Result[T] to ErrorResult"""
    return not result.success


# Helper function to propagate errors between different Result types
def propagate_error(error_result: ErrorResult) -> ErrorResult:
    """Propagate an error from one Result type to another"""
    return error_result  # ErrorResult is not generic, so we can return it directly


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
    ) -> Result[T]:
        try:
            headers = self._build_headers()

            if method == "GET":
                response = await self.client.get(url, headers=headers)
            elif method == "POST":
                response = await self.client.post(url, headers=headers, content=json.dumps(data) if data else None)
            elif method == "PATCH":
                response = await self.client.patch(url, headers=headers, content=json.dumps(data) if data else None)
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
                except Exception:
                    pass

                raise Exception(f"Request failed: {response.text}")

            raw_data = response.json()

            try:
                validated_data = response_class.model_validate(raw_data)
                return SuccessResult(validated_data)
            except ValidationError as e:
                raise Exception(f"Response validation failed: {e}") from e

        except Exception as error:
            return ErrorResult(error)

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

    async def list(self) -> Result[list[Organization]]:
        result = await self.client._fetch_with_schema(f"{self.client.base_url}/api/organizations/", OrgListResponse)

        if is_success(result):
            return SuccessResult(result.data.results)

        assert is_error(result)

        return result

    async def get(self, org_id: str) -> Result[Organization]:
        return await self.client._fetch_with_schema(f"{self.client.base_url}/api/organizations/{org_id}/", Organization)

    def projects(self, org_id: str):
        return OrganizationProjectResource(self.client, org_id)


class OrganizationProjectResource:
    def __init__(self, client: ApiClient, org_id: str):
        self.client = client
        self.org_id = org_id

    async def list(self) -> Result[list[Project]]:
        result = await self.client._fetch_with_schema(f"{self.client.base_url}/api/organizations/{self.org_id}/projects/", ProjectListResponse)

        if is_success(result):
            return SuccessResult(result.data.results)

        assert is_error(result)
        # Result is Union[SuccessResult, ErrorResult], so if not success, must be error
        return result


class ProjectResource:
    def __init__(self, client: ApiClient):
        self.client = client

    async def get(self, project_id: str) -> Result[Project]:
        return await self.client._fetch_with_schema(f"{self.client.base_url}/api/projects/{project_id}/", Project)

    async def property_definitions(self, project_id: str) -> Result[list[PropertyDefinition]]:
        try:
            property_definitions = await with_pagination(
                f"{self.client.base_url}/api/projects/{project_id}/property_definitions/",
                self.client.config.api_token,
                ApiPropertyDefinition,
            )

            filtered_definitions = [def_ for def_ in property_definitions if not def_.hidden]

            validated = [PropertyDefinition(name=def_.name, property_type=def_.property_type) for def_ in filtered_definitions]

            return SuccessResult(validated)
        except Exception as error:
            return ErrorResult(error)


class FeatureFlagResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self) -> Result[list[FeatureFlagListItem]]:
        try:
            flags = await with_pagination(
                f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/",
                self.client.config.api_token,
                FeatureFlagListItem,
            )

            return SuccessResult(flags)
        except Exception as error:
            return ErrorResult(error)

    async def get(self, flag_id: int) -> Result[FeatureFlagGetResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            FeatureFlagGetResponse,
        )

    async def find_by_key(self, key: str) -> Result[FeatureFlagListItem | None]:
        list_result = await self.list()
        if is_error(list_result):
            return list_result

        assert is_success(list_result)

        for flag in list_result.data:
            if flag.key == key:
                return SuccessResult(flag)

        return SuccessResult(None)

    async def create(self, data: CreateFeatureFlagInput) -> Result[FeatureFlagCreateResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/",
            FeatureFlagCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def update(self, key: str, data: UpdateFeatureFlagInput) -> Result[FeatureFlagUpdateResponse]:
        find_result = await self.find_by_key(key)
        if is_error(find_result):
            return find_result

        assert is_success(find_result)

        if find_result.data is None:
            return ErrorResult(Exception(f"Feature flag with key '{key}' not found"))

        flag_id = find_result.data.id

        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            FeatureFlagUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, flag_id: int) -> Result[dict]:
        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/feature_flags/{flag_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if is_success(result):
            return SuccessResult({"success": True, "message": "Feature flag deleted successfully"})

        assert is_error(result)

        return result


class InsightResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self, params: ListInsights | None = None) -> Result[list[InsightListItem]]:
        url = f"{self.client.base_url}/api/projects/{self.project_id}/insights/"
        if params:
            query_params = params.model_dump(exclude_unset=True)
            if query_params:
                url += "?" + "&".join([f"{k}={v}" for k, v in query_params.items()])

        try:
            insights = await with_pagination(url, self.client.config.api_token, InsightListItem)
            return SuccessResult(insights)
        except Exception as error:
            return ErrorResult(error)

    async def create(self, data: CreateInsightInput) -> Result[InsightCreateResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/",
            InsightCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def get(self, insight_id: int) -> Result[InsightGetResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            InsightGetResponse,
        )

    async def update(self, insight_id: int, data: UpdateInsightInput) -> Result[InsightUpdateResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            InsightUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, insight_id: int) -> Result[dict]:
        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/insights/{insight_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if is_success(result):
            return SuccessResult({"success": True, "message": "Insight deleted successfully"})
        # Result is Union[SuccessResult, ErrorResult], so if not success, must be

        assert is_error(result)

        return result

    async def sql_insight(self, query: str) -> Result[dict]:
        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/environments/{self.project_id}/max_tools/create_and_query_insight/",
            dict,  # Raw response handling
            method="POST",
            data={"query": query},
        )

        if is_success(result):
            # Parse the complex response structure
            try:
                response_data = result.data
                if isinstance(response_data, list) and len(response_data) > 0:
                    first_item = response_data[0]
                    if "data" in first_item:
                        data = first_item["data"]
                        columns = data.get("columns", [])
                        results = data.get("results", [])
                        return SuccessResult({"columns": columns, "results": results})

                return ErrorResult(Exception("Unexpected response format from SQL insight"))
            except Exception as e:
                return ErrorResult(e)
        # Result is Union[SuccessResult, ErrorResult], so if not success, must be error
        return result


class DashboardResource:
    def __init__(self, client: ApiClient, project_id: str):
        self.client = client
        self.project_id = project_id

    async def list(self, params: ListDashboards | None = None) -> Result[list[DashboardListItem]]:
        url = f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/"
        if params:
            query_params = params.model_dump(exclude_unset=True)
            if query_params:
                url += "?" + "&".join([f"{k}={v}" for k, v in query_params.items()])

        try:
            dashboards = await with_pagination(url, self.client.config.api_token, DashboardListItem)
            return SuccessResult(dashboards)
        except Exception as error:
            return ErrorResult(error)

    async def get(self, dashboard_id: int) -> Result[DashboardGetResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DashboardGetResponse,
        )

    async def create(self, data: CreateDashboardInput) -> Result[DashboardCreateResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/",
            DashboardCreateResponse,
            method="POST",
            data=data.model_dump(exclude_unset=True),
        )

    async def update(self, dashboard_id: int, data: UpdateDashboardInput) -> Result[DashboardUpdateResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DashboardUpdateResponse,
            method="PATCH",
            data=data.model_dump(exclude_unset=True),
        )

    async def delete(self, dashboard_id: int) -> Result[dict]:
        result = await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/projects/{self.project_id}/dashboards/{dashboard_id}/",
            DeleteResponse,
            method="PATCH",
            data={"deleted": True},
        )

        if is_success(result):
            return SuccessResult({"success": True, "message": "Dashboard deleted successfully"})

        assert is_error(result)

        return result

    async def add_insight(self, data: AddInsightToDashboard) -> Result[dict]:
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

    async def execute(self, query_body: dict[str, Any]) -> Result[QueryResponse]:
        return await self.client._fetch_with_schema(
            f"{self.client.base_url}/api/environments/{self.project_id}/query/",
            QueryResponse,
            method="POST",
            data=query_body,
        )


class UserResource:
    def __init__(self, client: ApiClient):
        self.client = client

    async def me(self) -> Result[dict]:
        result = await self.client._fetch_with_schema(f"{self.client.base_url}/api/users/@me/", UserResponse)

        if is_success(result):
            return SuccessResult({"distinctId": result.data.distinct_id})

        assert is_error(result)

        return result
