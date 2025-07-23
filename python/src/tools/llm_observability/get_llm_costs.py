import json
from typing import Optional
from pydantic import BaseModel
from src.tools.types import Context, Tool, ToolResult, TextContent


class GetLLMCostsParams(BaseModel):
    projectId: int
    days: Optional[int] = None


async def get_llm_costs_handler(context: Context, params: GetLLMCostsParams) -> ToolResult:
    days = params.days or 6

    trends_query = {
        "kind": "TrendsQuery",
        "dateRange": {
            "date_from": f"-{days}d",
            "date_to": None
        },
        "filterTestAccounts": True,
        "series": [{
            "event": "$ai_generation",
            "name": "$ai_generation", 
            "math": "sum",
            "math_property": "$ai_total_cost_usd",
            "kind": "EventsNode"
        }],
        "breakdownFilter": {
            "breakdown_type": "event",
            "breakdown": "$ai_model"
        }
    }

    costs_result = await context.api.query(str(params.projectId)).execute(trends_query)
    if not costs_result.success:
        raise Exception(f"Failed to get LLM costs: {costs_result.error}")

    return ToolResult(content=[TextContent(text=json.dumps(costs_result.data.results))])


def get_llm_costs_tool() -> Tool[GetLLMCostsParams]:
    return Tool(
        name="get-llm-total-costs-for-project",
        description="""
        - Fetches the total LLM daily costs for each model for a project over a given number of days.
        - If no number of days is provided, it defaults to 7.
        - The results are sorted by model name.
        - The total cost is rounded to 4 decimal places.
        - The query is executed against the project's data warehouse.
        - Show the results as a Markdown formatted table with the following information for each model:
            - Model name
            - Total cost in USD
            - Each day's date
            - Each day's cost in USD
        - Write in bold the model name with the highest total cost.
        - Properly render the markdown table in the response.
        """,
        schema=GetLLMCostsParams,
        handler=get_llm_costs_handler
    )