import { FeatureFlagUpdateSchema } from "@/schema/tool-inputs";
import { getToolDefinition } from "@/tools/toolDefinitions";
import type { Context, Tool } from "@/tools/types";
import type { z } from "zod";

const schema = FeatureFlagUpdateSchema;

type Params = z.infer<typeof schema>;

export const updateHandler = async (context: Context, params: Params) => {
	const { flagKey, data } = params;
	const projectId = await context.getProjectId();

	const flagResult = await context.api.featureFlags({ projectId }).update({
		key: flagKey,
		data: data,
	});

	if (!flagResult.success) {
		throw new Error(`Failed to update feature flag: ${flagResult.error.message}`);
	}

	const featureFlagWithUrl = {
		...flagResult.data,
		url: `${context.api.getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
	};

	return {
		content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
	};
};

const definition = getToolDefinition("update-feature-flag");

const tool = (): Tool<typeof schema> => ({
	name: "update-feature-flag",
	description: definition.description,
	schema,
	handler: updateHandler,
	annotations: {
		destructiveHint: false,
		idempotentHint: true,
		openWorldHint: true,
		readOnlyHint: false,
	},
});

export default tool;
