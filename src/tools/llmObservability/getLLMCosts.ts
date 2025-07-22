import { z } from "zod";
import type { Context, Tool } from "../types";

const schema = z.object({
    projectId: z.string(),
    days: z.number().optional(),
});

type Params = z.infer<typeof schema>;

export const getLLMCostsHandler = async (context: Context, params: Params) => {
    const { projectId, days } = params;
    
    const trendsQuery = {
        kind: "TrendsQuery",
        dateRange: {
            date_from: `-${days || 6}d`,
            date_to: null,
        },
        filterTestAccounts: true,
        series: [
            {
                event: "$ai_generation",
                name: "$ai_generation",
                math: "sum",
                math_property: "$ai_total_cost_usd",
                kind: "EventsNode",
            },
        ],
        breakdownFilter: {
            breakdown_type: "event",
            breakdown: "$ai_model",
        },
    };

    const costsResult = await context.api
        .query({ projectId })
        .execute({ queryBody: trendsQuery });
    if (!costsResult.success) {
        throw new Error(`Failed to get LLM costs: ${costsResult.error.message}`);
    }
    return {
        content: [{ type: "text", text: JSON.stringify(costsResult.data.results) }],
    };
};

const tool = (): Tool<typeof schema> => ({
    name: "get-llm-total-costs-for-project",
    description: `
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
    `,
    schema,
    handler: getLLMCostsHandler,
});

export default tool;