import { getProjectBaseUrl } from "@/lib/utils/api";
import { InsightQuerySchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = InsightQuerySchema;

type Params = z.infer<typeof schema>;

export const queryHandler = async (context: Context, params: Params) => {
	const { insightId, dateFrom, dateTo, refresh } = params;
	const projectId = await context.getProjectId();
	
	// Query the insight with parameters to get actual results
	const queryParams: {
		insightId: number;
		dateFrom?: string;
		dateTo?: string;
		refresh?: boolean;
	} = { insightId };
	
	if (dateFrom) queryParams.dateFrom = dateFrom;
	if (dateTo) queryParams.dateTo = dateTo;
	if (refresh !== undefined) queryParams.refresh = refresh;
	
	const queryResult = await context.api.insights({ projectId }).query(queryParams);
	if (!queryResult.success) {
		throw new Error(`Failed to query insight: ${queryResult.error.message}`);
	}

	// Get insight metadata for reference
	const insightResult = await context.api.insights({ projectId }).get({ insightId });
	if (!insightResult.success) {
		throw new Error(`Failed to get insight metadata: ${insightResult.error.message}`);
	}

	const responseData = {
		insight: {
			...insightResult.data,
			url: `${getProjectBaseUrl(projectId)}/insights/${insightResult.data.short_id}`,
		},
		results: queryResult.data.results,
		query_params: {
			dateFrom,
			dateTo,
			refresh,
		},
	};

	return { content: [{ type: "text", text: JSON.stringify(responseData) }] };
};

const definition = getToolDefinition("insight-query");

const tool = (): Tool<typeof schema> => ({
	name: "insight-query",
	description: definition.description,
	schema,
	handler: queryHandler,
});

export default tool;
