import { ErrorTrackingDetailsSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = ErrorTrackingDetailsSchema;

type Params = z.infer<typeof schema>;

export const errorDetailsHandler = async (context: Context, params: Params) => {
	const { issueId, dateFrom, dateTo } = params;
	const projectId = await context.getProjectId();

	const errorQuery = {
		kind: "ErrorTrackingQuery",
		dateRange: {
			date_from: dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			date_to: dateTo || new Date().toISOString(),
		},
		volumeResolution: 0,
		issueId,
	};

	const errorsResult = await context.api.query({ projectId }).execute({ queryBody: errorQuery });
	if (!errorsResult.success) {
		throw new Error(`Failed to get error details: ${errorsResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(errorsResult.data.results) }],
	};
};

const definition = getToolDefinition("error-details");

const tool = (): Tool<typeof schema> => ({
	name: "error-details",
	description: definition.description,
	schema,
	handler: errorDetailsHandler,
});

export default tool;
