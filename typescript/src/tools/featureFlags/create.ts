import { FeatureFlagCreateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = FeatureFlagCreateSchema;

type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
	const { name, key, description, filters, active, tags } = params;
	const projectId = await context.stateManager.getProjectId();

	const flagResult = await context.api.featureFlags({ projectId }).create({
		data: { name, key, description, filters, active, tags },
	});

	if (!flagResult.success) {
		throw new Error(`Failed to create feature flag: ${flagResult.error.message}`);
	}

	const featureFlagWithUrl = {
		...flagResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
	};

	return {
		content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
	};
};

const definition = getToolDefinition("create-feature-flag");

const tool = (): Tool<typeof schema> => ({
	name: "create-feature-flag",
	description: definition.description,
	schema,
	handler: createHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: false,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;
