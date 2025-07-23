import type { z } from "zod";
import type { Context, Tool } from "@/tools/types";
import { FeatureFlagGetDefinitionSchema } from "@/schema/tool-inputs";

const schema = FeatureFlagGetDefinitionSchema;

type Params = z.infer<typeof schema>;

export const getDefinitionHandler = async (context: Context, { flagId, flagKey }: Params) => {
	if (!flagId && !flagKey) {
		return {
			content: [
				{
					type: "text",
					text: "Error: Either flagId or flagKey must be provided.",
				},
			],
		};
	}

	const projectId = await context.getProjectId();

	if (flagId) {
		const flagResult = await context.api
			.featureFlags({ projectId })
			.get({ flagId: String(flagId) });
		if (!flagResult.success) {
			throw new Error(`Failed to get feature flag: ${flagResult.error.message}`);
		}
		return {
			content: [{ type: "text", text: JSON.stringify(flagResult.data) }],
		};
	}

	if (flagKey) {
		const flagResult = await context.api
			.featureFlags({ projectId })
			.findByKey({ key: flagKey });
		if (!flagResult.success) {
			throw new Error(`Failed to find feature flag: ${flagResult.error.message}`);
		}
		if (flagResult.data) {
			return {
				content: [{ type: "text", text: JSON.stringify(flagResult.data) }],
			};
		}
		return {
			content: [
				{
					type: "text",
					text: `Error: Flag with key "${flagKey}" not found.`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: "text",
				text: "Error: Could not determine or find the feature flag.",
			},
		],
	};
};

const tool = (): Tool<typeof schema> => ({
	name: "feature-flag-get-definition",
	description: `
        - Use this tool to get the definition of a feature flag. 
        - You can provide either the flagId or the flagKey. 
        - If you provide both, the flagId will be used.
    `,
	schema,
	handler: getDefinitionHandler,
});

export default tool;
