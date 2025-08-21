import { FeatureFlagGetAllSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = FeatureFlagGetAllSchema;

type Params = z.infer<typeof schema>;

export const getAllHandler = async (context: Context, _params: Params) => {
	const projectId = await context.stateManager.getProjectId();

	const flagsResult = await context.api.featureFlags({ projectId }).list();

	if (!flagsResult.success) {
		throw new Error(`Failed to get feature flags: ${flagsResult.error.message}`);
	}

	return { content: [{ type: "text", text: JSON.stringify(flagsResult.data) }] };
};

const definition = getToolDefinition("feature-flag-get-all");

const tool = (): Tool<typeof schema> => ({
	name: "feature-flag-get-all",
	description: definition.description,
	schema,
	handler: getAllHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: true,
	},
});

export default tool;
