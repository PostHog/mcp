import json

from api.client import is_error, is_success
from schema.tool_inputs import LLMObservabilityGetCostsSchema
from tools.tool_definitions import get_tool_definition
from tools.types import Context, Tool, ToolResult


async def get_llm_costs_handler(context: Context, params: LLMObservabilityGetCostsSchema) -> ToolResult:
    days = int(params.days) if params.days else 6

    trends_query = {
        "kind": "TrendsQuery",
        "dateRange": {"date_from": f"-{days}d", "date_to": None},
        "filterTestAccounts": True,
        "series": [
            {
                "event": "$ai_generation",
                "name": "$ai_generation",
                "math": "sum",
                "math_property": "$ai_total_cost_usd",
                "kind": "EventsNode",
            }
        ],
        "breakdownFilter": {"breakdown_type": "event", "breakdown": "$ai_model"},
    }

    costs_result = await context.api.query(str(params.projectId)).execute({"query": trends_query})
    if is_error(costs_result):
        raise Exception(f"Failed to get LLM costs: {costs_result.error}")

    assert is_success(costs_result)

    return ToolResult(content=json.dumps(costs_result.data.results))


def get_llm_costs_tool() -> Tool[LLMObservabilityGetCostsSchema]:
    definition = get_tool_definition("get-llm-total-costs-for-project")

    return Tool(
        name="get-llm-total-costs-for-project",
        description=definition["description"],
        schema=LLMObservabilityGetCostsSchema,
        handler=get_llm_costs_handler,
    )
