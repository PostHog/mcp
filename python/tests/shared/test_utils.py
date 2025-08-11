import json
import os
import random
import string
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from api.client import ApiClient, ApiConfig
from lib.config import PostHogToolConfig
from lib.utils.cache.memory_cache import MemoryCache
from schema.query import DateRange, HogQLFilters, HogQLQuery, InsightQuery
from tools.types import Context


def load_env_test_file():
    """Load environment variables from .env.test file."""
    # Look for .env.test in the project root (parent of python directory)
    env_test_path = Path(__file__).parent.parent.parent.parent / ".env.test"
    if env_test_path.exists():
        with open(env_test_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    # Remove quotes if present
                    value = value.strip("\"'")
                    os.environ[key] = value


# Load environment variables from .env.test
load_env_test_file()

API_BASE_URL = os.getenv("TEST_API_BASE_URL", "http://localhost:8010")
PERSONAL_API_KEY = os.getenv("TEST_PERSONAL_API_KEY", "")
TEST_ORG_ID = os.getenv("TEST_ORG_ID", "")
TEST_PROJECT_ID = os.getenv("TEST_PROJECT_ID", "")


@dataclass
class CreatedResources:
    feature_flags: list[int]
    insights: list[int]
    dashboards: list[int]

    def __init__(self):
        self.feature_flags = []
        self.insights = []
        self.dashboards = []


def validate_environment_variables():
    """Validate that required environment variables are set."""
    if not PERSONAL_API_KEY:
        raise ValueError("TEST_PERSONAL_API_KEY environment variable is required")

    if not TEST_ORG_ID:
        raise ValueError("TEST_ORG_ID environment variable is required")

    if not TEST_PROJECT_ID:
        raise ValueError("TEST_PROJECT_ID environment variable is required")


def create_test_client() -> ApiClient:
    """Create a test API client."""
    return ApiClient(ApiConfig(personal_api_key=PERSONAL_API_KEY, base_url=API_BASE_URL))


def create_test_context(client: ApiClient) -> Context:
    """Create a test context with mocked cache and helper functions."""
    cache = MemoryCache()
    config = PostHogToolConfig(
        personal_api_key=PERSONAL_API_KEY,
        api_base_url=API_BASE_URL,
        inkeep_api_key=os.getenv("INKEEP_API_KEY"),
        dev=os.getenv("DEV", "false").lower() in ("true", "1", "yes"),
    )

    async def get_project_id() -> str:
        project_id = await cache.get("project_id")
        if project_id is None:
            raise Exception("No active project set")
        return project_id

    async def get_org_id() -> str:
        org_id = await cache.get("org_id")
        if org_id is None:
            raise Exception("No active organization set")
        return org_id

    async def get_distinct_id() -> str:
        distinct_id = await cache.get("distinct_id")
        return distinct_id or uuid.uuid4().hex

    return Context(
        api=client,
        cache=cache,
        config=config,
        get_project_id=get_project_id,
        get_org_id=get_org_id,
        get_distinct_id=get_distinct_id,
    )


async def set_active_project_and_org(context: Context, project_id: str, org_id: str):
    """Set active project and organization in the cache."""
    await context.cache.set("project_id", project_id)
    await context.cache.set("org_id", org_id)


async def cleanup_resources(client: ApiClient, project_id: str, resources: CreatedResources):
    """Clean up test resources."""

    # Clean up feature flags
    for flag_id in resources.feature_flags:
        try:
            await client.feature_flags(project_id).delete(flag_id)
        except Exception as e:
            print(f"Failed to cleanup feature flag {flag_id}: {e}")
    resources.feature_flags.clear()

    # Clean up insights
    for insight_id in resources.insights:
        try:
            await client.insights(project_id).delete(insight_id)
        except Exception as e:
            print(f"Failed to cleanup insight {insight_id}: {e}")
    resources.insights.clear()

    # Clean up dashboards
    for dashboard_id in resources.dashboards:
        try:
            await client.dashboards(project_id).delete(dashboard_id)
        except Exception as e:
            print(f"Failed to cleanup dashboard {dashboard_id}: {e}")
    resources.dashboards.clear()


def parse_tool_response(result: dict[str, Any]) -> Any:
    """Parse the JSON response from a tool execution."""
    assert "content" in result
    assert len(result["content"]) > 0
    content_item = result["content"][0]
    # Handle both dict and object formats
    if hasattr(content_item, "type") and hasattr(content_item, "text"):
        assert content_item.type == "text"
        return json.loads(content_item.text)
    else:
        assert content_item["type"] == "text"
        return json.loads(content_item["text"])


def generate_unique_key(prefix: str) -> str:
    """Generate a unique key for testing."""
    timestamp = int(time.time() * 1000)
    random_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
    return f"{prefix}-{timestamp}-{random_suffix}"


def create_sample_queries() -> dict[str, InsightQuery]:
    pageviews_query = InsightQuery(
        kind="DataVisualizationNode",
        source=HogQLQuery(
            kind="HogQLQuery",
            query="SELECT event, count() AS event_count FROM events WHERE timestamp >= now() - INTERVAL 7 DAY AND event = '$pageview' GROUP BY event ORDER BY event_count DESC LIMIT 10",
            filters=HogQLFilters(dateRange=DateRange(date_from="-7d", date_to="-1d")),
        ),
    )

    top_events_query = InsightQuery(
        kind="DataVisualizationNode",
        source=HogQLQuery(
            kind="HogQLQuery",
            query="SELECT event, count() AS event_count FROM events WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event ORDER BY event_count DESC LIMIT 10",
            filters=HogQLFilters(dateRange=DateRange(date_from="-7d", date_to="-1d")),
        ),
    )

    return {"pageviews": pageviews_query, "top_events": top_events_query}


SAMPLE_HOGQL_QUERIES = create_sample_queries()


# Sample feature flag filters for testing
SAMPLE_FEATURE_FLAG_FILTERS = {"groups": [{"properties": [], "rollout_percentage": 100}]}


SAMPLE_FEATURE_FLAG_FILTERS_WITH_PROPERTIES = {
    "groups": [
        {
            "properties": [{"key": "email", "value": "test@posthog.com", "operator": "exact", "type": "person"}],
            "rollout_percentage": 50,
        }
    ]
}
