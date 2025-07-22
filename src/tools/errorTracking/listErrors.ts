import { z } from "zod";
import type { Context, Tool } from "../types";
import { ListErrorsSchema } from "../../schema/errors";

const schema = z.object({
	data: ListErrorsSchema,
});

type Params = z.infer<typeof schema>;

export const listErrorsHandler = async (context: Context, params: Params) => {
	const { data } = params;
	const projectId = await context.getProjectId();

	const errorQuery = {
		kind: "ErrorTrackingQuery",
		orderBy: data.orderBy || "occurrences",
		dateRange: {
			date_from:
				data.dateFrom?.toISOString() ||
				new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
			date_to: data.dateTo?.toISOString() || new Date().toISOString(),
		},
		volumeResolution: 1,
		orderDirection: data.orderDirection || "DESC",
		filterTestAccounts: data.filterTestAccounts ?? true,
		status: data.status || "active",
	};

	const errorsResult = await context.api.query({ projectId }).execute({ queryBody: errorQuery });
	if (!errorsResult.success) {
		throw new Error(`Failed to list errors: ${errorsResult.error.message}`);
	}

	return {
		content: [{ type: "text", text: JSON.stringify(errorsResult.data.results) }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "list-errors",
	description: `
        - Use this tool to list errors in the project.
    `,
	schema,
	handler: listErrorsHandler,
});

export default tool;
