import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from tests.shared.test_utils import (
    validate_environment_variables,
    create_test_client,
    create_test_context,
    set_active_project_and_org,
    cleanup_resources,
    parse_tool_response,
    TEST_PROJECT_ID,
    TEST_ORG_ID,
    CreatedResources
)
from src.tools.error_tracking.list_errors import list_errors_tool
from src.tools.error_tracking.error_details import error_details_tool
from src.tools.types import Context
from src.schema.errors import OrderByErrors, OrderDirectionErrors, StatusErrors


class TestErrorTracking:
    """Integration tests for error tracking tools."""
    
    @pytest.fixture(scope="class", autouse=True)
    def setup_class(self):
        """Validate environment variables before running tests."""
        validate_environment_variables()
    
    @pytest_asyncio.fixture
    async def context(self):
        """Create test context and set active project/org."""
        client = create_test_client()
        ctx = create_test_context(client)
        await set_active_project_and_org(ctx, TEST_PROJECT_ID, TEST_ORG_ID)
        yield ctx
        await client.close()
    
    @pytest.fixture
    def created_resources(self):
        """Track created resources for cleanup."""
        return CreatedResources()
    
    @pytest_asyncio.fixture(autouse=True)
    async def cleanup(self, context, created_resources):
        """Clean up resources after each test."""
        yield
        await cleanup_resources(context.api, TEST_PROJECT_ID, created_resources)

    @pytest.mark.asyncio
    async def test_list_errors_with_default_parameters(self, context: Context, created_resources: CreatedResources):
        """Test listing errors with default parameters."""
        tool = list_errors_tool()
        params = tool.schema()

        result = await tool.execute(context, params)
        error_data = parse_tool_response(result.__dict__)

        assert isinstance(error_data, list)

    @pytest.mark.asyncio
    async def test_list_errors_with_custom_date_range(self, context: Context, created_resources: CreatedResources):
        """Test listing errors with custom date range."""
        tool = list_errors_tool()
        
        date_from = datetime.now() - timedelta(days=14)
        date_to = datetime.now()
        
        params = tool.schema(
            dateFrom=date_from,
            dateTo=date_to,
            orderBy=OrderByErrors.OCCURRENCES,
            orderDirection=OrderDirectionErrors.DESCENDING
        )

        result = await tool.execute(context, params)
        error_data = parse_tool_response(result.__dict__)

        assert isinstance(error_data, list)

    @pytest.mark.asyncio
    async def test_filter_by_status(self, context: Context, created_resources: CreatedResources):
        """Test filtering errors by status."""
        tool = list_errors_tool()
        params = tool.schema(status=StatusErrors.ACTIVE)

        result = await tool.execute(context, params)
        error_data = parse_tool_response(result.__dict__)

        assert isinstance(error_data, list)

    @pytest.mark.asyncio
    async def test_handle_empty_results(self, context: Context, created_resources: CreatedResources):
        """Test handling empty results with narrow date range."""
        tool = list_errors_tool()
        
        # Very narrow date range in the past to likely get no results
        date_from = datetime.now() - timedelta(minutes=1)
        date_to = datetime.now() - timedelta(seconds=30)
        
        params = tool.schema(
            dateFrom=date_from,
            dateTo=date_to
        )

        result = await tool.execute(context, params)
        error_data = parse_tool_response(result.__dict__)

        assert isinstance(error_data, list)

    @pytest.mark.asyncio
    async def test_get_error_details_by_issue_id(self, context: Context, created_resources: CreatedResources):
        """Test getting error details by issue ID."""
        tool = error_details_tool()
        test_issue_id = "00000000-0000-0000-0000-000000000000"
        
        params = tool.schema(issueId=test_issue_id)

        result = await tool.execute(context, params)
        error_details = parse_tool_response(result.__dict__)

        assert isinstance(error_details, list)

    @pytest.mark.asyncio
    async def test_get_error_details_with_custom_date_range(self, context: Context, created_resources: CreatedResources):
        """Test getting error details with custom date range."""
        tool = error_details_tool()
        test_issue_id = "00000000-0000-0000-0000-000000000000"
        
        date_from = datetime.now() - timedelta(days=7)
        date_to = datetime.now()
        
        params = tool.schema(
            issueId=test_issue_id,
            dateFrom=date_from,
            dateTo=date_to
        )

        result = await tool.execute(context, params)
        error_details = parse_tool_response(result.__dict__)

        assert isinstance(error_details, list)

    @pytest.mark.asyncio
    async def test_error_tracking_workflow(self, context: Context, created_resources: CreatedResources):
        """Test error tracking workflow: list errors and get details."""
        list_tool = list_errors_tool()
        details_tool = error_details_tool()

        # List errors
        list_params = list_tool.schema()
        list_result = await list_tool.execute(context, list_params)
        error_list = parse_tool_response(list_result.__dict__)

        assert isinstance(error_list, list)

        # If we have errors with issueId, get details for the first one
        # Otherwise, use a test UUID
        if error_list and len(error_list) > 0 and "issueId" in error_list[0]:
            first_error = error_list[0]
            details_params = details_tool.schema(issueId=first_error["issueId"])
        else:
            test_issue_id = "00000000-0000-0000-0000-000000000000"
            details_params = details_tool.schema(issueId=test_issue_id)

        details_result = await details_tool.execute(context, details_params)
        error_details = parse_tool_response(details_result.__dict__)

        assert isinstance(error_details, list)