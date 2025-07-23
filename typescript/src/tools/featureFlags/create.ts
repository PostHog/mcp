import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { getProjectBaseUrl } from "@/lib/utils/api";
import { FeatureFlagCreateSchema } from "@/schema/tool-inputs";

const schema = FeatureFlagCreateSchema;

type Params = z.infer<typeof schema>;

export const createHandler = async (context: Context, params: Params) => {
	const { name, key, description, filters, active, tags } = params;
	const projectId = await context.getProjectId();

	const flagResult = await context.api.featureFlags({ projectId }).create({
		data: { name, key, description, filters, active, tags },
	});

	if (!flagResult.success) {
		throw new Error(`Failed to create feature flag: ${flagResult.error.message}`);
	}

	const featureFlagWithUrl = {
		...flagResult.data,
		url: `${getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
	};

	return {
		content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "create-feature-flag",
	description: `Creates a new feature flag in the project. Once you have created a feature flag, you should:
     - Ask the user if they want to add it to their codebase
     - Use the "search-docs" tool to find documentation on how to add feature flags to the codebase (search for the right language / framework)
     - Clarify where it should be added and then add it.
    `,
	schema,
	handler: createHandler,
});

export default tool;
